import { prisma } from "../../lib/prisma";
import { sendNewMessageEmail } from "../../services/email";

export class CommunicationService {
  /* ================================================================== */
  /*  GET MESSAGES — threaded conversation list                          */
  /* ================================================================== */

  static async getMessages(tenantId: string, userId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    // Get top-level messages (no parentId) that the user participates in
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          tenantId,
          parentId: null,
          participants: { some: { userId } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          participants: {
            select: {
              userId: true,
              isRead: true,
              readAt: true,
              user: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
          },
          replies: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              content: true,
              createdAt: true,
              participants: {
                select: {
                  userId: true,
                  isRead: true,
                  user: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.message.count({
        where: {
          tenantId,
          parentId: null,
          participants: { some: { userId } },
        },
      }),
    ]);

    // Enrich each message with reply count and last reply info
    const enriched = messages.map((msg) => {
      const replyCount = msg.replies.length;
      const lastReply = replyCount > 0 ? msg.replies[replyCount - 1] : null;
      const myParticipant = msg.participants.find((p) => p.userId === userId);
      const isUnread = myParticipant ? !myParticipant.isRead : false;

      // Check if any reply is unread
      const hasUnreadReply = msg.replies.some((reply) => {
        const rp = reply.participants.find((p) => p.userId === userId);
        return rp && !rp.isRead;
      });

      return {
        ...msg,
        replyCount,
        lastReply: lastReply
          ? {
              id: lastReply.id,
              content: lastReply.content,
              createdAt: lastReply.createdAt,
              sender: lastReply.participants[0]?.user || null,
            }
          : null,
        isUnread: isUnread || hasUnreadReply,
      };
    });

    return {
      data: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /* ================================================================== */
  /*  GET THREAD — full conversation with all replies                    */
  /* ================================================================== */

  static async getThread(tenantId: string, userId: string, messageId: string) {
    // Get the root message
    const root = await prisma.message.findFirst({
      where: {
        id: messageId,
        tenantId,
        participants: { some: { userId } },
      },
      include: {
        participants: {
          select: {
            userId: true,
            isRead: true,
            readAt: true,
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!root) {
      throw new Error("Message not found");
    }

    // Get all replies
    const replies = await prisma.message.findMany({
      where: {
        parentId: messageId,
        tenantId,
      },
      orderBy: { createdAt: "asc" },
      include: {
        participants: {
          select: {
            userId: true,
            isRead: true,
            readAt: true,
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    // Mark all as read
    const allMessageIds = [messageId, ...replies.map((r) => r.id)];
    await prisma.messageParticipant.updateMany({
      where: {
        messageId: { in: allMessageIds },
        userId,
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    return {
      data: {
        ...root,
        replies,
      },
    };
  }

  /* ================================================================== */
  /*  SEND MESSAGE — creates new thread or reply                        */
  /* ================================================================== */

  static async sendMessage(
    tenantId: string,
    senderId: string,
    recipientIds: string[],
    content: string,
    subject?: string,
    parentId?: string,
  ) {
    // If this is a reply, validate the parent exists and sender has access
    if (parentId) {
      const parent = await prisma.message.findFirst({
        where: {
          id: parentId,
          tenantId,
          participants: { some: { userId: senderId } },
        },
      });
      if (!parent) {
        throw new Error("Parent message not found");
      }

      // For replies, inherit subject from parent if not provided
      if (!subject) {
        subject = parent.subject || undefined;
      }
    }

    // If this is a new thread (not a reply), recipientIds are required
    if (!parentId && (!recipientIds || recipientIds.length === 0)) {
      throw new Error("At least one recipient is required");
    }

    const message = await prisma.$transaction(async (tx) => {
      // For replies, get original participants as recipients if none specified
      let finalRecipientIds = recipientIds;
      if (parentId && (!recipientIds || recipientIds.length === 0)) {
        // Reply to all participants in the thread
        const parentParticipants = await tx.messageParticipant.findMany({
          where: { messageId: parentId, userId: { not: senderId } },
          select: { userId: true },
        });

        // Also check root message if parent is itself a reply
        const rootMessage = await tx.message.findFirst({
          where: { id: parentId },
          select: { parentId: true },
        });

        if (rootMessage?.parentId) {
          const rootParticipants = await tx.messageParticipant.findMany({
            where: { messageId: rootMessage.parentId, userId: { not: senderId } },
            select: { userId: true },
          });
          const allIds = new Set([
            ...parentParticipants.map((p) => p.userId),
            ...rootParticipants.map((p) => p.userId),
          ]);
          finalRecipientIds = Array.from(allIds);
        } else {
          finalRecipientIds = parentParticipants.map((p) => p.userId);
        }
      }

      // Validate recipients are active users in the tenant
      const validRecipients = await tx.user.findMany({
        where: {
          tenantId,
          id: { in: finalRecipientIds },
          status: "ACTIVE",
        },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      // Create the message
      const msg = await tx.message.create({
        data: {
          tenantId,
          parentId: parentId || null,
          subject: subject || null,
          content,
          participants: {
            create: [
              { userId: senderId },
              ...validRecipients.map((r) => ({ userId: r.id })),
            ],
          },
        },
        include: {
          participants: {
            select: {
              userId: true,
              user: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
            },
          },
        },
      });

      // Get sender info for email
      const sender = await tx.user.findUnique({
        where: { id: senderId },
        select: { firstName: true, lastName: true },
      });

      // Get school name from tenant
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, settings: true },
      });

      const settings = (tenant?.settings as Record<string, string>) || {};
      const schoolName = tenant?.name || settings.schoolName || "School";

      const senderName = sender
        ? `${sender.firstName || ""} ${sender.lastName || ""}`.trim() || "Someone"
        : "Someone";

      // Send email notifications (non-blocking)
      for (const recipient of validRecipients) {
        const recipientName = `${recipient.firstName || ""} ${recipient.lastName || ""}`.trim() || recipient.email;
        sendNewMessageEmail({
          recipientEmail: recipient.email,
          recipientName,
          senderName,
          subject: subject || null,
          content,
          schoolName,
          isReply: !!parentId,
        }).catch((err) => console.error("Email notification failed:", err));
      }

      return msg;
    });

    return message;
  }

  /* ================================================================== */
  /*  MARK AS READ                                                      */
  /* ================================================================== */

  static async markMessageRead(tenantId: string, userId: string, messageId: string) {
    const participant = await prisma.messageParticipant.findFirst({
      where: { messageId, userId },
      include: { message: { select: { tenantId: true } } },
    });

    if (!participant || participant.message.tenantId !== tenantId) {
      throw new Error("Message not found");
    }

    return prisma.messageParticipant.update({
      where: { id: participant.id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /* ================================================================== */
  /*  ANNOUNCEMENTS                                                     */
  /* ================================================================== */

  static async getAnnouncements(tenantId: string, userId: string, classId?: string) {
    return prisma.announcement.findMany({
      where: {
        tenantId,
        OR: [
          { classId: null },
          ...(classId ? [{ classId }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        participants: {
          where: { userId },
          select: { isRead: true },
        },
      },
    });
  }

  static async createAnnouncement(
    tenantId: string,
    userId: string,
    title: string,
    body: string,
    classId?: string,
  ) {
    return prisma.announcement.create({
      data: {
        tenantId,
        title,
        body,
        classId: classId ?? null,
        createdBy: userId,
      },
    });
  }

  static async markAnnouncementRead(tenantId: string, userId: string, announcementId: string) {
    const announcement = await prisma.announcement.findFirst({
      where: { tenantId, id: announcementId },
    });

    if (!announcement) {
      throw new Error("Announcement not found");
    }

    const existing = await prisma.announcementParticipant.findFirst({
      where: { announcementId, userId },
    });

    if (existing) {
      await prisma.announcementParticipant.update({
        where: { id: existing.id },
        data: { isRead: true, readAt: new Date() },
      });
    } else {
      await prisma.announcementParticipant.create({
        data: { announcementId, userId, isRead: true, readAt: new Date() },
      });
    }

    return { success: true };
  }

  /* ================================================================== */
  /*  UNREAD COUNTS                                                      */
  /* ================================================================== */

  static async getUnreadCounts(tenantId: string, userId: string) {
    const [unreadMessages, unreadAnnouncements] = await Promise.all([
      prisma.messageParticipant.count({
        where: {
          userId,
          isRead: false,
          message: { tenantId },
        },
      }),
      prisma.announcementParticipant.count({
        where: {
          userId,
          isRead: false,
          announcement: { tenantId },
        },
      }),
    ]);

    return { unreadMessages, unreadAnnouncements };
  }

  /* ================================================================== */
  /*  GET USERS for recipient picker                                    */
  /* ================================================================== */

  static async getConversationUsers(tenantId: string, currentUserId: string) {
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        id: { not: currentUserId },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: { select: { name: true } },
      },
      orderBy: { firstName: "asc" },
    });

    return users.map((u) => ({
      id: u.id,
      name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
      email: u.email,
      role: u.role.name,
    }));
  }
}

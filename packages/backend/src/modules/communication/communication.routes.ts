import { Router, Response } from "express";
import { z } from "zod";
import { CommunicationService } from "./communication.service";
import { validate } from "../../core/middleware/validation";
import { authenticate, AuthRequest } from "../../core/middleware/auth.middleware";
import { requirePermission } from "../../core/middleware/rbac.middleware";
import { auditLogMiddleware } from "../../core/middleware/audit.middleware";

const router = Router();

/* ================================================================== */
/*  MESSAGES                                                           */
/* ================================================================== */

// List threaded conversations
router.get(
  "/messages",
  authenticate,
  requirePermission("messages", "read"),
  validate(z.object({
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  })),
  async (req: AuthRequest, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const result = await CommunicationService.getMessages(req.user!.tenantId, req.user!.id, page, limit);
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch messages";
      res.status(500).json({ error: message });
    }
  },
);

// Get a single message thread (root + all replies)
router.get(
  "/messages/:messageId",
  authenticate,
  requirePermission("messages", "read"),
  validate(z.object({ params: z.object({ messageId: z.string().uuid() }) })),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await CommunicationService.getThread(
        req.user!.tenantId,
        req.user!.id,
        req.params.messageId,
      );
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch thread";
      res.status(404).json({ error: message });
    }
  },
);

// Send new message or reply
router.post(
  "/messages",
  authenticate,
  requirePermission("messages", "write"),
  auditLogMiddleware,
  validate(z.object({
    body: z.object({
      recipientIds: z.array(z.string().uuid()).optional(),
      subject: z.string().min(1, "Subject is required").max(200).optional(),
      content: z.string().min(1, "Message content is required").max(10000),
      parentId: z.string().uuid().optional(),
    }),
    query: z.object({}).passthrough().optional(),
    params: z.object({}).passthrough().optional(),
  })),
  async (req: AuthRequest, res: Response) => {
    try {
      const message = await CommunicationService.sendMessage(
        req.user!.tenantId,
        req.user!.id,
        req.body.recipientIds || [],
        req.body.content,
        req.body.subject,
        req.body.parentId,
      );
      res.status(201).json(message);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to send message";
      res.status(400).json({ error: msg });
    }
  },
);

// Mark message as read
router.patch(
  "/messages/:messageId/read",
  authenticate,
  requirePermission("messages", "read"),
  validate(z.object({ params: z.object({ messageId: z.string().uuid() }) })),
  async (req: AuthRequest, res: Response) => {
    try {
      await CommunicationService.markMessageRead(
        req.user!.tenantId,
        req.user!.id,
        req.params.messageId,
      );
      res.json({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed";
      res.status(404).json({ error: message });
    }
  },
);

/* ================================================================== */
/*  ANNOUNCEMENTS                                                      */
/* ================================================================== */

router.get(
  "/announcements",
  authenticate,
  requirePermission("announcements", "read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const classId = (req.query.classId as string) || undefined;
      const announcements = await CommunicationService.getAnnouncements(
        req.user!.tenantId,
        req.user!.id,
        classId,
      );
      res.json(announcements);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch announcements";
      res.status(500).json({ error: message });
    }
  },
);

router.post(
  "/announcements",
  authenticate,
  requirePermission("announcements", "write"),
  auditLogMiddleware,
  validate(z.object({
    body: z.object({
      title: z.string().min(1, "Title is required"),
      body: z.string().min(1, "Body is required"),
      classId: z.string().uuid().optional(),
    }),
    query: z.object({}).passthrough().optional(),
    params: z.object({}).passthrough().optional(),
  })),
  async (req: AuthRequest, res: Response) => {
    try {
      const announcement = await CommunicationService.createAnnouncement(
        req.user!.tenantId,
        req.user!.id,
        req.body.title,
        req.body.body,
        req.body.classId,
      );
      res.status(201).json(announcement);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create announcement";
      res.status(400).json({ error: message });
    }
  },
);

router.delete(
  "/announcements/:announcementId",
  authenticate,
  requirePermission("announcements", "write"),
  validate(z.object({ params: z.object({ announcementId: z.string().uuid() }) })),
  async (req: AuthRequest, res: Response) => {
    try {
      const { Prisma } = await import("@prisma/client");
      const { prisma } = await import("../../lib/prisma");
      await prisma.announcement.deleteMany({
        where: { id: req.params.announcementId, tenantId: req.user!.tenantId },
      });
      res.json({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed";
      res.status(404).json({ error: message });
    }
  },
);

router.patch(
  "/announcements/:announcementId/read",
  authenticate,
  requirePermission("announcements", "read"),
  validate(z.object({ params: z.object({ announcementId: z.string().uuid() }) })),
  async (req: AuthRequest, res: Response) => {
    try {
      await CommunicationService.markAnnouncementRead(
        req.user!.tenantId,
        req.user!.id,
        req.params.announcementId,
      );
      res.json({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed";
      res.status(404).json({ error: message });
    }
  },
);

/* ================================================================== */
/*  UNREAD COUNTS & USERS                                              */
/* ================================================================== */

router.get(
  "/unread-counts",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const counts = await CommunicationService.getUnreadCounts(req.user!.tenantId, req.user!.id);
      res.json(counts);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed";
      res.status(500).json({ error: message });
    }
  },
);

router.get(
  "/users",
  authenticate,
  requirePermission("messages", "write"),
  async (req: AuthRequest, res: Response) => {
    try {
      const users = await CommunicationService.getConversationUsers(
        req.user!.tenantId,
        req.user!.id,
      );
      res.json(users);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch users";
      res.status(500).json({ error: message });
    }
  },
);

export default router;

import { apiClient } from "./client";

export interface Announcement {
  id: string;
  tenantId: string;
  classId?: string | null;
  title: string;
  body: string;
  createdAt: string;
  createdBy: string;
  expiresAt?: string | null;
  participants?: Array<{ userId: string; isRead: boolean }>;
}

export interface UnreadCounts {
  unreadMessages: number;
  unreadAnnouncements: number;
}

export const communicationApi = {
  getMessages(params?: { page?: number; limit?: number }) {
    const p = new URLSearchParams();
    if (params?.page) p.append("page", String(params.page));
    if (params?.limit) p.append("limit", String(params.limit));
    return apiClient.get("/communication/messages", { params: p });
  },

  sendMessage(data: { recipientIds: string[]; content: string }) {
    return apiClient.post("/communication/messages", data);
  },

  markMessageRead(messageId: string) {
    return apiClient.patch(`/communication/messages/${messageId}/read`);
  },

  getAnnouncements(params?: { classId?: string }) {
    const p = new URLSearchParams();
    if (params?.classId) p.append("classId", params.classId);
    return apiClient.get("/communication/announcements", { params: p });
  },

  getUnreadCounts() {
    return apiClient.get("/communication/unread-counts");
  },
};

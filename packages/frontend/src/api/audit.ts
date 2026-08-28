import { apiClient } from "./client";

export const auditApi = {
  list: (params?: { page?: number; limit?: number; userId?: string; action?: string }) =>
    apiClient.get("/audit-log", { params }),
};

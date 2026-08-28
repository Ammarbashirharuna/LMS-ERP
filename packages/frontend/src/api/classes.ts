import { apiClient } from "./client";

export const classesApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiClient.get("/classes", { params }),
  get: (id: string) => apiClient.get(`/classes/${id}`),
  create: (data: { name: string; academicYear: string; teacherIds?: string[] }) =>
    apiClient.post("/classes", data),
  update: (id: string, data: Partial<{ name: string; academicYear: string; teacherIds: string[] }>) =>
    apiClient.patch(`/classes/${id}`, data),
  delete: (id: string) => apiClient.delete(`/classes/${id}`),
};

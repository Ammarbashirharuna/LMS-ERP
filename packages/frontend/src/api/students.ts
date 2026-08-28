import { apiClient } from "./client";
import type { StudentFormData } from "../types/student";

export const studentApi = {
  getAll(filters?: { classId?: string; search?: string; page?: number; limit?: number }) {
    const params: Record<string, string> = {};
    if (filters?.classId) params.classId = filters.classId;
    if (filters?.search) params.search = filters.search;
    if (filters?.page) params.page = String(filters.page);
    if (filters?.limit) params.limit = String(filters.limit);
    return apiClient.get("/students", { params });
  },

  getById(id: string) {
    return apiClient.get(`/students/${id}`);
  },

  create(data: StudentFormData) {
    return apiClient.post("/students", data);
  },

  update(id: string, data: Partial<StudentFormData>) {
    return apiClient.patch(`/students/${id}`, data);
  },

  delete(id: string) {
    return apiClient.delete(`/students/${id}`);
  },
};

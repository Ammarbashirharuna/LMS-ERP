import { apiClient } from "./client";
import type { AttendanceFormData, BulkAttendanceFormData } from "../types/attendance";

export const attendanceApi = {
  getAll(filters?: {
    classId?: string;
    studentId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const params: Record<string, string> = {};
    if (filters?.classId) params.classId = filters.classId;
    if (filters?.studentId) params.studentId = filters.studentId;
    if (filters?.date) params.date = filters.date;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.page) params.page = String(filters.page);
    if (filters?.limit) params.limit = String(filters.limit);
    return apiClient.get("/attendance", { params });
  },

  getByStudent(studentId: string, month?: string) {
    const url = `/attendance/student/${studentId}`;
    const params = month ? { month } : undefined;
    return apiClient.get(url, { params });
  },

  record(data: AttendanceFormData) {
    return apiClient.post("/attendance", data);
  },

  bulkRecord(data: BulkAttendanceFormData) {
    return apiClient.post("/attendance/bulk", data);
  },

  update(id: string, data: { status?: string; reasonCode?: string }) {
    return apiClient.patch(`/attendance/${id}`, data);
  },
};

import { apiClient } from "./client";

export interface ObservationData {
  studentId: string;
  teacherId: string;
  note: string;
  masteryLevel: "INTRODUCED" | "PRACTICING" | "MASTERED";
  curriculumItemId?: string;
  lessonPlanId?: string;
}

export const observationApi = {
  getAll(filters?: Record<string, string>) {
    const params = new URLSearchParams(filters);
    return apiClient.get("/observations", { params });
  },

  create(data: ObservationData) {
    return apiClient.post("/observations", data);
  },

  getStudentProgress(studentId: string) {
    return apiClient.get(`/observations/student/${studentId}/progress`);
  },

  update(id: string, data: Partial<ObservationData>) {
    return apiClient.patch(`/observations/${id}`, data);
  },

  delete(id: string) {
    return apiClient.delete(`/observations/${id}`);
  },
};

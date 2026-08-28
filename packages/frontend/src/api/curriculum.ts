import { apiClient } from "./client";

export interface CurriculumArea {
  id: string;
  name: string;
  order: number;
  items: CurriculumItem[];
}

export interface CurriculumItem {
  id: string;
  areaId: string;
  title: string;
  ageBand?: string;
  materialIds: string[];
  description?: string;
  lessonPlanCount: number;
  observationCount: number;
  latestMastery: string | null;
}

export interface LessonPlan {
  id: string;
  tenantId: string;
  teacherId: string;
  title: string;
  content?: string;
  date: string;
  curriculumItemId?: string;
  classId?: string;
  createdAt: string;
  updatedAt: string;
  curriculumItem?: { title: string; area: { name: string } };
  classRoom?: { name: string };
}

export const curriculumApi = {
  getTree(studentId?: string, classId?: string) {
    const params = new URLSearchParams();
    if (studentId) params.append("studentId", studentId);
    if (classId) params.append("classId", classId);
    return apiClient.get("/curriculum/tree", { params });
  },

  getAreas() {
    return apiClient.get("/curriculum/areas");
  },

  getItems(filters?: { areaId?: string; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.areaId) params.append("areaId", filters.areaId);
    if (filters?.search) params.append("search", filters.search);
    return apiClient.get("/curriculum/items", { params });
  },

  getLessonPlans(filters?: { classId?: string; teacherId?: string; date?: string; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.classId) params.append("classId", filters.classId);
    if (filters?.teacherId) params.append("teacherId", filters.teacherId);
    if (filters?.date) params.append("date", filters.date);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    return apiClient.get("/curriculum/lesson-plans", { params });
  },

  getLessonPlan(id: string) {
    return apiClient.get(`/curriculum/lesson-plans/${id}`);
  },

  createLessonPlan(data: {
    title: string;
    content?: string;
    date: string;
    curriculumItemId?: string;
    classId?: string;
  }) {
    return apiClient.post("/curriculum/lesson-plans", data);
  },

  updateLessonPlan(id: string, data: Partial<{
    title: string;
    content?: string;
    date: string;
    curriculumItemId?: string | null;
    classId?: string | null;
  }>) {
    return apiClient.patch(`/curriculum/lesson-plans/${id}`, data);
  },

  deleteLessonPlan(id: string) {
    return apiClient.delete(`/curriculum/lesson-plans/${id}`);
  },

  getStudentProgress(studentId: string) {
    return apiClient.get(`/curriculum/progress/student/${studentId}`);
  },
};

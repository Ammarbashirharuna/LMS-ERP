import { apiClient } from "./client";

export interface AIInsight {
  insights: string;
}

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIChatResponse {
  response: string;
}

export const aiApi = {
  getStudentInsights(studentId: string) {
    return apiClient.get(`/ai/insights/student/${studentId}`);
  },

  chat(data: { message: string; role: string; history?: Array<{ role: string; parts: string }> }) {
    return apiClient.post("/ai/assistant/chat", data);
  },
};

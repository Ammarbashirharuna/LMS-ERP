import { apiClient } from "./client";

export interface LeaderboardEntry {
  id: string;
  studentId: string;
  period: string;
  score: number;
  updatedAt: string;
  student?: { id: string; firstName: string; lastName: string };
}

export interface Point {
  id: string;
  studentId: string;
  value: number;
  reason: string;
  awardedAt: string;
  awardedBy?: string;
}

export interface BadgeAward {
  id: string;
  badgeId: string;
  studentId: string;
  awardedAt: string;
}

export interface Badge {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  icon?: string;
  criteria: Record<string, unknown>;
  createdAt: string;
  awardees?: Array<{ id: string; student: { id: string; firstName: string; lastName: string } }>;
}

export const gamificationApi = {
  getLeaderboard(period: string = "weekly") {
    return apiClient.get(`/gamification/leaderboard?period=${period}`);
  },

  getStudentPoints(studentId: string) {
    return apiClient.get(`/gamification/points/student/${studentId}`);
  },

  getBadges() {
    return apiClient.get("/gamification/badges");
  },
};

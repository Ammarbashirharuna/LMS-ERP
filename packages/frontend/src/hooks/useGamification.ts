import { useQuery } from "@tanstack/react-query";
import { gamificationApi } from "../api/gamification";
import type { LeaderboardEntry, Point, Badge } from "../api/gamification";

export const useLeaderboard = (period: string = "weekly") => {
  return useQuery({
    queryKey: ["leaderboard", period],
    queryFn: () => gamificationApi.getLeaderboard(period).then((res) => res.data as LeaderboardEntry[]),
  });
};

export const useStudentPoints = (studentId: string) => {
  return useQuery({
    queryKey: ["student-points", studentId],
    queryFn: () => gamificationApi.getStudentPoints(studentId).then((res) => res.data as { points: Point[]; total: number }),
    enabled: !!studentId,
  });
};

export const useBadges = () => {
  return useQuery({
    queryKey: ["badges"],
    queryFn: () => gamificationApi.getBadges().then((res) => res.data as Badge[]),
  });
};

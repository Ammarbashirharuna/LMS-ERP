import { useQuery, useMutation } from "@tanstack/react-query";
import { aiApi } from "../api/ai";

export const useAIInsights = (studentId: string) => {
  return useQuery({
    queryKey: ["ai-insights", studentId],
    queryFn: () => aiApi.getStudentInsights(studentId).then((res) => res.data as { insights: string }),
    enabled: !!studentId,
  });
};

export const useAIChat = () => {
  return useMutation({
    mutationFn: (data: {
      message: string;
      role: string;
      history?: Array<{ role: string; parts: string }>;
    }) => aiApi.chat(data).then((res) => res.data as { response: string }),
  });
};

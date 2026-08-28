import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { observationApi } from "../api/observations";
import type { ObservationData } from "../api/observations";

export const useObservations = (filters?: Record<string, string>) => {
  return useQuery({
    queryKey: ["observations", filters],
    queryFn: () => observationApi.getAll(filters).then((res) => res.data),
  });
};

export const useStudentProgress = (studentId: string) => {
  return useQuery({
    queryKey: ["student-progress", studentId],
    queryFn: () => observationApi.getStudentProgress(studentId).then((res) => res.data),
    enabled: !!studentId,
  });
};

export const useCreateObservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ObservationData) => observationApi.create(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["observations"] });
    },
  });
};

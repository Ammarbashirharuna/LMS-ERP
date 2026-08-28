import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "../api/students";
import type { Student, StudentFormData } from "../types/student";

export const useStudents = (filters?: { classId?: string; search?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ["students", filters],
    queryFn: () => studentApi.getAll(filters).then((res) => res.data),
  });
};

export const useStudent = (id: string) => {
  return useQuery({
    queryKey: ["student", id],
    queryFn: () => studentApi.getById(id).then((res) => res.data as Student),
    enabled: !!id,
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StudentFormData) => studentApi.create(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StudentFormData> }) =>
      studentApi.update(id, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { curriculumApi } from "../api/curriculum";
import type { CurriculumArea, LessonPlan } from "../api/curriculum";

export const useCurriculumTree = (studentId?: string, classId?: string) => {
  return useQuery({
    queryKey: ["curriculum-tree", studentId, classId],
    queryFn: () => curriculumApi.getTree(studentId, classId).then((res) => res.data as CurriculumArea[]),
  });
};

export const useLessonPlans = (filters?: {
  classId?: string;
  teacherId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ["lesson-plans", filters],
    queryFn: () => curriculumApi.getLessonPlans(filters).then((res) => res.data as LessonPlan[]),
  });
};

export const useLessonPlan = (id: string) => {
  return useQuery({
    queryKey: ["lesson-plan", id],
    queryFn: () => curriculumApi.getLessonPlan(id).then((res) => res.data as LessonPlan),
    enabled: !!id,
  });
};

export const useCreateLessonPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      content?: string;
      date: string;
      curriculumItemId?: string;
      classId?: string;
    }) => curriculumApi.createLessonPlan(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-plans"] });
    },
  });
};

export const useStudentProgress = (studentId: string) => {
  return useQuery({
    queryKey: ["student-progress", studentId],
    queryFn: () => curriculumApi.getStudentProgress(studentId).then((res) => res.data),
    enabled: !!studentId,
  });
};

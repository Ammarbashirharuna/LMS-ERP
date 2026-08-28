import { z } from "zod";

export const curriculumItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  ageBand: z.string().optional(),
  materialIds: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export const lessonPlanSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  curriculumItemId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
});

export const updateLessonPlanSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  date: z.string().optional(),
  curriculumItemId: z.string().uuid().nullable().optional(),
  classId: z.string().uuid().nullable().optional(),
});

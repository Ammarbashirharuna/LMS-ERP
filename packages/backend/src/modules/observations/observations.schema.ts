import { z } from "zod";

export const recordObservationSchema = z.object({
  studentId: z.string().uuid(),
  teacherId: z.string().uuid(),
  note: z.string().min(1, "Note is required"),
  masteryLevel: z.enum(["INTRODUCED", "PRACTICING", "MASTERED"]).default("INTRODUCED"),
  curriculumItemId: z.string().uuid().optional(),
  lessonPlanId: z.string().uuid().optional(),
});

export const updateObservationSchema = z.object({
  note: z.string().min(1).optional(),
  masteryLevel: z.enum(["INTRODUCED", "PRACTICING", "MASTERED"]).optional(),
  curriculumItemId: z.string().uuid().nullable().optional(),
  lessonPlanId: z.string().uuid().nullable().optional(),
});

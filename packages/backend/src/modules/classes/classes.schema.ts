import { z } from "zod";

export const classRoomSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  teacherIds: z.array(z.string()).optional(),
});

export const updateClassRoomSchema = z.object({
  name: z.string().min(1).optional(),
  academicYear: z.string().optional(),
  teacherIds: z.array(z.string()).optional(),
});

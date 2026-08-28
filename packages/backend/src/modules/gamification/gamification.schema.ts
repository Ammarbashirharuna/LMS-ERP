import { z } from "zod";

export const badgeSchema = z.object({
  name: z.string().min(1, "Badge name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  criteria: z.record(z.unknown()),
});

export const pointSchema = z.object({
  studentId: z.string().uuid(),
  value: z.number().int(),
  reason: z.string().min(1, "Reason is required"),
});

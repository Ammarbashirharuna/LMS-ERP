import { z } from "zod";

export const chatSchema = z.object({
  message: z.string().min(1, "Message is required"),
  role: z.string().min(1, "Role is required"),
  history: z.array(
    z.object({
      role: z.string(),
      parts: z.string(),
    }),
  ).optional(),
});

export const insightsSchema = z.object({
  studentId: z.string().uuid(),
});

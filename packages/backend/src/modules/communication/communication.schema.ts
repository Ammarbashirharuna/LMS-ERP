import { z } from "zod";

export const messageSchema = z.object({
  recipientIds: z.array(z.string().uuid()).min(1, "At least one recipient is required"),
  subject: z.string().min(1, "Subject is required").max(200).optional(),
  content: z.string().min(1, "Message content is required"),
});

export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  classId: z.string().uuid().optional(),
});

import { z } from "zod";

export const feeStructureSchema = z.object({
  grade: z.string().min(1, "Grade is required"),
  term: z.string().min(1, "Term is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
});

export const invoiceSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  feeStructureId: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
});

export const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "OTHER"]),
});

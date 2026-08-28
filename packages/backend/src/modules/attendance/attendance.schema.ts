import { z } from "zod";

export const attendanceSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  reasonCode: z.string().optional(),
});

export const batchAttendanceSchema = z.object({
  classId: z.string().uuid().optional(),
  date: z.string().min(1, "Date is required"),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
      reasonCode: z.string().optional(),
    }),
  ),
});

export const updateAttendanceSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]).optional(),
  reasonCode: z.string().optional(),
});

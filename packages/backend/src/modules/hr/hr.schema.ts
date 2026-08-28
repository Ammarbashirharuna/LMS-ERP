import { z } from "zod";

export const staffSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  position: z.string().min(1, "Position is required"),
  salary: z.coerce.number().positive().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  hireDate: z.string().min(1, "Hire date is required"),
  leaveBalance: z.number().int().default(0),
});

export const updateStaffSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  salary: z.coerce.number().positive().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  hireDate: z.string().optional(),
  leaveBalance: z.number().int().optional(),
});

export const leaveRequestSchema = z.object({
  staffId: z.string().uuid(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
});

import { z } from "zod";

export const materialSchema = z.object({
  name: z.string().min(1, "Material name is required"),
  quantity: z.number().int().min(0).default(0),
  location: z.string().optional(),
  lowStockThreshold: z.number().int().min(0).default(0),
});

export const updateMaterialSchema = z.object({
  name: z.string().min(1).optional(),
  quantity: z.number().int().min(0).optional(),
  location: z.string().optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export const materialCheckoutSchema = z.object({
  materialId: z.string().uuid(),
  classId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  quantity: z.number().int().positive("Quantity must be positive"),
});

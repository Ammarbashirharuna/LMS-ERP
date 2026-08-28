import { Router, Response } from "express";
import { z } from "zod";
import { InventoryService } from "./inventory.service";
import { validate } from "../../core/middleware/validation";
import { authenticate, AuthRequest } from "../../core/middleware/auth.middleware";
import { requirePermission } from "../../core/middleware/rbac.middleware";
import { auditLogMiddleware } from "../../core/middleware/audit.middleware";
import { materialSchema, updateMaterialSchema, materialCheckoutSchema } from "./inventory.schema";

const router = Router();

router.get(
  "/",
  authenticate,
  requirePermission("inventory", "read"),
  validate(z.object({
    query: z.object({
      lowStock: z.string().optional(),
    }),
  })),
  async (req: AuthRequest, res: Response) => {
    const materials = await InventoryService.getMaterials(
      req.user!.tenantId,
      { lowStock: req.query.lowStock === "true" },
    );
    res.json(materials);
  },
);

router.post(
  "/",
  authenticate,
  requirePermission("inventory", "write"),
  auditLogMiddleware,
  validate(materialSchema),
  async (req: AuthRequest, res: Response) => {
    const material = await InventoryService.createMaterial(req.user!.tenantId, req.body);
    res.status(201).json(material);
  },
);

router.get(
  "/:id",
  authenticate,
  requirePermission("inventory", "read"),
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  async (req: AuthRequest, res: Response) => {
    try {
      const material = await InventoryService.getMaterialById(req.user!.tenantId, req.params.id);
      res.json(material);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch material";
      res.status(404).json({ error: message });
    }
  },
);

router.patch(
  "/:id",
  authenticate,
  requirePermission("inventory", "write"),
  auditLogMiddleware,
  validate(z.object({
    params: z.object({ id: z.string().uuid() }),
    body: updateMaterialSchema,
  })),
  async (req: AuthRequest, res: Response) => {
    try {
      const material = await InventoryService.updateMaterial(
        req.user!.tenantId,
        req.params.id,
        req.body,
      );
      res.json(material);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update material";
      res.status(404).json({ error: message });
    }
  },
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("inventory", "write"),
  auditLogMiddleware,
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  async (req: AuthRequest, res: Response) => {
    try {
      await InventoryService.deleteMaterial(req.user!.tenantId, req.params.id);
      res.status(204).send();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete material";
      res.status(404).json({ error: message });
    }
  },
);

router.post(
  "/checkout",
  authenticate,
  requirePermission("inventory", "write"),
  auditLogMiddleware,
  validate(materialCheckoutSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const checkout = await InventoryService.checkoutMaterial(
        req.user!.tenantId,
        req.user!.id,
        req.body,
      );
      res.status(201).json(checkout);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to checkout material";
      res.status(400).json({ error: message });
    }
  },
);

router.post(
  "/checkout/:id/return",
  authenticate,
  requirePermission("inventory", "write"),
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await InventoryService.returnMaterial(req.user!.tenantId, req.params.id);
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to return material";
      res.status(404).json({ error: message });
    }
  },
);

router.patch(
  "/:id/stock",
  authenticate,
  requirePermission("inventory", "write"),
  auditLogMiddleware,
  validate(z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({ adjustment: z.number().int() }),
  })),
  async (req: AuthRequest, res: Response) => {
    try {
      const material = await InventoryService.updateStock(
        req.user!.tenantId,
        req.params.id,
        req.body.adjustment,
      );
      res.json(material);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to adjust stock";
      res.status(404).json({ error: message });
    }
  },
);

export default router;

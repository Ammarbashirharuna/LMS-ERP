import { Router, Response } from "express";
import { z } from "zod";
import { RoleService } from "./roles.service";
import { validate } from "../../core/middleware/validation";
import { authenticate, AuthRequest } from "../../core/middleware/auth.middleware";
import { requirePermission } from "../../core/middleware/rbac.middleware";
import { auditLogMiddleware } from "../../core/middleware/audit.middleware";

const router = Router();

const createRoleSchema = z.object({
  name: z.string().min(2, "Role name must be at least 2 characters"),
  permissions: z.array(
    z.object({
      resource: z.string(),
      action: z.string(),
    })
  ),
});

const updateRoleSchema = z.object({
  name: z.string().min(2).optional(),
  permissions: z.array(
    z.object({
      resource: z.string(),
      action: z.string(),
    })
  ).optional(),
});

router.get(
  "/",
  authenticate,
  requirePermission("users", "read"),
  async (req: AuthRequest, res: Response) => {
    const roles = await RoleService.getRoles(req.user!.tenantId);
    res.json(roles);
  }
);

router.post(
  "/",
  authenticate,
  requirePermission("users", "write"),
  auditLogMiddleware,
  validate(createRoleSchema),
  async (req: AuthRequest, res: Response) => {
    const role = await RoleService.createRole(req.user!.tenantId, req.body);
    res.status(201).json(role);
  }
);

const roleIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

router.patch(
  "/:id",
  authenticate,
  requirePermission("users", "write"),
  auditLogMiddleware,
  validate(z.object({
    params: z.object({ id: z.string().uuid() }),
    body: updateRoleSchema,
  })),
  async (req: AuthRequest, res: Response) => {
    try {
      const role = await RoleService.updateRole(req.user!.tenantId, req.params.id, req.body);
      res.json(role);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update role";
      res.status(404).json({ error: message });
    }
  }
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("users", "write"),
  auditLogMiddleware,
  validate(roleIdParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      await RoleService.deleteRole(req.user!.tenantId, req.params.id);
      res.status(204).send();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete role";
      res.status(400).json({ error: message });
    }
  }
);

export default router;

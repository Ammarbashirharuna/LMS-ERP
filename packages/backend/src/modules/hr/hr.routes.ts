import { Router, Response } from "express";
import { z } from "zod";
import { HRService } from "./hr.service";
import { validate } from "../../core/middleware/validation";
import { authenticate, AuthRequest } from "../../core/middleware/auth.middleware";
import { requirePermission } from "../../core/middleware/rbac.middleware";
import { auditLogMiddleware } from "../../core/middleware/audit.middleware";
import { staffSchema, updateStaffSchema, leaveRequestSchema } from "./hr.schema";

const router = Router();

router.get(
  "/",
  authenticate,
  requirePermission("hr", "read"),
  async (req: AuthRequest, res: Response) => {
    const result = await HRService.getStaff(req.user!.tenantId);
    res.json(result);
  },
);

router.post(
  "/",
  authenticate,
  requirePermission("hr", "write"),
  auditLogMiddleware,
  validate(staffSchema),
  async (req: AuthRequest, res: Response) => {
    const staff = await HRService.createStaff(req.user!.tenantId, req.body);
    res.status(201).json(staff);
  },
);

router.get(
  "/:id",
  authenticate,
  requirePermission("hr", "read"),
  validate(z.object({ params: z.object({ id: z.string().min(1) }) })),
  async (req: AuthRequest, res: Response) => {
    try {
      const staff = await HRService.getStaffById(req.user!.tenantId, req.params.id);
      res.json(staff);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch staff";
      res.status(404).json({ error: message });
    }
  },
);

router.patch(
  "/:id",
  authenticate,
  requirePermission("hr", "write"),
  auditLogMiddleware,
  validate(z.object({
    params: z.object({ id: z.string().min(1) }),
    body: updateStaffSchema,
  })),
  async (req: AuthRequest, res: Response) => {
    try {
      const staff = await HRService.updateStaff(req.user!.tenantId, req.params.id, req.body);
      res.json(staff);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update staff";
      res.status(404).json({ error: message });
    }
  },
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("hr", "write"),
  auditLogMiddleware,
  validate(z.object({ params: z.object({ id: z.string().min(1) }) })),
  async (req: AuthRequest, res: Response) => {
    try {
      await HRService.deleteStaff(req.user!.tenantId, req.params.id);
      res.status(204).send();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete staff";
      res.status(404).json({ error: message });
    }
  },
);

router.get(
  "/leave-requests",
  authenticate,
  requirePermission("hr", "read"),
  async (req: AuthRequest, res: Response) => {
    const result = await HRService.getLeaveRequests(req.user!.tenantId);
    res.json(result);
  },
);

router.post(
  "/leave-requests",
  authenticate,
  requirePermission("hr", "write"),
  auditLogMiddleware,
  validate(leaveRequestSchema),
  async (req: AuthRequest, res: Response) => {
    const request = await HRService.createLeaveRequest(req.user!.tenantId, req.body);
    res.status(201).json(request);
  },
);

router.patch(
  "/leave-requests/:id/approve",
  authenticate,
  requirePermission("hr", "write"),
  auditLogMiddleware,
  validate(z.object({
    params: z.object({ id: z.string().min(1) }),
    body: z.object({ approved: z.boolean() }),
  })),
  async (req: AuthRequest, res: Response) => {
    try {
      const request = await HRService.approveLeaveRequest(
        req.user!.tenantId,
        req.params.id,
        req.body.approved,
      );
      res.json(request);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update leave request";
      res.status(404).json({ error: message });
    }
  },
);

/** Create a login account for a staff member */
router.post(
  "/:id/create-account",
  authenticate,
  requirePermission("users", "write"),
  auditLogMiddleware,
  validate(z.object({
    params: z.object({ id: z.string().min(1) }),
    body: z.object({
      role: z.string().optional(),
      email: z.string().optional(),
    }),
  })),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await HRService.createStaffAccount(
        req.user!.tenantId,
        req.params.id,
        req.body.role || "teacher",
        req.body.email,
      );
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create account";
      res.status(400).json({ error: message });
    }
  },
);

/** List roles in the tenant */
router.get(
  "/meta/roles",
  authenticate,
  requirePermission("hr", "read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const roles = await HRService.getRoles(req.user!.tenantId);
      res.json(roles);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch roles";
      res.status(500).json({ error: message });
    }
  },
);

/** Get permissions for a role */
router.get(
  "/meta/roles/:roleId/permissions",
  authenticate,
  requirePermission("users", "read"),
  validate(z.object({ params: z.object({ roleId: z.string().min(1) }) })),
  async (req: AuthRequest, res: Response) => {
    try {
      const permissions = await HRService.getRolePermissions(req.user!.tenantId, req.params.roleId);
      res.json(permissions);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch permissions";
      res.status(404).json({ error: message });
    }
  },
);

/** Update permissions for a role */
router.put(
  "/meta/roles/:roleId/permissions",
  authenticate,
  requirePermission("users", "write"),
  auditLogMiddleware,
  validate(z.object({
    params: z.object({ roleId: z.string().min(1) }),
    body: z.object({
      permissions: z.array(z.object({ resource: z.string(), action: z.string() })),
    }),
  })),
  async (req: AuthRequest, res: Response) => {
    try {
      const role = await HRService.updateRolePermissions(
        req.user!.tenantId,
        req.params.roleId,
        req.body.permissions,
      );
      res.json(role);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update permissions";
      res.status(400).json({ error: message });
    }
  },
);

export default router;

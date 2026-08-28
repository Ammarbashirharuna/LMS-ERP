import { Router, Response } from "express";
import { z } from "zod";
import { ClassRoomService } from "./classes.service";
import { validate } from "../../core/middleware/validation";
import { authenticate, AuthRequest } from "../../core/middleware/auth.middleware";
import { requirePermission } from "../../core/middleware/rbac.middleware";
import { auditLogMiddleware } from "../../core/middleware/audit.middleware";
import { classRoomSchema, updateClassRoomSchema } from "./classes.schema";

const router = Router();

router.get(
  "/",
  authenticate,
  requirePermission("students", "read"),
  async (_req: AuthRequest, res: Response) => {
    const classes = await ClassRoomService.getClassRooms(res.locals.tenantId ?? _req.user!.tenantId);
    res.json({ data: classes });
  },
);

router.post(
  "/",
  authenticate,
  requirePermission("students", "write"),
  auditLogMiddleware,
  validate(classRoomSchema),
  async (req: AuthRequest, res: Response) => {
    const classRoom = await ClassRoomService.createClassRoom(req.user!.tenantId, req.body);
    res.status(201).json(classRoom);
  },
);

router.get(
  "/:id",
  authenticate,
  requirePermission("students", "read"),
  validate(z.object({ params: z.object({ id: z.string().min(1) }) })),
  async (req: AuthRequest, res: Response) => {
    try {
      const classRoom = await ClassRoomService.getClassRoomById(req.user!.tenantId, req.params.id);
      res.json(classRoom);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch class";
      res.status(404).json({ error: message });
    }
  },
);

router.get(
  "/:id/students",
  authenticate,
  requirePermission("students", "read"),
  validate(z.object({ params: z.object({ id: z.string().min(1) }) })),
  async (req: AuthRequest, res: Response) => {
    try {
      const students = await ClassRoomService.getClassStudents(req.user!.tenantId, req.params.id);
      res.json(students);
    } catch (error: unknown) {
      const message = error instanceof Error ? error : "Failed to fetch students";
      res.status(404).json({ error: message });
    }
  },
);

router.patch(
  "/:id",
  authenticate,
  requirePermission("students", "write"),
  auditLogMiddleware,
  validate(z.object({
    params: z.object({ id: z.string().min(1) }),
    body: updateClassRoomSchema,
  })),
  async (req: AuthRequest, res: Response) => {
    try {
      const classRoom = await ClassRoomService.updateClassRoom(
        req.user!.tenantId,
        req.params.id,
        req.body,
      );
      res.json(classRoom);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update class";
      res.status(404).json({ error: message });
    }
  },
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("students", "write"),
  auditLogMiddleware,
  validate(z.object({ params: z.object({ id: z.string().min(1) }) })),
  async (req: AuthRequest, res: Response) => {
    try {
      await ClassRoomService.deleteClassRoom(req.user!.tenantId, req.params.id);
      res.status(204).send();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete class";
      res.status(404).json({ error: message });
    }
  },
);

export default router;

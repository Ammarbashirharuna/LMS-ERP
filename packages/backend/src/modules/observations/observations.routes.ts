import { Router, Response } from "express";
import { z } from "zod";
import { ObservationService } from "./observations.service";
import { validate } from "../../core/middleware/validation";
import { authenticate, AuthRequest } from "../../core/middleware/auth.middleware";
import { requirePermission } from "../../core/middleware/rbac.middleware";
import { auditLogMiddleware } from "../../core/middleware/audit.middleware";
import {
  recordObservationSchema,
  updateObservationSchema,
} from "./observations.schema";

const router = Router();

router.get(
  "/",
  authenticate,
  requirePermission("observations", "read"),
  validate(z.object({
    query: z.object({
      studentId: z.string().uuid().optional(),
      teacherId: z.string().uuid().optional(),
      classId: z.string().uuid().optional(),
      date: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      masteryLevel: z.enum(["INTRODUCED", "PRACTICING", "MASTERED"]).optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  })),
  async (req: AuthRequest, res: Response) => {
    const filter = {
      studentId: req.query.studentId as string | undefined,
      teacherId: req.query.teacherId as string | undefined,
      classId: req.query.classId as string | undefined,
      date: req.query.date as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      masteryLevel: req.query.masteryLevel as "INTRODUCED" | "PRACTICING" | "MASTERED" | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    };
    const result = await ObservationService.getObservations(req.user!.tenantId, filter);
    res.json(result);
  },
);

router.post(
  "/",
  authenticate,
  requirePermission("observations", "write"),
  auditLogMiddleware,
  async (req: AuthRequest, res: Response) => {
    const observation = await ObservationService.createObservation(
      req.user!.tenantId,
      { ...req.body, teacherId: req.user!.id },
    );
    res.status(201).json(observation);
  },
);

router.get(
  "/student/:studentId/progress",
  authenticate,
  requirePermission("observations", "read"),
  validate(z.object({ params: z.object({ studentId: z.string().uuid() }) })),
  async (req: AuthRequest, res: Response) => {
    const progress = await ObservationService.getStudentProgress(
      req.user!.tenantId,
      req.params.studentId,
    );
    res.json(progress);
  },
);

router.patch(
  "/:id",
  authenticate,
  requirePermission("observations", "write"),
  auditLogMiddleware,
  validate(z.object({
    params: z.object({ id: z.string().uuid() }),
    body: updateObservationSchema,
  })),
  async (req: AuthRequest, res: Response) => {
    try {
      const observation = await ObservationService.updateObservation(
        req.user!.tenantId,
        req.params.id,
        req.body,
      );
      res.json(observation);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update observation";
      res.status(404).json({ error: message });
    }
  },
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("observations", "write"),
  auditLogMiddleware,
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  async (req: AuthRequest, res: Response) => {
    try {
      await ObservationService.deleteObservation(req.user!.tenantId, req.params.id);
      res.status(204).send();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete observation";
      res.status(404).json({ error: message });
    }
  },
);

export default router;

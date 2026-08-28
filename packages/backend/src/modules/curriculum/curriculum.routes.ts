import { Router, Response } from "express";
import { z } from "zod";
import { CurriculumService } from "./curriculum.service";
import { validate } from "../../core/middleware/validation";
import { authenticate, AuthRequest } from "../../core/middleware/auth.middleware";
import { requirePermission } from "../../core/middleware/rbac.middleware";
import { auditLogMiddleware } from "../../core/middleware/audit.middleware";
import {
  lessonPlanSchema,
  updateLessonPlanSchema,
} from "./curriculum.schema";

const router = Router();

router.get(
  "/areas",
  authenticate,
  requirePermission("curriculum", "read"),
  async (_req: AuthRequest, res: Response) => {
    const areas = await CurriculumService.getCurriculumAreas();
    res.json(areas);
  },
);

router.get(
  "/tree",
  authenticate,
  requirePermission("curriculum", "read"),
  validate(z.object({
    query: z.object({
      studentId: z.string().uuid().optional(),
      classId: z.string().uuid().optional(),
    }),
  })),
  async (req: AuthRequest, res: Response) => {
    const tree = await CurriculumService.getCurriculumTree(
      req.user!.tenantId,
      req.query.studentId as string | undefined,
      req.query.classId as string | undefined,
    );
    res.json(tree);
  },
);

router.get(
  "/items",
  authenticate,
  requirePermission("curriculum", "read"),
  validate(z.object({
    query: z.object({
      areaId: z.string().uuid().optional(),
      search: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  })),
  async (req: AuthRequest, res: Response) => {
    const filter = {
      areaId: req.query.areaId as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    };
    const result = await CurriculumService.getCurriculumItems(req.user!.tenantId, filter);
    res.json(result);
  },
);

router.get(
  "/progress/student/:studentId",
  authenticate,
  requirePermission("observations", "read"),
  validate(z.object({ params: z.object({ studentId: z.string().uuid() }) })),
  async (req: AuthRequest, res: Response) => {
    const progress = await CurriculumService.getStudentProgress(
      req.user!.tenantId,
      req.params.studentId,
    );
    res.json(progress);
  },
);

router.get(
  "/lesson-plans",
  authenticate,
  requirePermission("curriculum", "read"),
  validate(z.object({
    query: z.object({
      classId: z.string().uuid().optional(),
      teacherId: z.string().uuid().optional(),
      date: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  })),
  async (req: AuthRequest, res: Response) => {
    const result = await CurriculumService.getLessonPlans(req.user!.tenantId, {
      classId: req.query.classId as string | undefined,
      teacherId: req.query.teacherId as string | undefined,
      date: req.query.date as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    });
    res.json(result);
  },
);

router.post(
  "/lesson-plans",
  authenticate,
  requirePermission("curriculum", "write"),
  auditLogMiddleware,
  validate(lessonPlanSchema),
  async (req: AuthRequest, res: Response) => {
    const lessonPlan = await CurriculumService.createLessonPlan(
      req.user!.tenantId,
      req.user!.id,
      req.body,
    );
    res.status(201).json(lessonPlan);
  },
);

router.get(
  "/lesson-plans/:id",
  authenticate,
  requirePermission("curriculum", "read"),
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  async (req: AuthRequest, res: Response) => {
    try {
      const lessonPlan = await CurriculumService.getLessonPlanById(
        req.user!.tenantId,
        req.params.id,
      );
      res.json(lessonPlan);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch lesson plan";
      res.status(404).json({ error: message });
    }
  },
);

router.patch(
  "/lesson-plans/:id",
  authenticate,
  requirePermission("curriculum", "write"),
  auditLogMiddleware,
  validate(z.object({
    params: z.object({ id: z.string().uuid() }),
    body: updateLessonPlanSchema,
  })),
  async (req: AuthRequest, res: Response) => {
    try {
      const lessonPlan = await CurriculumService.updateLessonPlan(
        req.user!.tenantId,
        req.params.id,
        req.body,
      );
      res.json(lessonPlan);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update lesson plan";
      res.status(404).json({ error: message });
    }
  },
);

router.delete(
  "/lesson-plans/:id",
  authenticate,
  requirePermission("curriculum", "write"),
  auditLogMiddleware,
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  async (req: AuthRequest, res: Response) => {
    try {
      await CurriculumService.deleteLessonPlan(req.user!.tenantId, req.params.id);
      res.status(204).send();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete lesson plan";
      res.status(404).json({ error: message });
    }
  },
);

export default router;

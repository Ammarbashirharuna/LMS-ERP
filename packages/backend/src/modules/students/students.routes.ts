import { Router, Response } from "express";
import { z } from "zod";
import { StudentService } from "./students.service";
import { validate } from "../../core/middleware/validation";
import { authenticate, AuthRequest } from "../../core/middleware/auth.middleware";
import { requirePermission } from "../../core/middleware/rbac.middleware";
import { auditLogMiddleware } from "../../core/middleware/audit.middleware";
import {
  studentSchema,
  updateStudentSchema,
} from "./students.schema";

const router = Router();

const studentParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const querySchema = z.object({
  query: z.object({
    classId: z.string().uuid().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

router.get(
  "/",
  authenticate,
  requirePermission("students", "read"),
  validate(querySchema),
  async (req: AuthRequest, res: Response) => {
    const filter = {
      classId: req.query.classId as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    };
    const result = await StudentService.getStudents(req.user!.tenantId, filter);
    res.json(result);
  },
);

router.post(
  "/",
  authenticate,
  requirePermission("students", "write"),
  auditLogMiddleware,
  validate(studentSchema),
  async (req: AuthRequest, res: Response) => {
    const student = await StudentService.createStudent(req.user!.tenantId, req.body);
    res.status(201).json(student);
  },
);

router.get(
  "/:id",
  authenticate,
  requirePermission("students", "read"),
  validate(studentParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const student = await StudentService.getStudentById(req.user!.tenantId, req.params.id);
      res.json(student);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch student";
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
    params: z.object({ id: z.string().uuid() }),
    body: updateStudentSchema,
  })),
  async (req: AuthRequest, res: Response) => {
    try {
      const student = await StudentService.updateStudent(req.user!.tenantId, req.params.id, req.body);
      res.json(student);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update student";
      res.status(404).json({ error: message });
    }
  },
);

router.delete(
  "/:id",
  authenticate,
  requirePermission("students", "write"),
  auditLogMiddleware,
  validate(studentParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      await StudentService.deleteStudent(req.user!.tenantId, req.params.id);
      res.status(204).send();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete student";
      res.status(404).json({ error: message });
    }
  },
);

export default router;

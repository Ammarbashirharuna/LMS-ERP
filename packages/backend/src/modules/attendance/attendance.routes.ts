import { Router, Response } from "express";
import { z } from "zod";
import { AttendanceService } from "./attendance.service";
import { validate } from "../../core/middleware/validation";
import { authenticate, AuthRequest } from "../../core/middleware/auth.middleware";
import { requirePermission } from "../../core/middleware/rbac.middleware";
import { auditLogMiddleware } from "../../core/middleware/audit.middleware";
import {
  attendanceSchema,
  batchAttendanceSchema,
  updateAttendanceSchema,
} from "./attendance.schema";

const router = Router();

const querySchema = z.object({
  query: z.object({
    classId: z.string().uuid().optional(),
    studentId: z.string().uuid().optional(),
    date: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

router.get(
  "/",
  authenticate,
  requirePermission("attendance", "read"),
  validate(querySchema),
  async (req: AuthRequest, res: Response) => {
    const filter = {
      classId: req.query.classId as string | undefined,
      studentId: req.query.studentId as string | undefined,
      date: req.query.date as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    };
    const result = await AttendanceService.getAttendance(req.user!.tenantId, filter);
    res.json(result);
  },
);

router.post(
  "/",
  authenticate,
  requirePermission("attendance", "write"),
  auditLogMiddleware,
  validate(attendanceSchema),
  async (req: AuthRequest, res: Response) => {
    const attendance = await AttendanceService.recordAttendance(
      req.user!.tenantId,
      req.user!.id,
      req.body,
    );
    res.status(201).json(attendance);
  },
);

router.post(
  "/bulk",
  authenticate,
  requirePermission("attendance", "write"),
  auditLogMiddleware,
  validate(batchAttendanceSchema),
  async (req: AuthRequest, res: Response) => {
    const { classId, date, records } = req.body;
    const results = await AttendanceService.bulkRecordAttendance(
      req.user!.tenantId,
      req.user!.id,
      classId,
      date,
      records,
    );
    res.status(201).json(results);
  },
);

router.get(
  "/student/:studentId",
  authenticate,
  requirePermission("attendance", "read"),
  validate(z.object({
    params: z.object({ studentId: z.string().uuid() }),
    query: z.object({ month: z.string().optional() }),
  })),
  async (req: AuthRequest, res: Response) => {
    const result = await AttendanceService.getAttendanceByStudent(
      req.user!.tenantId,
      req.params.studentId,
      req.query.month as string | undefined,
    );
    res.json(result);
  },
);

router.patch(
  "/:id",
  authenticate,
  requirePermission("attendance", "write"),
  auditLogMiddleware,
  validate(z.object({
    params: z.object({ id: z.string().uuid() }),
    body: updateAttendanceSchema,
  })),
  async (req: AuthRequest, res: Response) => {
    try {
      const attendance = await AttendanceService.updateAttendance(
        req.user!.tenantId,
        req.params.id,
        req.body,
      );
      res.json(attendance);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update attendance";
      res.status(404).json({ error: message });
    }
  },
);

export default router;

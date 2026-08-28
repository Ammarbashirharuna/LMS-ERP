import { Router, Response } from "express";
import { z } from "zod";
import { GamificationService } from "./gamification.service";
import { validate } from "../../core/middleware/validation";
import { authenticate, AuthRequest } from "../../core/middleware/auth.middleware";
import { requirePermission } from "../../core/middleware/rbac.middleware";
import { auditLogMiddleware } from "../../core/middleware/audit.middleware";
import { badgeSchema, pointSchema } from "./gamification.schema";

const router = Router();

router.get(
  "/badges",
  authenticate,
  requirePermission("settings", "read"),
  async (req: AuthRequest, res: Response) => {
    const badges = await GamificationService.getBadges(req.user!.tenantId);
    res.json(badges);
  },
);

router.post(
  "/badges",
  authenticate,
  requirePermission("settings", "write"),
  auditLogMiddleware,
  validate(badgeSchema),
  async (req: AuthRequest, res: Response) => {
    const badge = await GamificationService.createBadge(req.user!.tenantId, req.body);
    res.status(201).json(badge);
  },
);

router.post(
  "/badges/:badgeId/award/:studentId",
  authenticate,
  requirePermission("settings", "write"),
  auditLogMiddleware,
  validate(z.object({
    params: z.object({
      badgeId: z.string().uuid(),
      studentId: z.string().uuid(),
    }),
  })),
  async (req: AuthRequest, res: Response) => {
    try {
      const award = await GamificationService.awardBadge(
        req.user!.tenantId,
        req.params.badgeId,
        req.params.studentId,
        req.user!.id,
      );
      res.status(201).json(award);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to award badge";
      res.status(404).json({ error: message });
    }
  },
);

router.post(
  "/points",
  authenticate,
  requirePermission("settings", "write"),
  auditLogMiddleware,
  validate(pointSchema),
  async (req: AuthRequest, res: Response) => {
    const point = await GamificationService.awardPoints(req.user!.tenantId, req.body, req.user!.id);
    res.status(201).json(point);
  },
);

router.get(
  "/points/student/:studentId",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const result = await GamificationService.getStudentPoints(
      req.user!.tenantId,
      req.params.studentId,
    );
    res.json(result);
  },
);

router.get(
  "/leaderboard",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const period = (req.query.period as string) || "weekly";
    const entries = await GamificationService.getLeaderboard(req.user!.tenantId, period);
    res.json(entries);
  },
);

router.post(
  "/leaderboard/calculate",
  authenticate,
  requirePermission("settings", "write"),
  async (req: AuthRequest, res: Response) => {
    const period = (req.body.period as string) || "weekly";
    const entries = await GamificationService.calculateLeaderboard(req.user!.tenantId, period);
    res.json(entries);
  },
);

export default router;

import { Router, Response } from "express";
import { SettingsService } from "./settings.service";
import { authenticate, AuthRequest } from "../../core/middleware/auth.middleware";
import { requirePermission } from "../../core/middleware/rbac.middleware";
import { auditLogMiddleware } from "../../core/middleware/audit.middleware";

const router = Router();

router.get(
  "/",
  authenticate,
  requirePermission("settings", "read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const settings = await SettingsService.getSettings(req.user!.tenantId);
      res.json(settings);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch settings";
      res.status(400).json({ error: message });
    }
  },
);

router.put(
  "/",
  authenticate,
  requirePermission("settings", "write"),
  auditLogMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const settings = await SettingsService.updateSettings(req.user!.tenantId, req.body);
      res.json(settings);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update settings";
      res.status(400).json({ error: message });
    }
  },
);

export default router;

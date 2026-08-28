import { Router, Response } from "express";
import { z } from "zod";
import { AuditLogService } from "./audit.service";
import { validate } from "../../core/middleware/validation";
import { authenticate, AuthRequest } from "../../core/middleware/auth.middleware";
import { requirePermission } from "../../core/middleware/rbac.middleware";

const router = Router();

const auditQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
});

router.get(
  "/",
  authenticate,
  requirePermission("audit", "read"),
  validate(auditQuerySchema),
  async (req: AuthRequest, res: Response) => {
    const options = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      resource: req.query.resource as string,
      action: req.query.action as string,
      userId: req.query.userId as string,
    };

    const result = await AuditLogService.getAuditLogs(req.user!.id, req.user!.tenantId, options);
    res.json(result);
  }
);

export default router;

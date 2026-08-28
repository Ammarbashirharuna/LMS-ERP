import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { prisma } from "../../lib/prisma";

export const auditLogMiddleware = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const method = req.method;
  const resource = req.route?.path || req.path.split("/").pop() || "unknown";

  if (["POST", "PATCH", "PUT", "DELETE"].includes(method) && req.user) {
    const action = method === "POST" ? "create" :
                   method === "PATCH" || method === "PUT" ? "update" :
                   method === "DELETE" ? "delete" : "read";

    // Don't block the request if logging fails
    try {
      const sanitizedBody = { ...req.body };
      delete sanitizedBody.password;
      delete sanitizedBody.passwordHash;
      delete sanitizedBody.refreshToken;

      await prisma.auditLog.create({
        data: {
          tenantId: req.user.tenantId,
          userId: req.user.id,
          action,
          resource,
          meta: {
            method,
            path: req.originalUrl,
            body: sanitizedBody,
            query: req.query,
          },
        },
      });
    } catch (error) {
      // Non-blocking - log to console in dev
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn("Audit log write failed:", error);
      }
    }
  }

  next();
};

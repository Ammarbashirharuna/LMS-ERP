import { AuthRequest } from "./auth.middleware";
import { Response, NextFunction } from "express";

export const requirePermission = (resource: string, action: string) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    const permission = `${resource}:${action}`;

    if (!req.user) {
      return next();
    }

    if (!req.user.permissions.includes(permission)) {
      return req.res?.status(403).json({
        error: "Forbidden",
        message: `Missing permission: ${permission}`,
      });
    }

    next();
  };
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return req.res?.status(403).json({
        error: "Forbidden",
        message: `Requires one of: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

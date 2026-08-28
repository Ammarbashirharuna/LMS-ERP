import { Request, Response, NextFunction } from "express";
import { config } from "../../config";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    roleId: string;
    role: string;
    permissions: string[];
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtAccessSecret) as {
      id: string;
      tenantId: string;
      email: string;
      roleId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id, tenantId: decoded.tenantId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({ error: "Invalid or inactive user" });
    }

    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roleId: user.roleId,
      role: user.role.name,
      permissions: user.role.permissions.map((p) => `${p.resource}:${p.action}`),
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

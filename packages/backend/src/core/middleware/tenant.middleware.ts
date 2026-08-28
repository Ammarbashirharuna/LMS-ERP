import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";

export const tenantResolver = async (req: Request, _res: Response, next: NextFunction) => {
  const host = req.headers.host || "";
  const subdomain = host.split(".")[0];
  const tenantId = req.headers["x-tenant-id"] as string;

  if (tenantId) {
    req.tenantId = tenantId;
    return next();
  }

  if (subdomain && subdomain !== "localhost") {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
      select: { id: true },
    });

    if (tenant) {
      req.tenantId = tenant.id;
    }
  }

  next();
};

export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  if (!req.tenantId) {
    return res.status(401).json({ error: "Tenant identification required" });
  }
  next();
};

// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

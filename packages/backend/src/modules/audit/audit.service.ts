import { prisma } from "../../lib/prisma";

export class AuditLogService {
  static async getAuditLogs(userId: string, tenantId: string, options: {
    page?: number;
    limit?: number;
    resource?: string;
    action?: string;
    userId?: string;
  }): Promise<{ data: Array<Record<string, unknown>>; pagination: { page: number; limit: number; total: number; pages: number } }> {
    const { page = 1, limit = 50, resource, action, userId: filterUserId } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (resource) where.resource = resource;
    if (action) where.action = action;
    if (filterUserId) where.userId = filterUserId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

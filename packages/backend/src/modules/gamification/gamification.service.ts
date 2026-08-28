import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

interface BadgeData {
  name: string;
  description?: string;
  icon?: string;
  criteria: Record<string, unknown>;
}

interface PointData {
  studentId: string;
  value: number;
  reason: string;
}

export class GamificationService {
  static async getBadges(tenantId: string) {
    return prisma.badge.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      include: {
        awardees: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  static async createBadge(tenantId: string, data: BadgeData) {
    return prisma.badge.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        icon: data.icon,
        criteria: data.criteria as Prisma.InputJsonObject,
      },
    });
  }

  static async awardBadge(tenantId: string, badgeId: string, studentId: string, awardedBy?: string) {
    return await prisma.$transaction(async (tx) => {
      const badge = await tx.badge.findFirst({
        where: { tenantId, id: badgeId },
      });

      if (!badge) {
        throw new Error("Badge not found");
      }

      return tx.badgeAward.create({
        data: {
          badgeId,
          studentId,
          tenantId,
          awardedBy: awardedBy ?? null,
        },
      });
    });
  }

  static async awardPoints(tenantId: string, data: PointData, awardedBy?: string) {
    return prisma.point.create({
      data: {
        tenantId,
        studentId: data.studentId,
        value: data.value,
        reason: data.reason,
        awardedBy: awardedBy ?? null,
      },
    });
  }

  static async getStudentPoints(tenantId: string, studentId: string) {
    const points = await prisma.point.findMany({
      where: { tenantId, studentId },
      orderBy: { awardedAt: "desc" },
    });

    const total = points.reduce((sum, p) => sum + p.value, 0);

    return { points, total };
  }

  static async getLeaderboard(tenantId: string, period: string = "weekly") {
    const entries = await prisma.leaderboardEntry.findMany({
      where: { tenantId, period },
      orderBy: { score: "desc" },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
      },
      take: 50,
    });

    return entries;
  }

  static async calculateLeaderboard(tenantId: string, period: string = "weekly") {
    await prisma.$transaction(async (tx) => {
      const points = await tx.point.findMany({
        where: { tenantId },
        select: { studentId: true, value: true },
      });

      const studentTotals = points.reduce(
        (acc, p) => {
          acc[p.studentId] = (acc[p.studentId] || 0) + p.value;
          return acc;
        },
        {} as Record<string, number>,
      );

      for (const [studentId, score] of Object.entries(studentTotals)) {
        await tx.leaderboardEntry.upsert({
          where: {
            tenantId_studentId_period: {
              tenantId,
              studentId,
              period,
            },
          },
          update: { score, updatedAt: new Date() },
          create: {
            tenantId,
            studentId,
            period,
            score,
          },
        });
      }
    });

    return this.getLeaderboard(tenantId, period);
  }
}

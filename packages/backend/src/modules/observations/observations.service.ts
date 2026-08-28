import { MasteryLevel } from "@prisma/client";
import { prisma } from "../../lib/prisma";

interface ObservationData {
  studentId: string;
  teacherId: string;
  note: string;
  masteryLevel: MasteryLevel;
  curriculumItemId?: string | null;
  lessonPlanId?: string | null;
}

interface ObservationFilter {
  studentId?: string;
  teacherId?: string;
  classId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  masteryLevel?: MasteryLevel;
  page?: number;
  limit?: number;
}

export class ObservationService {
  static async createObservation(tenantId: string, data: ObservationData) {
    return prisma.observation.create({
      data: {
        tenantId,
        studentId: data.studentId,
        teacherId: data.teacherId,
        note: data.note,
        masteryLevel: data.masteryLevel,
        curriculumItemId: data.curriculumItemId ?? undefined,
        lessonPlanId: data.lessonPlanId ?? undefined,
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true },
        },
        curriculumItem: {
          select: { id: true, title: true, area: { select: { name: true } } },
        },
      },
    });
  }

  static async getObservations(tenantId: string, filter: ObservationFilter = {}) {
    const { studentId, teacherId, classId, date, startDate, endDate, masteryLevel, page, limit } = filter;
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const andConditions: Array<Record<string, unknown>> = [];

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      andConditions.push({ createdAt: { gte: startOfDay } });
      andConditions.push({ createdAt: { lte: endOfDay } });
    } else if (startDate || endDate) {
      if (startDate) andConditions.push({ createdAt: { gte: new Date(startDate) } });
      if (endDate) andConditions.push({ createdAt: { lte: new Date(endDate) } });
    }

    const where: Record<string, unknown> = {
      tenantId,
      ...(studentId && { studentId }),
      ...(teacherId && { teacherId }),
      ...(masteryLevel && { masteryLevel }),
      ...(andConditions.length > 0 && { AND: andConditions }),
    };

    let modifiedWhere = where;
    if (classId) {
      const classStudentIds = await prisma.student.findMany({
        where: { tenantId, classId },
        select: { id: true },
      });
      modifiedWhere = {
        ...where,
        studentId: { in: classStudentIds.map((s) => s.id) },
      };
    }

    const [observations, total] = await Promise.all([
      prisma.observation.findMany({
        where: modifiedWhere,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true },
          },
          curriculumItem: {
            select: { id: true, title: true, area: { select: { id: true, name: true } } },
          },
        },
      }),
      prisma.observation.count({ where: modifiedWhere as Record<string, unknown> }),
    ]);

    if (page && limit) {
      return {
        data: observations,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    }

    return { data: observations };
  }

  static async getStudentProgress(tenantId: string, studentId: string) {
    const observations = await prisma.observation.findMany({
      where: { tenantId, studentId },
      orderBy: { createdAt: "desc" },
      include: {
        curriculumItem: {
          select: {
            id: true,
            title: true,
            area: { select: { name: true } },
          },
        },
      },
    });

    const progress: Record<string, { mastery: MasteryLevel; lastObserved: Date; observations: typeof observations }> = {};

    for (const obs of observations) {
      const key = obs.curriculumItemId || obs.id;
      if (!progress[key]) {
        progress[key] = {
          mastery: obs.masteryLevel,
          lastObserved: obs.createdAt,
          observations: [],
        };
      }
      progress[key].observations.push(obs);
    }

    const progressSummary = Object.entries(progress).map(([key, value]) => ({
      curriculumItemId: key.startsWith("curriculum") ? key : null,
      masteryLevel: value.mastery,
      lastObserved: value.lastObserved,
      observationCount: value.observations.length,
    }));

    return progressSummary;
  }

  static async updateObservation(tenantId: string, id: string, data: Partial<ObservationData>) {
    const observation = await prisma.observation.findFirst({
      where: { tenantId, id },
    });

    if (!observation) {
      throw new Error("Observation not found");
    }

    return prisma.observation.update({
      where: { id },
      data,
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  static async deleteObservation(tenantId: string, id: string): Promise<void> {
    const observation = await prisma.observation.findFirst({
      where: { tenantId, id },
    });

    if (!observation) {
      throw new Error("Observation not found");
    }

    await prisma.observation.delete({ where: { id } });
  }
}

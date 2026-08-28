import { prisma } from "../../lib/prisma";

interface LessonPlanData {
  title: string;
  content?: string;
  date: string;
  curriculumItemId?: string;
  classId?: string;
}

interface LessonPlanUpdateData {
  title?: string;
  content?: string;
  date?: string;
  curriculumItemId?: string | null;
  classId?: string | null;
}

interface CurriculumFilter {
  areaId?: string;
  classId?: string;
  studentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class CurriculumService {
  static async getCurriculumAreas() {
    return prisma.curriculumArea.findMany({
      orderBy: { order: "asc" },
      include: {
        items: {
          orderBy: { title: "asc" },
        },
      },
    });
  }

  static async getCurriculumTree(tenantId: string, studentId?: string, classId?: string) {
    const areas = await prisma.curriculumArea.findMany({
      orderBy: { order: "asc" },
      include: {
        items: {
          include: {
            lessonPlans: true,
          },
        },
      },
    });

    const tree = areas.map((area) => ({
      id: area.id,
      name: area.name,
      order: area.order,
      items: area.items.map((item) => ({
        id: item.id,
        title: item.title,
        ageBand: item.ageBand,
        description: item.description,
        materialIds: item.materialIds,
        lessonPlanCount: 0,
        observationCount: 0,
        latestMastery: null as string | null,
      })),
    }));

    if (studentId) {
      const observations = await prisma.observation.findMany({
        where: { tenantId, studentId },
        include: { curriculumItem: { select: { areaId: true } } },
        orderBy: { createdAt: "desc" },
      });

      for (const area of tree) {
        for (const item of area.items) {
          const itemObservations = observations.filter(
            (o) => o.curriculumItemId === item.id,
          );
          item.observationCount = itemObservations.length;
          if (itemObservations.length > 0) {
            item.latestMastery = itemObservations[0].masteryLevel;
          }
        }
      }
    }

    if (classId) {
      const lessonPlansForClass = await prisma.lessonPlan.findMany({
        where: { tenantId, classId },
        select: { curriculumItemId: true },
      });

      const planCounts = lessonPlansForClass.reduce(
        (acc, lp) => {
          const key = lp.curriculumItemId || "__null__";
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      for (const area of tree) {
        for (const item of area.items) {
          item.lessonPlanCount = planCounts[item.id] || 0;
        }
      }
    }

    return tree;
  }

  static async getCurriculumItems(tenantId: string, filter: CurriculumFilter = {}) {
    const { areaId, search, page, limit } = filter;
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const where: { areaId?: string } = {};
    if (areaId) where.areaId = areaId;

    const items = await prisma.curriculumItem.findMany({
      where: {
        ...where,
        ...(search
          ? { OR: [{ title: { contains: search, mode: "insensitive" as const } }] }
          : {}),
      },
      skip,
      take,
      include: {
        area: true,
      },
      orderBy: { title: "asc" },
    });

    if (page && limit) {
      const total = await prisma.curriculumItem.count({ where });
      return {
        data: items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    }

    return { data: items };
  }

  static async createLessonPlan(tenantId: string, teacherId: string, data: LessonPlanData) {
    return prisma.lessonPlan.create({
      data: {
        tenantId,
        teacherId,
        title: data.title,
        content: data.content,
        date: new Date(data.date),
        curriculumItemId: data.curriculumItemId,
        classId: data.classId,
      },
      include: {
        curriculumItem: { select: { title: true, area: { select: { name: true } } } },
        classRoom: { select: { name: true } },
      },
    });
  }

  static async getLessonPlans(tenantId: string, filters?: {
    classId?: string;
    teacherId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Record<string, unknown> = { tenantId };

    if (filters?.classId) where.classId = filters.classId;
    if (filters?.teacherId) where.teacherId = filters.teacherId;

    if (filters?.date) {
      where.AND = [{ date: { equals: new Date(filters.date) } }];
    } else if (filters?.startDate || filters?.endDate) {
      const andConditions: Array<Record<string, unknown>> = [];
      if (filters.startDate) andConditions.push({ date: { gte: new Date(filters.startDate) } });
      if (filters.endDate) andConditions.push({ date: { lte: new Date(filters.endDate) } });
      where.AND = andConditions;
    }

    return prisma.lessonPlan.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        curriculumItem: { select: { title: true, area: { select: { name: true } } } },
        classRoom: { select: { name: true } },
      },
    });
  }

  static async getLessonPlanById(tenantId: string, id: string) {
    const lessonPlan = await prisma.lessonPlan.findFirst({
      where: { tenantId, id },
      include: {
        curriculumItem: {
          include: { area: true },
        },
        classRoom: true,
      },
    });

    if (!lessonPlan) {
      throw new Error("Lesson plan not found");
    }

    return lessonPlan;
  }

  static async updateLessonPlan(tenantId: string, id: string, data: LessonPlanUpdateData) {
    const lessonPlan = await prisma.lessonPlan.findFirst({
      where: { tenantId, id },
    });

    if (!lessonPlan) {
      throw new Error("Lesson plan not found");
    }

    return prisma.lessonPlan.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.curriculumItemId !== undefined && { curriculumItemId: data.curriculumItemId }),
        ...(data.classId !== undefined && { classId: data.classId }),
      },
      include: {
        curriculumItem: { select: { title: true, area: { select: { name: true } } } },
        classRoom: { select: { name: true } },
      },
    });
  }

  static async deleteLessonPlan(tenantId: string, id: string): Promise<void> {
    const lessonPlan = await prisma.lessonPlan.findFirst({
      where: { tenantId, id },
    });

    if (!lessonPlan) {
      throw new Error("Lesson plan not found");
    }

    await prisma.lessonPlan.delete({ where: { id } });
  }

  static async getStudentProgress(tenantId: string, studentId: string) {
    const observations = await prisma.observation.findMany({
      where: { tenantId, studentId },
      include: {
        curriculumItem: {
          include: { area: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const progressByArea: Record<string, { area: string; items: Array<{ title: string; mastery: string; observations: number; lastObserved: Date }> }> = {};

    for (const obs of observations) {
      const areaName = obs.curriculumItem?.area?.name || "Uncategorized";
      const itemTitle = obs.curriculumItem?.title || "Unknown";

      if (!progressByArea[areaName]) {
        progressByArea[areaName] = { area: areaName, items: [] };
      }

      const existing = progressByArea[areaName].items.find((i) => i.title === itemTitle);
      if (existing) {
        existing.observations += 1;
        if (obs.createdAt > existing.lastObserved) {
          existing.lastObserved = obs.createdAt;
        }
        existing.mastery = obs.masteryLevel;
      } else {
        progressByArea[areaName].items.push({
          title: itemTitle,
          mastery: obs.masteryLevel,
          observations: 1,
          lastObserved: obs.createdAt,
        });
      }
    }

    return Object.values(progressByArea);
  }
}

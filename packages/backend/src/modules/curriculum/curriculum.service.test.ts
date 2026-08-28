/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { CurriculumService } from "./curriculum.service";

jest.mock("@prisma/client", () => {
  const lessonPlan = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };
  const observation = {
    findMany: jest.fn(),
  };
  const student = {
    findMany: jest.fn(),
  };
  const curriculumArea = {
    findMany: jest.fn(),
  };
  const curriculumItem = {
    findMany: jest.fn(),
    count: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => ({
      lessonPlan,
      observation,
      student,
      curriculumArea,
      curriculumItem,
    })),
    lessonPlanMocks: lessonPlan,
    observationMocks: observation,
    studentMocks: student,
    curriculumAreaMocks: curriculumArea,
    curriculumItemMocks: curriculumItem,
    MasteryLevel: { INTRODUCED: "INTRODUCED", PRACTICING: "PRACTICING", MASTERED: "MASTERED" },
  };
});

// @ts-expect-error - jest.mock adds these exports
import { lessonPlanMocks, observationMocks } from "@prisma/client";

describe("CurriculumService", () => {
  const mockLessonPlan = {
    id: "lp-123",
    tenantId: "tenant-456",
    teacherId: "teacher-001",
    title: "Practical Life: Pouring Activity",
    content: "Students learn to pour from large pitcher to small pitcher",
    date: new Date("2025-01-15"),
    classId: "class-789",
    curriculumItemId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    curriculumItem: null,
    classRoom: { name: "Sunshine Room" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    new PrismaClient();
  });

  describe("getLessonPlanById", () => {
    it("should return a lesson plan when found", async () => {
      (lessonPlanMocks as any).findFirst.mockResolvedValue(mockLessonPlan);

      const result = await CurriculumService.getLessonPlanById("tenant-456", "lp-123");
      expect(result.id).toBe("lp-123");
    });

    it("should throw when lesson plan not found", async () => {
      (lessonPlanMocks as any).findFirst.mockResolvedValue(null);

      await expect(CurriculumService.getLessonPlanById("tenant-456", "missing")).rejects.toThrow(
        "Lesson plan not found",
      );
    });
  });

  describe("deleteLessonPlan", () => {
    it("should throw when lesson plan not found", async () => {
      (lessonPlanMocks as any).findFirst.mockResolvedValue(null);

      await expect(CurriculumService.deleteLessonPlan("tenant-456", "missing")).rejects.toThrow(
        "Lesson plan not found",
      );
    });

    it("should call delete when lesson plan exists", async () => {
      (lessonPlanMocks as any).findFirst.mockResolvedValue(mockLessonPlan);
      (lessonPlanMocks as any).delete = jest.fn().mockResolvedValue(mockLessonPlan);

      await CurriculumService.deleteLessonPlan("tenant-456", "lp-123");
      expect((lessonPlanMocks as any).delete).toHaveBeenCalledWith({ where: { id: "lp-123" } });
    });
  });

  describe("getStudentProgress", () => {
    it("should return progress organized by area", async () => {
      const mockObservation = {
        id: "obs-1",
        masteryLevel: "PRACTICING",
        createdAt: new Date("2025-01-15"),
        curriculumItem: {
          id: "item-1",
          title: "Baking",
          area: { name: "Practical Life" },
        },
      };
      (observationMocks as any).findMany.mockResolvedValue([mockObservation]);

      const result = await CurriculumService.getStudentProgress("tenant-456", "student-789");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].area).toBe("Practical Life");
      expect(result[0].items[0].title).toBe("Baking");
      expect(result[0].items[0].mastery).toBe("PRACTICING");
    });
  });
});

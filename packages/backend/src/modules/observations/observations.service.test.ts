/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
// @ts-expect-error - jest.mock adds these exports
import { observationMocks } from "@prisma/client";
import { ObservationService } from "./observations.service";

jest.mock("@prisma/client", () => {
  const observation = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const student = {
    findMany: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => ({ observation, student })),
    observationMocks: observation,
    studentMocks: student,
    MasteryLevel: { INTRODUCED: "INTRODUCED", PRACTICING: "PRACTICING", MASTERED: "MASTERED" },
  };
});

describe("ObservationService", () => {
  const mockObservation = {
    id: "obs-123",
    tenantId: "tenant-456",
    studentId: "student-789",
    teacherId: "teacher-001",
    note: "Student showed great focus during practical life activities",
    masteryLevel: "PRACTICING",
    curriculumItemId: null,
    lessonPlanId: null,
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-01-15"),
    student: { id: "student-789", firstName: "Alice", lastName: "Montessori" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    new PrismaClient();
  });

  describe("createObservation", () => {
    it("should create an observation record", async () => {
      const mockCreate = jest.fn().mockResolvedValue(mockObservation);
      (observationMocks as any).create = mockCreate;

      const result = await ObservationService.createObservation("tenant-456", {
        studentId: "student-789",
        teacherId: "teacher-001",
        note: "Test note",
        masteryLevel: "PRACTICING",
      });

      expect(mockCreate).toHaveBeenCalled();
      expect(result.id).toBe("obs-123");
    });
  });

  describe("getStudentProgress", () => {
    it("should return progress summary for a student", async () => {
      (observationMocks as any).findMany.mockResolvedValue([mockObservation]);

      const result = await ObservationService.getStudentProgress("tenant-456", "student-789");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("updateObservation", () => {
    it("should throw when observation not found", async () => {
      (observationMocks as any).findFirst.mockResolvedValue(null);

      await expect(
        ObservationService.updateObservation("tenant-456", "missing", { note: "Updated" }),
      ).rejects.toThrow("Observation not found");
    });

    it("should update observation when found", async () => {
      const mockUpdate = jest.fn().mockResolvedValue({ ...mockObservation, note: "Updated note" });
      (observationMocks as any).findFirst.mockResolvedValue(mockObservation);
      (observationMocks as any).update = mockUpdate;

      const result = await ObservationService.updateObservation("tenant-456", "obs-123", {
        note: "Updated note",
      });

      expect(mockUpdate).toHaveBeenCalled();
      expect(result.note).toBe("Updated note");
    });
  });
});

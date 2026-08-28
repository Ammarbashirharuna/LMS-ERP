import { ClassRoomService } from "./classes.service";

jest.mock("@prisma/client", () => {
  const classRoom = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const student = {
    findMany: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => ({ classRoom, student })),
    classRoomMocks: classRoom,
    studentMocks: student,
  };
});

// @ts-expect-error - jest.mock adds these exports
import { PrismaClient, classRoomMocks } from "@prisma/client";

describe("ClassRoomService", () => {
  const mockClassRoom = {
    id: "class-123",
    tenantId: "tenant-456",
    name: "Sunshine Room",
    academicYear: "2025-2026",
    teacherIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    new PrismaClient();
  });

  describe("getClassRoomById", () => {
    it("should return a class when found", async () => {
      classRoomMocks.findFirst.mockResolvedValue(mockClassRoom);

      const result = await ClassRoomService.getClassRoomById("tenant-456", "class-123");
      expect(result.id).toBe("class-123");
      expect(result.name).toBe("Sunshine Room");
    });

    it("should throw when class is not found", async () => {
      classRoomMocks.findFirst.mockResolvedValue(null);

      await expect(ClassRoomService.getClassRoomById("tenant-456", "missing")).rejects.toThrow(
        "Class not found",
      );
    });
  });

  describe("deleteClassRoom", () => {
    it("should throw when class is not found", async () => {
      classRoomMocks.findFirst.mockResolvedValue(null);

      await expect(ClassRoomService.deleteClassRoom("tenant-456", "missing")).rejects.toThrow(
        "Class not found",
      );
    });

    it("should call delete when class exists", async () => {
      classRoomMocks.findFirst.mockResolvedValue(mockClassRoom);

      await ClassRoomService.deleteClassRoom("tenant-456", "class-123");
      expect(classRoomMocks.delete).toHaveBeenCalledWith({ where: { id: "class-123" } });
    });
  });
});

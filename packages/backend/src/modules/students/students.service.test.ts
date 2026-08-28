/* eslint-disable @typescript-eslint/no-explicit-any */
import { StudentService } from "./students.service";
// @ts-expect-error - jest.mock adds these exports
import { PrismaClient, studentMocks } from "@prisma/client";

jest.mock("@prisma/client", () => {
  const student = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const studentGuardian = {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => ({ student, studentGuardian })),
    studentMocks: student,
    studentGuardianMocks: studentGuardian,
  };
});

describe("StudentService", () => {
  const mockStudentData = {
    id: "student-123",
    tenantId: "tenant-456",
    firstName: "Alice",
    lastName: "Montessori",
    dob: new Date("2018-05-15"),
    gender: "FEMALE",
    classId: "class-789",
    enrollmentDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    classRoom: { id: "class-789", name: "Sunshine Room" },
    guardians: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    new PrismaClient();
  });

  describe("getStudentById", () => {
    it("should return a student when found", async () => {
      studentMocks.findFirst.mockResolvedValue(mockStudentData);

      const result = await StudentService.getStudentById("tenant-456", "student-123");
      expect(result.id).toBe("student-123");
      expect(result.firstName).toBe("Alice");
    });

    it("should throw when student is not found", async () => {
      studentMocks.findFirst.mockResolvedValue(null);

      await expect(StudentService.getStudentById("tenant-456", "missing")).rejects.toThrow(
        "Student not found",
      );
    });
  });

  describe("deleteStudent", () => {
    it("should throw when student is not found", async () => {
      studentMocks.findFirst.mockResolvedValue(null);

      await expect(StudentService.deleteStudent("tenant-456", "missing")).rejects.toThrow(
        "Student not found",
      );
    });

    it("should call delete when student exists", async () => {
      studentMocks.findFirst.mockResolvedValue(mockStudentData);

      await StudentService.deleteStudent("tenant-456", "student-123");
      expect(studentMocks.findFirst).toHaveBeenCalledWith({ where: { tenantId: "tenant-456", id: "student-123" } });
      expect(studentMocks.delete).toHaveBeenCalledWith({ where: { tenantId: "tenant-456", id: "student-123" } });
    });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { AttendanceService } from "./attendance.service";
// @ts-expect-error - jest.mock adds these exports
import { PrismaClient, attendanceMocks } from "@prisma/client";

jest.mock("@prisma/client", () => {
  const attendance = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const student = {
    findMany: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => ({ attendance, student })),
    attendanceMocks: attendance,
    studentMocks: student,
    SyncStatus: { SYNCED: "SYNCED", PENDING: "PENDING", CONFLICT: "CONFLICT" },
    AttendanceStatus: { PRESENT: "PRESENT", ABSENT: "ABSENT", LATE: "LATE", EXCUSED: "EXCUSED" },
  };
});

describe("AttendanceService", () => {
  const mockAttendanceData = {
    id: "att-123",
    studentId: "student-456",
    tenantId: "tenant-789",
    date: new Date("2025-01-15"),
    status: "PRESENT",
    reasonCode: null,
    syncStatus: "SYNCED",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    new PrismaClient();
  });

  describe("recordAttendance", () => {
    it("should create new attendance record when none exists", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        id: "att-123",
        studentId: "student-456",
        date: new Date("2025-01-15"),
        status: "PRESENT",
        reasonCode: null,
      });

      attendanceMocks.findFirst.mockResolvedValue(null);
      attendanceMocks.create = mockCreate;

      const result = await AttendanceService.recordAttendance("tenant-789", "user-1", {
        studentId: "student-456",
        date: "2025-01-15",
        status: "PRESENT",
      });

      expect(mockCreate).toHaveBeenCalled();
      expect(result.id).toBe("att-123");
      expect(result.status).toBe("PRESENT");
    });

    it("should update existing attendance record", async () => {
      const mockUpdate = jest.fn().mockResolvedValue({
        id: "att-123",
        studentId: "student-456",
        date: new Date("2025-01-15"),
        status: "ABSENT",
        reasonCode: "sick",
      });

      attendanceMocks.findFirst.mockResolvedValue({
        ...mockAttendanceData,
        id: "existing-1",
      });
      attendanceMocks.update = mockUpdate;

      const result = await AttendanceService.recordAttendance("tenant-789", "user-1", {
        studentId: "student-456",
        date: "2025-01-15",
        status: "ABSENT",
        reasonCode: "sick",
      });

      expect(mockUpdate).toHaveBeenCalled();
      expect(result.status).toBe("ABSENT");
    });
  });

  describe("updateAttendance", () => {
    it("should update attendance status", async () => {
      const mockUpdate = jest.fn().mockResolvedValue({
        ...mockAttendanceData,
        id: "att-123",
        status: "LATE",
      });

      attendanceMocks.findFirst.mockResolvedValue({
        ...mockAttendanceData,
        id: "att-123",
      });
      attendanceMocks.update = mockUpdate;

      const result = await AttendanceService.updateAttendance("tenant-789", "att-123", {
        status: "LATE",
      });

      expect(mockUpdate).toHaveBeenCalled();
      expect(result.status).toBe("LATE");
    });

    it("should throw when attendance record not found", async () => {
      attendanceMocks.findFirst.mockResolvedValue(null);

      await expect(
        AttendanceService.updateAttendance("tenant-789", "missing", { status: "LATE" }),
      ).rejects.toThrow("Attendance record not found");
    });
  });
});

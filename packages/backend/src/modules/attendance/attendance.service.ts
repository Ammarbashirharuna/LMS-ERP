import { AttendanceStatus, SyncStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";

interface AttendanceData {
  studentId: string;
  date: string;
  status: AttendanceStatus;
  reasonCode?: string;
}

interface AttendanceFilter {
  classId?: string;
  studentId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class AttendanceService {
  static async recordAttendance(
    tenantId: string,
    userId: string,
    data: AttendanceData,
  ): Promise<{ id: string; studentId: string; date: Date; status: AttendanceStatus; reasonCode: string | null }> {
    const existing = await prisma.attendance.findFirst({
      where: {
        tenantId,
        studentId: data.studentId,
        date: new Date(data.date),
      },
    });

    const attendanceData = {
      tenantId,
      studentId: data.studentId,
      date: new Date(data.date),
      status: data.status,
      reasonCode: data.reasonCode ?? null,
      ...(existing ? { syncStatus: SyncStatus.SYNCED } : {}),
    };

    if (existing) {
      return prisma.attendance.update({
        where: { id: existing.id },
        data: attendanceData,
        select: {
          id: true,
          studentId: true,
          date: true,
          status: true,
          reasonCode: true,
        },
      });
    }

    return prisma.attendance.create({
      data: attendanceData,
      select: {
        id: true,
        studentId: true,
        date: true,
        status: true,
        reasonCode: true,
      },
    });
  }

  static async bulkRecordAttendance(
    tenantId: string,
    userId: string,
    classId: string | undefined,
    date: string,
    records: Array<{ studentId: string; status: AttendanceStatus; reasonCode?: string }>,
  ) {
    const results: Array<{ id: string; studentId: string; date: Date; status: AttendanceStatus; reasonCode: string | null }> = [];

    for (const record of records) {
      const result = await this.recordAttendance(tenantId, userId, {
        studentId: record.studentId,
        date,
        status: record.status,
        reasonCode: record.reasonCode,
      });
      results.push(result);
    }

    return results;
  }

  static async getAttendance(tenantId: string, filter: AttendanceFilter = {}) {
    const { classId, studentId, date, startDate, endDate, page, limit } = filter;
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const where: {
      tenantId: string;
      studentId?: string;
      date?: Date;
      AND?: Array<{ date?: { gte?: Date; lte?: Date } }>;
    } = { tenantId };

    if (studentId) where.studentId = studentId;

    if (date) {
      where.date = new Date(date);
    } else if (startDate || endDate) {
      where.AND = [];
      if (startDate) where.AND.push({ date: { gte: new Date(startDate) } });
      if (endDate) where.AND.push({ date: { lte: new Date(endDate) } });
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take,
        orderBy: { date: "desc" },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    if (page && limit) {
      return {
        data: records,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    }

    if (classId) {
      const classStudents = await prisma.student.findMany({
        where: { tenantId, classId },
        select: { id: true },
      });
      const filtered = records.filter((r) =>
        classStudents.some((s) => s.id === r.studentId),
      );
      return { data: filtered };
    }

    return { data: records };
  }

  static async getAttendanceByStudent(tenantId: string, studentId: string, month?: string) {
    const where: {
      tenantId: string;
      studentId: string;
      date?: { gte: Date; lte: Date };
    } = { tenantId, studentId };

    if (month) {
      const [year, mon] = month.split("-").map(Number);
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 0, 23, 59, 59);
      where.date = { gte: start, lte: end };
    }

    return prisma.attendance.findMany({
      where,
      orderBy: { date: "desc" },
    });
  }

  static async updateAttendance(tenantId: string, attendanceId: string, data: {
    status?: AttendanceStatus;
    reasonCode?: string;
  }) {
    const attendance = await prisma.attendance.findFirst({
      where: { tenantId, id: attendanceId },
    });

    if (!attendance) {
      throw new Error("Attendance record not found");
    }

    return prisma.attendance.update({
      where: { id: attendanceId },
      data,
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }
}

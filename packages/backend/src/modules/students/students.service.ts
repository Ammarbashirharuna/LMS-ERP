import { Gender } from "@prisma/client";
import { prisma } from "../../lib/prisma";

interface StudentData {
  firstName: string;
  lastName: string;
  dob: string;
  gender?: Gender | null;
  classId?: string | null;
  guardianIds?: string[];
}

interface StudentUpdateData {
  firstName?: string;
  lastName?: string;
  dob?: string;
  gender?: Gender | null;
  classId?: string | null;
  guardianIds?: string[];
}

interface StudentFilter {
  classId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class StudentService {
  static async createStudent(tenantId: string, data: StudentData) {
    const { guardianIds, ...studentData } = data;

    const student = await prisma.student.create({
      data: {
        ...studentData,
        tenantId,
        dob: new Date(studentData.dob),
        guardians: guardianIds && guardianIds.length > 0
          ? { create: guardianIds.map((id) => ({ guardian: { connect: { id, tenantId } } })) }
          : undefined,
      },
      include: {
        classRoom: true,
        guardians: { include: { guardian: true } },
      },
    });

    return student;
  }

  static async getStudents(tenantId: string, filter: StudentFilter = {}) {
    const { classId, search, page, limit } = filter;
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const where: {
      tenantId: string;
      classId?: string;
      OR?: Array<{ firstName: { contains: string; mode: "insensitive" } } | { lastName: { contains: string; mode: "insensitive" } }>;
    } = { tenantId };

    if (classId) where.classId = classId;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take,
        include: { classRoom: true },
        orderBy: { lastName: "asc" },
      }),
      prisma.student.count({ where }),
    ]);

    if (page && limit) {
      return {
        data: students,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }

    return { data: students };
  }

  static async getStudentById(tenantId: string, studentId: string) {
    const student = await prisma.student.findFirst({
      where: { tenantId, id: studentId },
      include: {
        classRoom: true,
        guardians: {
          include: {
            guardian: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                relationship: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        attendance: {
          orderBy: { date: "desc" },
          take: 10,
        },
      },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    return student;
  }

  static async updateStudent(tenantId: string, studentId: string, data: StudentUpdateData) {
    const { guardianIds, ...rest } = data;

    await prisma.student.update({
      where: { tenantId, id: studentId },
      data: {
        ...rest,
        ...(rest.dob && { dob: new Date(rest.dob) }),
        ...(rest.gender === undefined && { gender: undefined }),
      },
    });

    if (guardianIds) {
      await prisma.studentGuardian.deleteMany({
        where: { studentId },
      });

      if (guardianIds.length > 0) {
        await prisma.studentGuardian.createMany({
          data: guardianIds.map((gid) => ({
            studentId,
            guardianId: gid,
          })),
        });
      }
    }

    return this.getStudentById(tenantId, studentId);
  }

  static async deleteStudent(tenantId: string, studentId: string): Promise<void> {
    const student = await prisma.student.findFirst({
      where: { tenantId, id: studentId },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    await prisma.student.delete({
      where: { tenantId, id: studentId },
    });
  }

  static async getStudentsByClass(tenantId: string, classId: string) {
    return prisma.student.findMany({
      where: { tenantId, classId },
      include: { guardians: false },
      orderBy: { lastName: "asc" },
    });
  }
}

import { prisma } from "../../lib/prisma";

interface ClassRoomData {
  name: string;
  academicYear: string;
  teacherIds?: string[];
}

interface ClassRoomUpdateData {
  name?: string;
  academicYear?: string;
  teacherIds?: string[];
}

export class ClassRoomService {
  static async getClassRooms(tenantId: string) {
    return prisma.classRoom.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  static async getClassRoomById(tenantId: string, id: string) {
    const classRoom = await prisma.classRoom.findFirst({
      where: { tenantId, id },
      include: {
        students: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!classRoom) {
      throw new Error("Class not found");
    }

    return classRoom;
  }

  static async createClassRoom(tenantId: string, data: ClassRoomData) {
    return prisma.classRoom.create({
      data: {
        tenantId,
        name: data.name,
        academicYear: data.academicYear,
        teacherIds: data.teacherIds ?? [],
      },
    });
  }

  static async updateClassRoom(tenantId: string, id: string, data: ClassRoomUpdateData) {
    const classRoom = await prisma.classRoom.findFirst({
      where: { tenantId, id },
    });

    if (!classRoom) {
      throw new Error("Class not found");
    }

    return prisma.classRoom.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.academicYear && { academicYear: data.academicYear }),
        ...(data.teacherIds && { teacherIds: data.teacherIds }),
      },
    });
  }

  static async deleteClassRoom(tenantId: string, id: string): Promise<void> {
    const classRoom = await prisma.classRoom.findFirst({
      where: { tenantId, id },
    });

    if (!classRoom) {
      throw new Error("Class not found");
    }

    await prisma.classRoom.delete({
      where: { id },
    });
  }

  static async getClassStudents(tenantId: string, classId: string) {
    const classRoom = await prisma.classRoom.findFirst({
      where: { tenantId, id: classId },
    });

    if (!classRoom) {
      throw new Error("Class not found");
    }

    return prisma.student.findMany({
      where: { tenantId, classId },
      select: { id: true, firstName: true, lastName: true, classRoom: true },
    });
  }
}

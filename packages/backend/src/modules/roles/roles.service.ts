import { prisma } from "../../lib/prisma";

interface PermissionData {
  resource: string;
  action: string;
}

interface RoleData {
  name: string;
  permissions: PermissionData[];
}

interface RoleUpdateData {
  name?: string;
  permissions?: PermissionData[];
}

export class RoleService {
  static async getRoles(tenantId: string) {
    return prisma.role.findMany({
      where: { tenantId },
      include: { permissions: true },
      orderBy: { name: "asc" },
    });
  }

  static async createRole(tenantId: string, data: RoleData) {
    return prisma.role.create({
      data: {
        tenantId,
        name: data.name,
        isSystem: false,
        permissions: {
          create: data.permissions,
        },
      },
      include: { permissions: true },
    });
  }

  static async updateRole(tenantId: string, roleId: string, data: RoleUpdateData) {
    return await prisma.$transaction(async (tx) => {
      const updateData: { name?: string; permissions?: { create: PermissionData[] } } = {};
      if (data.name) updateData.name = data.name;

      if (data.permissions) {
        await tx.permission.deleteMany({ where: { roleId } });
        updateData.permissions = {
          create: data.permissions,
        };
      }

      return tx.role.update({
        where: { tenantId, id: roleId },
        data: updateData,
        include: { permissions: true },
      });
    });
  }

  static async deleteRole(tenantId: string, roleId: string): Promise<void> {
    const role = await prisma.role.findFirst({
      where: { tenantId, id: roleId },
    });

    if (!role) {
      throw new Error("Role not found");
    }

    if (role.isSystem) {
      throw new Error("Cannot delete system roles");
    }

    await prisma.role.delete({ where: { id: roleId } });
  }
}

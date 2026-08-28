import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../../config";
import { prisma } from "../../lib/prisma";

interface UserData {
  id: string;
  tenantId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  permissions: string[];
}

export class AuthService {
  static generateTokens(userId: string, tenantId: string, email: string, roleId: string) {
    const accessToken = jwt.sign(
      { id: userId, tenantId, email, roleId },
      config.jwtAccessSecret,
      { expiresIn: config.jwtAccessExpiresIn as jwt.SignOptions["expiresIn"] }
    );

    const refreshToken = jwt.sign(
      { id: userId, tenantId, email, roleId },
      config.jwtRefreshSecret,
      { expiresIn: config.jwtRefreshExpiresIn as jwt.SignOptions["expiresIn"] }
    );

    return { accessToken, refreshToken };
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async createSystemRoles(tenantId: string) {
    const roles: { name: string; permissions: { resource: string; action: string }[] }[] = [
      {
        name: "admin",
        permissions: [
          { resource: "students", action: "read" },
          { resource: "students", action: "write" },
          { resource: "attendance", action: "read" },
          { resource: "attendance", action: "write" },
          { resource: "observations", action: "read" },
          { resource: "observations", action: "write" },
          { resource: "curriculum", action: "read" },
          { resource: "curriculum", action: "write" },
          { resource: "finance", action: "read" },
          { resource: "finance", action: "write" },
          { resource: "hr", action: "read" },
          { resource: "hr", action: "write" },
          { resource: "inventory", action: "read" },
          { resource: "inventory", action: "write" },
          { resource: "messages", action: "read" },
          { resource: "messages", action: "write" },
          { resource: "announcements", action: "read" },
          { resource: "announcements", action: "write" },
          { resource: "audit", action: "read" },
          { resource: "users", action: "read" },
          { resource: "users", action: "write" },
          { resource: "settings", action: "read" },
          { resource: "settings", action: "write" },
        ],
      },
      {
        name: "teacher",
        permissions: [
          { resource: "students", action: "read" },
          { resource: "attendance", action: "read" },
          { resource: "attendance", action: "write" },
          { resource: "observations", action: "read" },
          { resource: "observations", action: "write" },
          { resource: "curriculum", action: "read" },
          { resource: "curriculum", action: "write" },
          { resource: "messages", action: "read" },
          { resource: "messages", action: "write" },
        ],
      },
      {
        name: "parent",
        permissions: [
          { resource: "students", action: "read" },
          { resource: "attendance", action: "read" },
          { resource: "observations", action: "read" },
          { resource: "messages", action: "read" },
          { resource: "messages", action: "write" },
          { resource: "announcements", action: "read" },
          { resource: "finance", action: "read" },
          { resource: "finance", action: "write" },
        ],
      },
      {
        name: "student",
        permissions: [
          { resource: "curriculum", action: "read" },
          { resource: "announcements", action: "read" },
        ],
      },
      {
        name: "finance_staff",
        permissions: [
          { resource: "finance", action: "read" },
          { resource: "finance", action: "write" },
          { resource: "students", action: "read" },
        ],
      },
      {
        name: "hr_staff",
        permissions: [
          { resource: "hr", action: "read" },
          { resource: "hr", action: "write" },
        ],
      },
    ];

    for (const roleData of roles) {
      const role = await prisma.role.upsert({
        where: { tenantId_name: { tenantId, name: roleData.name } },
        update: {},
        create: {
          tenantId,
          name: roleData.name,
          isSystem: true,
          permissions: {
            create: roleData.permissions.map((p) => ({
              resource: p.resource,
              action: p.action,
            })),
          },
        },
      });
      return role;
    }
  }

  static async registerTenant(data: {
    schoolName: string;
    subdomain: string;
    adminEmail: string;
    adminPassword: string;
    adminFirstName?: string;
    adminLastName?: string;
  }): Promise<{ tenant: { id: string; name: string; subdomain: string }; accessToken: string; refreshToken: string }> {
    return await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.schoolName,
          subdomain: data.subdomain,
        },
      });

      await this.createSystemRoles(tenant.id);

      const adminRoleRecord = await tx.role.findFirst({
        where: { tenantId: tenant.id, name: "admin" },
      });

      if (!adminRoleRecord) {
        throw new Error("Failed to create system roles");
      }

      const passwordHash = await this.hashPassword(data.adminPassword);

      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: data.adminEmail,
          passwordHash,
          firstName: data.adminFirstName || "Admin",
          lastName: data.adminLastName || "User",
          roleId: adminRoleRecord.id,
          status: "ACTIVE",
        },
      });

      const { accessToken, refreshToken } = this.generateTokens(
        adminUser.id,
        adminUser.tenantId,
        adminUser.email,
        adminUser.roleId
      );

      await tx.user.update({
        where: { id: adminUser.id },
        data: { refreshToken },
      });

      return {
        tenant,
        accessToken,
        refreshToken,
      };
    });
  }

  static async login(data: {
    email: string;
    password: string;
  }): Promise<{ accessToken: string; refreshToken: string; user: UserData }> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { role: { include: { permissions: true } } },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const valid = await this.verifyPassword(data.password, user.passwordHash);

    if (!valid) {
      throw new Error("Invalid credentials");
    }

    if (user.status !== "ACTIVE") {
      throw new Error("Account is not active");
    }

    const { accessToken, refreshToken } = this.generateTokens(
      user.id,
      user.tenantId,
      user.email,
      user.roleId
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, lastLoginAt: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        permissions: user.role.permissions.map((p) => `${p.resource}:${p.action}`),
      },
    };
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as {
        id: string;
        tenantId: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id, tenantId: decoded.tenantId },
        include: { role: { include: { permissions: true } } },
      });

      if (!user || !user.refreshToken || user.refreshToken !== refreshToken) {
        throw new Error("Invalid refresh token");
      }

      const { accessToken } = this.generateTokens(
        user.id,
        user.tenantId,
        user.email,
        user.roleId
      );

      return { accessToken };
    } catch {
      throw new Error("Token refresh failed");
    }
  }

  static async logout(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }
}

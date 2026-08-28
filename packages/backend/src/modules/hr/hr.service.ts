import { LeaveStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import { sendStaffWelcomeEmail } from "../../services/email";

interface StaffData {
  firstName: string;
  lastName: string;
  position: string;
  salary?: number;
  phone?: string;
  email?: string;
  hireDate: string;
  leaveBalance?: number;
}

interface StaffUpdateData {
  firstName?: string;
  lastName?: string;
  position?: string;
  salary?: number;
  phone?: string;
  email?: string;
  hireDate?: string;
  leaveBalance?: number;
}

interface LeaveRequestData {
  staffId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

interface LeaveRequestFilter {
  staffId?: string;
  status?: LeaveStatus;
  page?: number;
  limit?: number;
}

export class HRService {
  static async getStaff(tenantId: string, filter: { page?: number; limit?: number } = {}) {
    const { page, limit } = filter;
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where: { tenantId },
        skip,
        take,
        orderBy: { lastName: "asc" },
        include: { leaveRequests: true },
      }),
      prisma.staff.count({ where: { tenantId } }),
    ]);

    if (page && limit) {
      return {
        data: staff,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    }

    return { data: staff };
  }

  static async getStaffById(tenantId: string, id: string) {
    const staff = await prisma.staff.findFirst({
      where: { tenantId, id },
      include: { leaveRequests: true },
    });

    if (!staff) {
      throw new Error("Staff not found");
    }

    return staff;
  }

  static async createStaff(tenantId: string, data: StaffData) {
    return prisma.staff.create({
      data: {
        tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        position: data.position,
        salary: data.salary,
        phone: data.phone,
        email: data.email,
        hireDate: new Date(data.hireDate),
        leaveBalance: data.leaveBalance ?? 0,
      },
    });
  }

  static async updateStaff(tenantId: string, id: string, data: StaffUpdateData) {
    const staff = await prisma.staff.findFirst({
      where: { tenantId, id },
    });

    if (!staff) {
      throw new Error("Staff not found");
    }

    return prisma.staff.update({
      where: { id },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.position && { position: data.position }),
        ...(data.salary !== undefined && { salary: data.salary }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.hireDate && { hireDate: new Date(data.hireDate) }),
        ...(data.leaveBalance !== undefined && { leaveBalance: data.leaveBalance }),
      },
    });
  }

  static async deleteStaff(tenantId: string, id: string): Promise<void> {
    const staff = await prisma.staff.findFirst({
      where: { tenantId, id },
    });

    if (!staff) {
      throw new Error("Staff not found");
    }

    await prisma.staff.delete({ where: { id } });
  }

  static async getLeaveRequests(tenantId: string, filter: LeaveRequestFilter = {}) {
    const { staffId, status, page, limit } = filter;
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const where: { tenantId: string; staffId?: string; status?: LeaveStatus } = { tenantId };
    if (staffId) where.staffId = staffId;
    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { staff: { select: { id: true, firstName: true, lastName: true, position: true } } },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    if (page && limit) {
      return {
        data: requests,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    }

    return { data: requests };
  }

  static async createLeaveRequest(tenantId: string, data: LeaveRequestData) {
    return prisma.leaveRequest.create({
      data: {
        tenantId,
        staffId: data.staffId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
      },
      include: { staff: { select: { id: true, firstName: true, lastName: true, position: true } } },
    });
  }

  static async approveLeaveRequest(tenantId: string, id: string, approved: boolean) {
    const request = await prisma.leaveRequest.findFirst({
      where: { tenantId, id },
    });

    if (!request) {
      throw new Error("Leave request not found");
    }

    return prisma.leaveRequest.update({
      where: { id },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
      },
      include: { staff: { select: { id: true, firstName: true, lastName: true, position: true } } },
    });
  }

  static async deleteLeaveRequest(tenantId: string, id: string): Promise<void> {
    const request = await prisma.leaveRequest.findFirst({
      where: { tenantId, id },
    });

    if (!request) {
      throw new Error("Leave request not found");
    }

    await prisma.leaveRequest.delete({ where: { id } });
  }

  /**
   * Create a login account for a staff member.
   * Generates a temporary password, creates a User with the given role,
   * and links it to the Staff record.
   */
  static async createStaffAccount(
    tenantId: string,
    staffId: string,
    role: string = "teacher",
    emailOverride?: string,
  ) {
    const staff = await prisma.staff.findFirst({
      where: { tenantId, id: staffId },
    });

    if (!staff) {
      throw new Error("Staff not found");
    }

    if (staff.userId) {
      throw new Error("This staff member already has a login account");
    }

    // Use provided email override, or fall back to staff email
    const email = emailOverride || staff.email;
    if (!email) {
      throw new Error("Staff must have an email address to create a login. Please provide one.");
    }

    // Check if email is already used by another user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      // If the existing user is already linked to this staff, just return success
      if (existingUser.id === staff.userId) {
        return { userId: existingUser.id, email: existingUser.email, tempPassword: "(account already exists)", role };
      }
      throw new Error(`The email ${email} is already registered to another user. Please use a different email.`);
    }

    // Find the role
    const roleRecord = await prisma.role.findFirst({
      where: { tenantId, name: role },
    });

    if (!roleRecord) {
      throw new Error(`Role "${role}" not found. Please create it first.`);
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString("base64url").slice(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Create user account
    const user = await prisma.user.create({
      data: {
        tenantId,
        email,
        passwordHash,
        firstName: staff.firstName,
        lastName: staff.lastName,
        roleId: roleRecord.id,
        status: "ACTIVE",
      },
    });

    // Link to staff record and update email if overridden
    await prisma.staff.update({
      where: { id: staffId },
      data: { userId: user.id, ...(emailOverride ? { email } : {}) },
    });

    // Send welcome email (non-blocking)
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });
    sendStaffWelcomeEmail({
      email: user.email,
      name: `${staff.firstName} ${staff.lastName}`,
      tempPassword,
      role,
      schoolName: tenant?.name || "School",
    }).catch((err) => console.error("Welcome email failed:", err));

    return {
      userId: user.id,
      email: user.email,
      tempPassword,
      role,
    };
  }

  /** Get all roles in the tenant (for the role dropdown) */
  static async getRoles(tenantId: string) {
    return prisma.role.findMany({
      where: { tenantId },
      select: { id: true, name: true, isSystem: true },
      orderBy: [{ name: "asc" }],
    });
  }

  /** Update permissions for a role */
  static async updateRolePermissions(
    tenantId: string,
    roleId: string,
    permissions: { resource: string; action: string }[],
  ) {
    const role = await prisma.role.findFirst({ where: { id: roleId, tenantId } });
    if (!role) {
      throw new Error("Role not found");
    }

    // Delete existing permissions
    await prisma.permission.deleteMany({ where: { roleId } });

    // Create new permissions
    if (permissions.length > 0) {
      await prisma.permission.createMany({
        data: permissions.map((p) => ({ roleId, resource: p.resource, action: p.action })),
      });
    }

    return prisma.role.findFirst({
      where: { id: roleId },
      include: { permissions: true },
    });
  }

  /** Get permissions for a role */
  static async getRolePermissions(tenantId: string, roleId: string) {
    const role = await prisma.role.findFirst({ where: { id: roleId, tenantId } });
    if (!role) {
      throw new Error("Role not found");
    }
    return prisma.permission.findMany({ where: { roleId } });
  }
}

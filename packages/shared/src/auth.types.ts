export interface Role {
  id: string;
  tenantId: string;
  name: string;
  isSystem: boolean;
}

export interface Permission {
  id: string;
  roleId: string;
  resource: string;
  action: string;
}

export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

export interface UserWithPermissions {
  id: string;
  tenantId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: {
    name: string;
    permissions: Permission[];
  };
}

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  SCHOOL_ADMIN: "admin",
  TEACHER: "teacher",
  PARENT: "parent",
  STUDENT: "student",
  FINANCE_STAFF: "finance_staff",
  HR_STAFF: "hr_staff",
} as const;

export const PERMISSIONS = {
  STUDENTS_READ: "students:read",
  STUDENTS_WRITE: "students:write",
  ATTENDANCE_READ: "attendance:read",
  ATTENDANCE_WRITE: "attendance:write",
  OBSERVATIONS_READ: "observations:read",
  OBSERVATIONS_WRITE: "observations:write",
  CURRICULUM_READ: "curriculum:read",
  CURRICULUM_WRITE: "curriculum:write",
  FINANCE_READ: "finance:read",
  FINANCE_WRITE: "finance:write",
  HR_READ: "hr:read",
  HR_WRITE: "hr:write",
  INVENTORY_READ: "inventory:read",
  INVENTORY_WRITE: "inventory:write",
  MESSAGES_READ: "messages:read",
  MESSAGES_WRITE: "messages:write",
  ANNOUNCEMENTS_READ: "announcements:read",
  ANNOUNCEMENTS_WRITE: "announcements:write",
  AUDIT_READ: "audit:read",
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",
} as const;

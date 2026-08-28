import { prisma } from "../../lib/prisma";

interface SchoolSettingsData {
  // School Profile
  schoolName?: string;
  schoolMotto?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  schoolAddress?: string;
  schoolWebsite?: string;
  schoolLogo?: string;
  schoolType?: string;
  registrationNumber?: string;

  // Academic Configuration
  academicYear?: string;
  currentTerm?: string;
  termStartDate?: string;
  termEndDate?: string;
  terms?: string[];
  schoolStartTime?: string;
  schoolEndTime?: string;
  timezone?: string;

  // Branding
  primaryColor?: string;
  accentColor?: string;
  schoolTagline?: string;

  // Billing & Payments
  currency?: string;
  currencySymbol?: string;
  paymentMethods?: string[];
  invoicePrefix?: string;
  lateFeePercentage?: number;
  gracePeriodDays?: number;
  bankName?: string;
  bankAccount?: string;
  bankSortCode?: string;
  paystackEnabled?: boolean;

  // Notifications
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  announcementNotifications?: boolean;
  attendanceNotifications?: boolean;
  gradeNotifications?: boolean;
  paymentNotifications?: boolean;
  parentCommunicationEnabled?: boolean;

  // Security
  requirePasswordChange?: boolean;
  sessionTimeout?: number;
  twoFactorEnabled?: boolean;

  // System
  language?: string;
  dateFormat?: string;
  academicWeeksPerTerm?: number;
  maxStudentsPerClass?: number;
}

export class SettingsService {
  static async getSettings(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true, name: true, subdomain: true, plan: true, createdAt: true },
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    const settings = (tenant.settings as Record<string, unknown>) || {};

    return {
      data: {
        schoolName: tenant.name,
        subdomain: tenant.subdomain,
        plan: tenant.plan,
        createdAt: tenant.createdAt,
        ...settings,
      },
    };
  }

  static async updateSettings(tenantId: string, data: SchoolSettingsData) {
    const existing = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true, name: true },
    });

    if (!existing) {
      throw new Error("Tenant not found");
    }

    const currentSettings = (existing.settings as Record<string, unknown>) || {};
    const newSettings: Record<string, unknown> = { ...currentSettings };

    // Store all fields dynamically
    const allKeys: (keyof SchoolSettingsData)[] = [
      "schoolMotto", "schoolPhone", "schoolEmail", "schoolAddress",
      "schoolWebsite", "schoolLogo", "schoolType", "registrationNumber",
      "academicYear", "currentTerm", "termStartDate", "termEndDate",
      "terms", "schoolStartTime", "schoolEndTime", "timezone",
      "primaryColor", "accentColor", "schoolTagline",
      "currency", "currencySymbol", "paymentMethods", "invoicePrefix",
      "lateFeePercentage", "gracePeriodDays", "bankName", "bankAccount",
      "bankSortCode", "paystackEnabled",
      "emailNotifications", "smsNotifications", "announcementNotifications",
      "attendanceNotifications", "gradeNotifications", "paymentNotifications",
      "parentCommunicationEnabled",
      "requirePasswordChange", "sessionTimeout", "twoFactorEnabled",
      "language", "dateFormat", "academicWeeksPerTerm", "maxStudentsPerClass",
    ];

    for (const key of allKeys) {
      if (data[key] !== undefined) {
        newSettings[key] = data[key];
      }
    }

    // Update tenant name if school name changed
    const updateData: { settings: Record<string, unknown>; name?: string } = {
      settings: newSettings,
    };
    if (data.schoolName && data.schoolName !== existing.name) {
      updateData.name = data.schoolName;
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
      select: { settings: true, name: true, subdomain: true, plan: true, createdAt: true },
    });

    const settings = (updated.settings as Record<string, unknown>) || {};

    return {
      data: {
        schoolName: updated.name,
        subdomain: updated.subdomain,
        plan: updated.plan,
        createdAt: updated.createdAt,
        ...settings,
      },
    };
  }
}

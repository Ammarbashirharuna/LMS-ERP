export interface Guardian {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  phone?: string;
  email?: string;
}

export interface Student {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" | null;
  classId?: string | null;
  enrollmentDate: string;
  createdAt: string;
  updatedAt: string;
  classRoom?: {
    id: string;
    name: string;
  };
  guardians?: Array<{
    id: string;
    guardian: Guardian;
  }>;
  attendance?: AttendanceSummary[];
}

export interface AttendanceSummary {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  reasonCode?: string | null;
}

export interface StudentFormData {
  firstName: string;
  lastName: string;
  dob: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  classId?: string | null;
}

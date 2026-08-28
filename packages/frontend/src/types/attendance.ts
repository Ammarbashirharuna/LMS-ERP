export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  reasonCode?: string | null;
  syncStatus: "SYNCED" | "PENDING" | "CONFLICT";
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AttendanceQuery {
  classId?: string;
  studentId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}

export interface AttendanceFormData {
  studentId: string;
  date: string;
  status: AttendanceStatus;
  reasonCode?: string;
}

export interface BulkAttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  reasonCode?: string;
}

export interface BulkAttendanceFormData {
  classId?: string;
  date: string;
  records: BulkAttendanceRecord[];
}

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: "bg-success/10 text-success",
  ABSENT: "bg-danger/10 text-danger",
  LATE: "bg-warning/10 text-warning",
  EXCUSED: "bg-info/10 text-info",
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  EXCUSED: "Excused",
};

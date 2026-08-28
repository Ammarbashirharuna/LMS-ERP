import Dexie, { Table } from "dexie";

export interface SyncQueueItem {
  id?: string;
  tableName: "attendance" | "observations";
  action: "create" | "update" | "delete";
  data: Record<string, unknown>;
  timestamp: number;
  attempted?: number;
  lastError?: string;
}

export interface PendingAttendance {
  id?: string;
  studentId: string;
  date: string;
  status: string;
  reasonCode?: string | null;
  syncStatus: "PENDING" | "SYNCED" | "CONFLICT";
  recordedOfflineAt: string;
  updatedAt: string;
}

export interface PendingObservation {
  id?: string;
  studentId: string;
  teacherId: string;
  note: string;
  masteryLevel: string;
  curriculumItemId?: string | null;
  lessonPlanId?: string | null;
  syncStatus: "PENDING" | "SYNCED" | "CONFLICT";
  recordedOfflineAt: string;
  updatedAt: string;
}

export class OfflineDB extends Dexie {
  attendance!: Table<PendingAttendance, string>;
  observations!: Table<PendingObservation, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super("MontessoriOfflineDB");
    this.version(1).stores({
      attendance: "++id, studentId, date, syncStatus, recordedOfflineAt",
      observations: "++id, studentId, teacherId, syncStatus, recordedOfflineAt",
      syncQueue: "++id, tableName, action, timestamp, attempted",
    });
  }
}

export const db = new OfflineDB();

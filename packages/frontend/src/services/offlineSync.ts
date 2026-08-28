import { db, SyncQueueItem } from "../db";
import { apiClient } from "../api/client";
import { attendanceApi } from "../api/attendance";
import type { AttendanceStatus } from "../types/attendance";

class OnlineStatus {
  private listeners: (() => void)[] = [];
  private online = navigator.onLine;

  constructor() {
    window.addEventListener("online", () => {
      this.online = true;
      this.listeners.forEach((fn) => fn());
    });
    window.addEventListener("offline", () => {
      this.online = false;
    });
  }

  isOnline(): boolean {
    return this.online;
  }

  subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((f) => f !== fn);
    };
  }
}

export const onlineStatus = new OnlineStatus();

export class OfflineSyncService {
  private isRunning = false;

  async syncPending(): Promise<{ synced: number; failed: number }> {
    if (!onlineStatus.isOnline()) {
      return { synced: 0, failed: 0 };
    }

    if (this.isRunning) {
      return { synced: 0, failed: 0 };
    }

    this.isRunning = true;
    let synced = 0;
    let failed = 0;

    try {
      const pending = await db.syncQueue.where("attempted").equals(0).sortBy("timestamp");

      for (const item of pending) {
        try {
          await this.processItem(item);
          await db.syncQueue.delete(item.id!);
          synced++;
        } catch (error) {
          failed++;
          await db.syncQueue.update(item.id!, {
            attempted: (item.attempted ?? 0) + 1,
            lastError: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      await this.syncAttendance();
      await this.syncObservations();
    } finally {
      this.isRunning = false;
    }

    return { synced, failed };
  }

  private async processItem(item: SyncQueueItem): Promise<void> {
    switch (item.tableName) {
      case "attendance":
        if (item.action === "create") {
          await attendanceApi.record(item.data as {
            studentId: string;
            date: string;
            status: AttendanceStatus;
            reasonCode?: string;
          });
        }
        break;
      case "observations":
        if (item.action === "create") {
          await apiClient.post("/observations", item.data);
        }
        break;
    }
  }

  private async syncAttendance(): Promise<void> {
    const pending = await db.attendance
      .where("syncStatus")
      .equals("PENDING")
      .toArray();

    for (const record of pending) {
      try {
        await attendanceApi.record({
          studentId: record.studentId,
          date: record.date,
          status: record.status as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
          reasonCode: record.reasonCode ?? undefined,
        });
        await db.attendance.update(record.id!, { syncStatus: "SYNCED" });
      } catch {
        // Will retry later
      }
    }
  }

  private async syncObservations(): Promise<void> {
    const pending = await db.observations
      .where("syncStatus")
      .equals("PENDING")
      .toArray();

    for (const record of pending) {
      try {
        await apiClient.post("/observations", {
          studentId: record.studentId,
          note: record.note,
          masteryLevel: record.masteryLevel,
          curriculumItemId: record.curriculumItemId,
          lessonPlanId: record.lessonPlanId,
        });
        await db.observations.update(record.id!, { syncStatus: "SYNCED" });
      } catch {
        // Will retry later
      }
    }
  }

  startPeriodicSync(intervalMs: number = 30000): () => void {
    const handler = () => {
      if (onlineStatus.isOnline()) {
        void this.syncPending();
      }
    };

    window.addEventListener("online", handler);

    const interval = setInterval(handler, intervalMs);

    return () => {
      window.removeEventListener("online", handler);
      clearInterval(interval);
    };
  }
}

export const offlineSync = new OfflineSyncService();

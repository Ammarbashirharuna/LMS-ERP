import { db } from "../db";
import { onlineStatus } from "../services/offlineSync";
import type { PendingAttendance, PendingObservation } from "../db";
import type { AttendanceStatus } from "../types/attendance";

export function useOfflineAttendance() {
  const recordOffline = async (data: {
    studentId: string;
    date: string;
    status: AttendanceStatus;
    reasonCode?: string;
  }): Promise<void> => {
    if (onlineStatus.isOnline()) {
      try {
        const res = await fetch("/api/v1/attendance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
          },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          await db.attendance.add({
            studentId: data.studentId,
            date: data.date,
            status: data.status,
            reasonCode: data.reasonCode ?? null,
            syncStatus: "SYNCED",
            recordedOfflineAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          return;
        }

        throw new Error("Network response was not ok");
      } catch {
        // Fall through to offline storage
      }
    }

    const offlineRecord: PendingAttendance = {
      studentId: data.studentId,
      date: data.date,
      status: data.status,
      reasonCode: data.reasonCode ?? null,
      syncStatus: "PENDING",
      recordedOfflineAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.attendance.add(offlineRecord);

    await db.syncQueue.add({
      tableName: "attendance",
      action: "create",
      data,
      timestamp: Date.now(),
      attempted: 0,
    });
  };

  const getLocalAttendance = async (date: string): Promise<PendingAttendance[]> => {
    return db.attendance
      .where("date")
      .equals(date)
      .and((r) => r.syncStatus === "PENDING" || r.syncStatus === "SYNCED")
      .toArray();
  };

  return { recordOffline, getLocalAttendance };
}

export function useOfflineObservation() {
  const recordOffline = async (data: {
    studentId: string;
    teacherId: string;
    note: string;
    masteryLevel: string;
    curriculumItemId?: string;
    lessonPlanId?: string;
  }): Promise<void> => {
    if (onlineStatus.isOnline()) {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const res = await fetch("/api/v1/observations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: accessToken ? `Bearer ${accessToken}` : "",
          },
          body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error("Sync failed");

        await db.observations.add({
          studentId: data.studentId,
          teacherId: data.teacherId,
          note: data.note,
          masteryLevel: data.masteryLevel,
          curriculumItemId: data.curriculumItemId ?? null,
          lessonPlanId: data.lessonPlanId ?? null,
          syncStatus: "SYNCED",
          recordedOfflineAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return;
      } catch {
        // Fall through to offline storage
      }
    }

    const offlineRecord: PendingObservation = {
      studentId: data.studentId,
      teacherId: data.teacherId,
      note: data.note,
      masteryLevel: data.masteryLevel,
      curriculumItemId: data.curriculumItemId ?? null,
      lessonPlanId: data.lessonPlanId ?? null,
      syncStatus: "PENDING",
      recordedOfflineAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.observations.add(offlineRecord);

    await db.syncQueue.add({
      tableName: "observations",
      action: "create",
      data,
      timestamp: Date.now(),
      attempted: 0,
    });
  };

  const getLocalObservations = async (studentId?: string): Promise<PendingObservation[]> => {
    if (studentId) {
      return db.observations.where("studentId").equals(studentId).toArray();
    }
    return db.observations.orderBy("recordedOfflineAt").reverse().toArray();
  };

  return { recordOffline, getLocalObservations };
}

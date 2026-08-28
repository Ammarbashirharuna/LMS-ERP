import { useState } from "react";
import { useAttendance } from "../../hooks/useAttendance";
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS } from "../../types/attendance";
import type { AttendanceRecord } from "../../types/attendance";

export function AttendanceHistoryPage() {
  const [dateFilter, setDateFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filters = dateFilter
    ? { date: dateFilter }
    : startDate && endDate
      ? { startDate, endDate }
      : undefined;

  const { data, isLoading } = useAttendance(filters);
  const records: AttendanceRecord[] = data?.data ?? [];

  const statusCounts = records.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 page-enter">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-muted rounded w-1/4"></div>
          <div className="h-64 bg-surface-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 page-enter">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Attendance History</h1>
      </div>

      <div className="surface p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Specific Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value) {
                  setStartDate("");
                  setEndDate("");
                }
              }}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value) {
                  setDateFilter("");
                }
              }}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              disabled={!!dateFilter}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (e.target.value) {
                  setDateFilter("");
                }
              }}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              disabled={!!dateFilter}
            />
          </div>
        </div>
      </div>

      {records.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="surface p-4 text-center">
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${ATTENDANCE_STATUS_COLORS[status as keyof typeof ATTENDANCE_STATUS_COLORS]}`}>
                {ATTENDANCE_STATUS_LABELS[status as keyof typeof ATTENDANCE_STATUS_LABELS]}
              </span>
              <p className="text-2xl font-bold text-text-primary mt-1">{count}</p>
            </div>
          ))}
        </div>
      )}

      <div className="surface rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-muted border-b border-border">
              <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">Student</th>
              <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">Date</th>
              <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">Status</th>
              <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">Reason</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                  No attendance records found for the selected period.
                </td>
              </tr>
            ) : (
              records.map((record: AttendanceRecord) => (
                <tr key={record.id} className="border-b border-border hover:bg-surface-muted/50">
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {record.student?.firstName} {record.student?.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${ATTENDANCE_STATUS_COLORS[record.status]}`}>
                      {ATTENDANCE_STATUS_LABELS[record.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {record.reasonCode || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

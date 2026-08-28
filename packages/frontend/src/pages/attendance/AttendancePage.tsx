import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { attendanceApi } from "../../api/attendance";
import { useAttendance } from "../../hooks/useAttendance";
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS } from "../../types/attendance";
import type { AttendanceStatus } from "../../types/attendance";

interface StudentInClass {
  id: string;
  firstName: string;
  lastName: string;
}

const STATUS_CYCLE: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

export function AttendancePage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedClass, setSelectedClass] = useState("");
  const [classes, setClasses] = useState<StudentInClass["id"][]>([]);
  const [classNames, setClassNames] = useState<Record<string, string>>({});
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [classStudents, setClassStudents] = useState<StudentInClass[]>([]);
  const { refetch } = useAttendance({ date: selectedDate, classId: selectedClass });

  async function loadClasses() {
    try {
      const res = await axios.get("/api/v1/classes");
      const classList: Array<{ id: string; name: string }> = res.data.data || res.data;
      setClasses(classList.map((c) => c.id));
      setClassNames(Object.fromEntries(classList.map((c) => [c.id, c.name])));
    } catch {
      setClasses([]);
      setClassNames({});
    }
  }

  useEffect(() => {
    (async () => {
      await loadClasses();
      if (selectedDate) {
        void refetch();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  async function loadStudentsForClass(classId: string): Promise<StudentInClass[]> {
    const res = await axios.get(`/api/v1/students?classId=${classId}`);
    const students: StudentInClass[] = res.data.data || res.data;
    return students;
  }

  const handleClassChange = async (classId: string) => {
    setSelectedClass(classId);
    const students = await loadStudentsForClass(classId);
    setClassStudents(students);
    const initial: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      initial[s.id] = "PRESENT";
    });
    setAttendanceMap(initial);
  };

  const cycleStatus = (studentId: string) => {
    const current = attendanceMap[studentId] || "PRESENT";
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
    setAttendanceMap((prev) => ({ ...prev, [studentId]: next }));
  };

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const getStudentsForCurrentClass = async () => {
    if (!selectedClass) return [];
    return loadStudentsForClass(selectedClass);
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedDate) return;

    const students = await getStudentsForCurrentClass();
    const records = students.map((s) => ({
      studentId: s.id,
      status: attendanceMap[s.id] || "PRESENT",
    }));

    try {
      await attendanceApi.bulkRecord({
        classId: selectedClass,
        date: selectedDate,
        records,
      });
      // Show success toast
      const toast = document.createElement("div");
      toast.className = "fixed top-4 right-4 z-50 bg-success text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]";
      toast.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg> Attendance saved successfully!`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (err: unknown) {
      const toast = document.createElement("div");
      toast.className = "fixed top-4 right-4 z-50 bg-danger text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]";
      toast.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><line x1='15' y1='9' x2='9' y2='15'/><line x1='9' y1='9' x2='15' y2='15'/></svg> ${err instanceof Error ? err.message : "Failed to save attendance"}`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Take Attendance</h1>
        <button
          onClick={() => navigate("/attendance/history")}
          className="text-sm text-primary hover:text-primary-hover"
        >
          View History
        </button>
      </div>

      <div className="surface p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a class</option>
              {classes.map((classId) => (
                <option key={classId} value={classId}>
                  {classNames[classId] || classId}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSave}
              disabled={!selectedClass}
              className="btn-primary w-full"
            >
              Save Attendance
            </button>
          </div>
        </div>
      </div>

      {selectedClass && (
        <div className="surface rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-muted border-b border-border">
                <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">Student</th>
                <th className="text-center px-4 py-2 text-sm font-medium text-text-muted">Status</th>
                <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">Details</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(attendanceMap).map(([studentId, status]) => {
                const student = classStudents.find((s) => s.id === studentId);
                if (!student) return null;
                return (
                  <tr key={studentId} className="border-b border-border">
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => cycleStatus(studentId)}
                        className="px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer"
                      >
                        <span className={ATTENDANCE_STATUS_COLORS[status]}>
                          {ATTENDANCE_STATUS_LABELS[status]}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {STATUS_CYCLE.map((s) => (
                          <button
                            key={s}
                            onClick={() => setStatus(studentId, s)}
                            className={`text-xs px-2 py-1 rounded ${
                              status === s
                                ? "bg-primary text-white"
                                : "bg-surface-muted text-text-muted hover:bg-surface"
                            }`}
                          >
                            {ATTENDANCE_STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!selectedClass && (
        <div className="surface p-8 text-center text-text-muted">
          Select a class to start taking attendance.
        </div>
      )}
    </div>
  );
}


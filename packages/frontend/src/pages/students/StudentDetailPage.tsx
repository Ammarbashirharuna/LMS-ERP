import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStudent } from "../../hooks/useStudents";
import { useStudentAttendance } from "../../hooks/useAttendance";
import { useDeleteStudent } from "../../hooks/useStudents";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS } from "../../types/attendance";
import type { AttendanceRecord } from "../../types/attendance";

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading } = useStudent(id!);
  const { data: attendance } = useStudentAttendance(id!);
  const deleteStudent = useDeleteStudent();
  const [showDelete, setShowDelete] = useState(false);

  if (isLoading || !student) {
    return <div className="p-4 sm:p-6 lg:p-8 page-enter">Loading...</div>;
  }

  const handleEdit = () => {
    navigate(`/students/${id}/edit`);
  };

  const handleDelete = async () => {
    await deleteStudent.mutateAsync(id!);
    navigate("/students");
  };

  const recentAttendance = (attendance ?? []) as AttendanceRecord[];

  return (
    <div className="p-4 sm:p-6 lg:p-8 page-enter">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            {student.firstName} {student.lastName}
          </h1>
          {student.classRoom && (
            <p className="text-text-muted mt-1">
              {student.classRoom.name}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/students/${id}/progress`)}
            className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20"
          >
            View Progress
          </button>
          <button
            onClick={handleEdit}
            className="px-4 py-2 text-sm font-medium text-text-primary bg-surface-muted rounded-lg hover:bg-surface"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm font-medium text-danger bg-danger/10 rounded-lg hover:bg-danger/20"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="surface p-4">
          <p className="text-sm font-medium text-text-muted">Date of Birth</p>
          <p className="text-lg font-semibold text-text-primary mt-1">
            {student.dob ? new Date(student.dob).toLocaleDateString() : "—"}
          </p>
        </div>
        <div className="surface p-4">
          <p className="text-sm font-medium text-text-muted">Gender</p>
          <p className="text-lg font-semibold text-text-primary mt-1 capitalize">
            {student.gender?.replace(/_/g, " ").toLowerCase() || "Not specified"}
          </p>
        </div>
        <div className="surface p-4">
          <p className="text-sm font-medium text-text-muted">Enrollment Date</p>
          <p className="text-lg font-semibold text-text-primary mt-1">
            {new Date(student.enrollmentDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {student.guardians && student.guardians.length > 0 && (
        <div className="surface p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Guardians</h2>
          <div className="space-y-3">
            {student.guardians.map((g) => (
              <div key={g.id} className="border-b border-border pb-2 last:border-0">
                <p className="font-medium text-text-primary">
                  {g.guardian.firstName} {g.guardian.lastName}
                </p>
                <p className="text-sm text-text-muted">
                  {g.guardian.relationship}
                  {g.guardian.phone && ` · ${g.guardian.phone}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="surface p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Attendance</h2>
        {recentAttendance.length === 0 ? (
          <p className="text-text-muted">No attendance records found.</p>
        ) : (
          <div>
            <div className="grid grid-cols-4 gap-4 mb-3 text-sm font-medium text-text-muted">
              <span>Date</span>
              <span>Status</span>
              <span>Reason</span>
              <span></span>
            </div>
            <div className="space-y-2">
              {recentAttendance.slice(0, 10).map((a: AttendanceRecord) => (
                <div key={a.id} className="grid grid-cols-4 gap-4 items-center py-2 border-b border-border last:border-0">
                  <span className="text-sm text-text-primary">
                    {new Date(a.date).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${ATTENDANCE_STATUS_COLORS[a.status]}`}>
                    {ATTENDANCE_STATUS_LABELS[a.status]}
                  </span>
                  <span className="text-sm text-text-muted">{a.reasonCode || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={showDelete}
        title="Delete Student"
        message={`Are you sure you want to delete ${student.firstName} ${student.lastName}? This will remove all their records and cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteStudent.isPending}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}

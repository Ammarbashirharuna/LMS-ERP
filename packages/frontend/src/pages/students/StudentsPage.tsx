import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStudents, useDeleteStudent } from "../../hooks/useStudents";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import type { Student } from "../../types/student";

export function StudentsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, refetch } = useStudents({ search: searchTerm, page: currentPage, limit: 20 });
  const deleteStudent = useDeleteStudent();

  const students: Student[] = data?.data ?? [];
  const pagination = data?.pagination;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteStudent.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
    refetch();
  };

  const handleAddNew = () => {
    navigate("/students/add");
  };

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
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Students</h1>
          <p className="text-text-muted mt-1">{pagination?.total ?? students.length} students</p>
        </div>
        <button
          onClick={handleAddNew}
          className="btn-primary flex items-center gap-2"
        >
          Add Student
        </button>
      </div>

      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search students by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-primary"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            Search
          </span>
        </div>
      </form>

      <div className="surface rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-muted border-b border-border">
              <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">Student</th>
              <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">Class</th>
              <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">Guardian</th>
              <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">DOB</th>
              <th className="text-right px-4 py-2 text-sm font-medium text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                  No students found. Click &quot;Add Student&quot; to get started.
                </td>
              </tr>
            ) : (
              students.map((student: Student) => (
                <tr key={student.id} className="border-b border-border hover:bg-surface-muted/50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/students/${student.id}`}
                      className="font-medium text-text-primary hover:text-primary"
                    >
                      {student.firstName} {student.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {student.classRoom?.name || "Unassigned"}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {student.guardians && student.guardians.length > 0
                      ? `${student.guardians[0].guardian.firstName} ${student.guardians[0].guardian.lastName}`
                      : "No guardian"}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {student.dob ? new Date(student.dob).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => navigate(`/students/${student.id}/edit`)}
                      className="text-xs px-2 py-1 text-text-muted hover:text-text-primary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(student)}
                      className="text-xs px-2 py-1 text-danger hover:text-danger-hover"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-between items-center mt-4 text-sm text-text-muted">
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-surface-muted disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-surface-muted disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Remove Student"
        message={`Are you sure you want to remove ${deleteTarget?.firstName} ${deleteTarget?.lastName}? This cannot be undone.`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteStudent.isPending}
      />
    </div>
  );
}

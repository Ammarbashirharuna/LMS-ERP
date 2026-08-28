import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStudent, useUpdateStudent } from "../../hooks/useStudents";
import type { StudentFormData, Student } from "../../types/student";

export function EditStudentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading } = useStudent(id!);
  const updateStudent = useUpdateStudent();
  const [error, setError] = useState("");

  if (isLoading || !student) {
    return <div className="p-4 sm:p-6 lg:p-8 page-enter">Loading...</div>;
  }

  return (
    <EditStudentForm
      student={student}
      error={error}
      isSaving={updateStudent.isPending}
      onSave={async (data) => {
        try {
          await updateStudent.mutateAsync({ id: id!, data });
          navigate(`/students/${id}`);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Failed to update student");
        }
      }}
      onCancel={() => navigate(`/students/${id}`)}
    />
  );
}

function EditStudentForm({
  student,
  error,
  isSaving,
  onSave,
  onCancel,
}: {
  student: Student;
  error: string;
  isSaving: boolean;
  onSave: (data: StudentFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<StudentFormData>(() => ({
    firstName: student.firstName,
    lastName: student.lastName,
    dob: student.dob ? new Date(student.dob).toISOString().split("T")[0] : "",
    gender: student.gender ?? undefined,
    classId: student.classId ?? undefined,
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 page-enter">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Edit Student</h1>
        <p className="text-text-muted mt-1">
          {student.firstName} {student.lastName}
        </p>
      </div>

      {error && <p className="text-danger mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="surface p-6 max-w-2xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Gender
          </label>
          <select
            name="gender"
            value={formData.gender || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="">Prefer not to say</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-muted rounded-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

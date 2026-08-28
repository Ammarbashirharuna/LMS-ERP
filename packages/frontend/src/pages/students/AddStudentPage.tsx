import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentApi } from "../../api/students";
import type { StudentFormData } from "../../types/student";

export function AddStudentPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<StudentFormData>({
    firstName: "",
    lastName: "",
    dob: "",
    gender: undefined,
    classId: undefined,
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await studentApi.create(formData);
      navigate("/students");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create student");
    }
  };

  const handleCancel = () => {
    navigate("/students");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 page-enter">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Add New Student</h1>
        <p className="text-text-muted mt-1">Create a new student profile</p>
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
          <button type="submit" className="btn-primary">
            Save Student
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-muted rounded-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

import { useState, useEffect } from "react";
import axios from "axios";
import { useOfflineObservation } from "../../hooks/useOfflineAttendance";
import { useObservations } from "../../hooks/useObservations";
import { useAuth } from "../../hooks/useAuth";

interface SimpleStudent {
  id: string;
  firstName: string;
  lastName: string;
}

interface CurriculumItem {
  id: string;
  title: string;
}

export function AddObservationPage() {
  const [formData, setFormData] = useState({
    studentId: "",
    note: "",
    masteryLevel: "INTRODUCED" as "INTRODUCED" | "PRACTICING" | "MASTERED",
    curriculumItemId: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState<SimpleStudent[]>([]);
  const [curriculumItems, setCurriculumItems] = useState<CurriculumItem[]>([]);
  const { recordOffline } = useOfflineObservation();
  const { refetch } = useObservations();
  const { user } = useAuth();

  async function loadStudents() {
    try {
      const res = await axios.get("/api/v1/students");
      setStudents(res.data.data || res.data);
    } catch {
      setStudents([]);
    }
  }

  async function loadCurriculumItems() {
    try {
      const res = await axios.get("/api/v1/curriculum/items");
      setCurriculumItems(res.data.data || res.data);
    } catch {
      setCurriculumItems([]);
    }
  }

  useEffect(() => {
    (async () => {
      await loadStudents();
      await loadCurriculumItems();
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await recordOffline({
        studentId: formData.studentId,
        teacherId: user?.id || "current-user",
        note: formData.note,
        masteryLevel: formData.masteryLevel,
        curriculumItemId: formData.curriculumItemId || undefined,
      });
      await refetch();
      setFormData({
        studentId: "",
        note: "",
        masteryLevel: "INTRODUCED",
        curriculumItemId: "",
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save observation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 page-enter">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Record Observation</h1>
        <p className="text-text-muted mt-1">Log a student observation (works offline)</p>
      </div>

      {error && <p className="text-danger mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="surface p-6 max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Student
          </label>
          <select
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Select a student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Mastery Level
          </label>
          <select
            name="masteryLevel"
            value={formData.masteryLevel}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="INTRODUCED">Introduced</option>
            <option value="PRACTICING">Practicing</option>
            <option value="MASTERED">Mastered</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Curriculum Item (Optional)
          </label>
          <select
            name="curriculumItemId"
            value={formData.curriculumItemId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="">None</option>
            {curriculumItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Observation Note
          </label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            placeholder="Describe what you observed..."
            required
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Observation"}
          </button>
        </div>
      </form>
    </div>
  );
}

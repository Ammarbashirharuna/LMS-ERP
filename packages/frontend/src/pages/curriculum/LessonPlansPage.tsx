import { useState, useEffect } from "react";
import axios from "axios";
import { useLessonPlans, useCreateLessonPlan } from "../../hooks/useCurriculum";
import type { LessonPlan } from "../../api/curriculum";

interface ClassRoom {
  id: string;
  name: string;
}

interface CurriculumItem {
  id: string;
  title: string;
  area?: { name: string };
}

export function LessonPlansPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: lessonPlans, isLoading, refetch } = useLessonPlans();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [curriculumItems, setCurriculumItems] = useState<CurriculumItem[]>([]);

  async function loadClasses() {
    try {
      const res = await axios.get("/api/v1/classes");
      setClasses(res.data.data || res.data);
    } catch {
      setClasses([]);
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
      await loadClasses();
      await loadCurriculumItems();
    })();
  }, []);

  const plans = (lessonPlans ?? []) as LessonPlan[];

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
        <h1 className="text-3xl font-bold text-text-primary">Lesson Plans</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary"
        >
          Create Lesson Plan
        </button>
      </div>

      {showCreate && (
        <CreateLessonPlanModal
          classes={classes}
          curriculumItems={curriculumItems}
          onClose={() => setShowCreate(false)}
          onSave={async () => {
            setShowCreate(false);
            await refetch();
          }}
        />
      )}

      <div className="surface rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-muted border-b border-border">
              <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">Title</th>
              <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">Class</th>
              <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">Curriculum</th>
              <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">Date</th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                  No lesson plans found. Click &quot;Create Lesson Plan&quot; to get started.
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr key={plan.id} className="border-b border-border hover:bg-surface-muted/50">
                  <td className="px-4 py-3 font-medium text-text-primary">{plan.title}</td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {plan.classRoom?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {plan.curriculumItem ? `${plan.curriculumItem.area.name}: ${plan.curriculumItem.title}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {new Date(plan.date).toLocaleDateString()}
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

interface CreateLessonPlanModalProps {
  classes: ClassRoom[];
  curriculumItems: CurriculumItem[];
  onClose: () => void;
  onSave: () => Promise<void>;
}

function CreateLessonPlanModal({ classes, curriculumItems, onClose, onSave }: CreateLessonPlanModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    date: new Date().toISOString().split("T")[0],
    curriculumItemId: "",
    classId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutateAsync: createPlan } = useCreateLessonPlan();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createPlan({
        title: formData.title,
        content: formData.content,
        date: formData.date,
        curriculumItemId: formData.curriculumItemId || undefined,
        classId: formData.classId || undefined,
      });
      await onSave();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="surface p-6 w-full max-w-lg m-4">
        <h2 className="text-xl font-bold text-text-primary mb-4">Create Lesson Plan</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Curriculum Item
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
              Class
            </label>
            <select
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Content / Notes
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="Lesson plan details..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-muted rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

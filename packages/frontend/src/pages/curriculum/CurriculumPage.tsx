import { useState, useEffect } from "react";
import axios from "axios";
import { useCurriculumTree } from "../../hooks/useCurriculum";
import { useAuth } from "../../hooks/useAuth";

interface TreeNode {
  id: string;
  name: string;
  order: number;
  items: Array<{
    id: string;
    title: string;
    ageBand: string | null;
    materialIds: string[];
    description: string | null;
    lessonPlanCount: number;
    observationCount: number;
    latestMastery: string | null;
  }>;
}

const MASTERY_COLORS: Record<string, string> = {
  INTRODUCED: "bg-info/10 text-info",
  PRACTICING: "bg-warning/10 text-warning",
  MASTERED: "bg-success/10 text-success",
  null: "bg-surface-muted text-text-muted",
};

export function CurriculumPage() {
  const { user } = useAuth();
  const { data: tree, isLoading } = useCurriculumTree(undefined, undefined);
  const [selectedClass, setSelectedClass] = useState("");
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);

  async function loadClasses() {
    try {
      const res = await axios.get("/api/v1/classes");
      setClasses(res.data.data || res.data);
    } catch {
      setClasses([]);
    }
  }

  useEffect(() => {
    (async () => {
      await loadClasses();
    })();
  }, []);

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

  const areas = (tree ?? []) as TreeNode[];

  return (
    <div className="p-4 sm:p-6 lg:p-8 page-enter">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Curriculum Library</h1>
          <p className="text-text-muted mt-1">Browse curriculum areas and items</p>
        </div>
        {(user?.role === "admin" ||
          user?.role === "teacher") && (
          <button
            onClick={() => (window.location.href = "/lesson-plans")}
            className="text-sm text-primary hover:text-primary-hover"
          >
            Lesson Plans
          </button>
        )}
      </div>

      <div className="mb-4">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-6">
        {areas.map((area) => (
          <div key={area.id} className="surface rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-1">{area.name}</h2>
            <p className="text-sm text-text-muted mb-4">{area.items.length} curriculum items</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {area.items.map((item) => (
                <div
                  key={item.id}
                  className="border border-border rounded-lg p-3 hover:border-primary transition-colors"
                >
                  <h3 className="font-medium text-text-primary">{item.title}</h3>
                  {item.ageBand && (
                    <p className="text-xs text-text-muted mt-1">Age: {item.ageBand}</p>
                  )}
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className={item.latestMastery ? MASTERY_COLORS[item.latestMastery] : MASTERY_COLORS.null}>
                      {item.latestMastery
                        ? item.latestMastery.charAt(0) + item.latestMastery.slice(1).toLowerCase()
                        : "Not yet observed"}
                    </span>
                    <span className="text-text-muted">
                      {item.observationCount} observation{item.observationCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-text-muted">
                      {item.lessonPlanCount} lesson plan{item.lessonPlanCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

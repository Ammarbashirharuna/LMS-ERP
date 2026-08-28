import { useParams } from "react-router-dom";
import { useStudentProgress } from "../../hooks/useCurriculum";

interface ProgressArea {
  area: string;
  items: Array<{
    title: string;
    mastery: string;
    observations: number;
    lastObserved: string;
  }>;
}

const MASTERY_COLORS: Record<string, string> = {
  INTRODUCED: "bg-info/10 text-info",
  PRACTICING: "bg-warning/10 text-warning",
  MASTERED: "bg-success/10 text-success",
};

export function StudentProgressPage() {
  const { id: studentId } = useParams<{ id: string }>();
  const { data, isLoading } = useStudentProgress(studentId!);

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

  const progress = (data ?? []) as ProgressArea[];

  return (
    <div className="p-4 sm:p-6 lg:p-8 page-enter">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Student Progress</h1>
        <p className="text-text-muted mt-1">Curriculum progress tracking</p>
      </div>

      {progress.length === 0 ? (
        <div className="surface p-8 text-center text-text-muted">
          No observations recorded yet. Add observations to track progress.
        </div>
      ) : (
        <div className="space-y-6">
          {progress.map((area, i) => (
            <div key={i} className="surface rounded-lg p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                {area.area}
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-muted border-b border-border">
                      <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">
                        Curriculum Item
                      </th>
                      <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">
                        Mastery Level
                      </th>
                      <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">
                        Observations
                      </th>
                      <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">
                        Last Observed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {area.items.map((item, j) => (
                      <tr key={j} className="border-b border-border">
                        <td className="px-4 py-3 font-medium text-text-primary">
                          {item.title}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              MASTERY_COLORS[item.mastery] ?? "bg-surface-muted text-text-muted"
                            }`}
                          >
                            {item.mastery.charAt(0) + item.mastery.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-muted">
                          {item.observations}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-muted">
                          {new Date(item.lastObserved).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

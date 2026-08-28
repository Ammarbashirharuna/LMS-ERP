import { useParams } from "react-router-dom";
import { useAIInsights } from "../../hooks/useAI";
import { useStudent } from "../../hooks/useStudents";

export function AIInsightsPage() {
  const { id: studentId } = useParams<{ id: string }>();
  const { data: student } = useStudent(studentId!);
  const { data: aiData, isLoading: aiLoading, refetch } = useAIInsights(studentId!);

  if (!studentId) {
    return <div className="p-4 sm:p-6 lg:p-8 page-enter">Student ID required.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 page-enter">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">
          AI Insights
        </h1>
        <p className="text-text-muted mt-1">
          {student?.firstName} {student?.lastName}&rsquo;s progress analysis
        </p>
      </div>

      <button
        onClick={() => void refetch()}
        className="btn-primary mb-4"
        disabled={aiLoading}
      >
        {aiLoading ? "Analyzing..." : "Generate Insights"}
      </button>

      <div className="surface p-6">
        {aiLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-surface-muted rounded w-full"></div>
            <div className="h-4 bg-surface-muted rounded w-5/6"></div>
            <div className="h-4 bg-surface-muted rounded w-4/5"></div>
            <div className="h-4 bg-surface-muted rounded w-3/4"></div>
          </div>
        ) : (
          <div
            className="prose prose-sm max-w-none text-text-primary"
            dangerouslySetInnerHTML={{
              __html: (aiData?.insights || "No insights available. Click &quot;Generate Insights&quot; to analyze student progress.").replace(/\n/g, "<br />"),
            }}
          />
        )}
      </div>
    </div>
  );
}

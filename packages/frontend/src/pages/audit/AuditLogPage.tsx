import { useState } from "react";
import { useAuditLog } from "../../hooks/useAudit";
import { Shield, Plus, Pencil, Trash2, Clock, ChevronLeft, ChevronRight } from "lucide-react";

interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  meta?: Record<string, unknown>;
  createdAt: string;
  user?: { email: string; firstName?: string; lastName?: string };
}

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const { data, isLoading } = useAuditLog({ page, limit });

  const entries: AuditEntry[] = data?.data || [];
  const pagination = data?.pagination;

  const getActionInfo = (action: string) => {
    if (action.includes("create") || action.includes("POST"))
      return { icon: Plus, color: "text-success", bg: "bg-green-50" };
    if (action.includes("delete") || action.includes("DELETE"))
      return { icon: Trash2, color: "text-danger", bg: "bg-red-50" };
    if (action.includes("update") || action.includes("PATCH"))
      return { icon: Pencil, color: "text-primary", bg: "bg-primary-subtle" };
    return { icon: Clock, color: "text-text-muted", bg: "bg-surface-muted" };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
          <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          Audit Log
        </h1>
        <p className="text-text-muted text-xs sm:text-sm mt-1">System activity trail for accountability and transparency</p>
      </div>

      {isLoading ? (
        <div className="surface p-8 text-center"><div className="animate-pulse text-text-muted">Loading audit log...</div></div>
      ) : entries.length === 0 ? (
        <div className="surface p-8 sm:p-12 text-center">
          <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-muted font-medium">No audit entries yet</p>
          <p className="text-text-muted text-xs sm:text-sm mt-1">Actions will be logged as users interact with the system</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block surface overflow-hidden">
            <div className="table-responsive">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/50">
                    {["Timestamp", "User", "Action", "Resource", "Details"].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry: AuditEntry) => {
                    const info = getActionInfo(entry.action);
                    const Icon = info.icon;
                    return (
                      <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-surface-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-text-muted whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-primary">
                          {entry.user ? `${entry.user.firstName || ""} ${entry.user.lastName || ""}`.trim() || entry.user.email : entry.userId.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${info.bg} ${info.color}`}>
                            <Icon className="w-3 h-3" /> {entry.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">{entry.resource}</td>
                        <td className="px-6 py-4 text-sm text-text-muted max-w-xs truncate">
                          {entry.meta ? JSON.stringify(entry.meta).slice(0, 80) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {entries.map((entry: AuditEntry) => {
              const info = getActionInfo(entry.action);
              const Icon = info.icon;
              return (
                <div key={entry.id} className="surface p-4 hover-lift">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${info.bg} ${info.color}`}>
                      <Icon className="w-3 h-3" /> {entry.action}
                    </span>
                    <span className="text-xs text-text-muted whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text-primary">
                    {entry.user ? `${entry.user.firstName || ""} ${entry.user.lastName || ""}`.trim() || entry.user.email : "System"}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{entry.resource}{entry.meta ? ` · ${JSON.stringify(entry.meta).slice(0, 60)}` : ""}</p>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs sm:text-sm text-text-muted">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium border border-border rounded-xl hover:bg-surface-muted disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, pagination.pages - 4));
                  const pageNum = start + i;
                  if (pageNum > pagination.pages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-xs sm:text-sm rounded-xl font-medium transition-colors ${
                        pageNum === page ? "bg-primary text-white" : "border border-border hover:bg-surface-muted"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  className="flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium border border-border rounded-xl hover:bg-surface-muted disabled:opacity-50 transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useOfflineObservation } from "../../hooks/useOfflineAttendance";
import { useObservations } from "../../hooks/useObservations";
import { apiClient } from "../../api/client";
import { Pencil, Trash2, Eye, Plus } from "lucide-react";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

interface SimpleStudent {
  id: string;
  firstName: string;
  lastName: string;
}

interface ObservationWithStudent {
  id: string;
  studentId: string;
  teacherId: string;
  note: string;
  masteryLevel: string;
  createdAt: string;
  updatedAt: string;
  student?: SimpleStudent;
  curriculumItem?: { id: string; title: string };
}

export function ObservationsPage() {
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [offlineObservations, setOfflineObservations] = useState<ObservationWithStudent[]>([]);
  const [viewModal, setViewModal] = useState<ObservationWithStudent | null>(null);
  const { getLocalObservations } = useOfflineObservation();
  const { data, isLoading } = useObservations(searchTerm ? { search: searchTerm } : undefined);

  const onlineObservations: ObservationWithStudent[] = data?.data ?? [];
  const allObservations = [...offlineObservations, ...onlineObservations];

  useEffect(() => {
    (async () => { const pending = await getLocalObservations(); setOfflineObservations(pending as unknown as ObservationWithStudent[]); })();
  }, []);

  const getMasteryColor = (level: string) => {
    const colors: Record<string, string> = { INTRODUCED: "bg-info/10 text-info", PRACTICING: "bg-warning/10 text-warning", MASTERED: "bg-success/10 text-success" };
    return colors[level] || "bg-surface-muted text-text-muted";
  };

  const [deleteTarget, setDeleteTarget] = useState<ObservationWithStudent | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.delete(`/observations/${deleteTarget.id}`);
      qc.invalidateQueries({ queryKey: ["observations"] });
      setDeleteTarget(null);
    } catch { /* handled */ }
  };

  if (isLoading && allObservations.length === 0) {
    return <div className="p-4 sm:p-6 lg:p-8"><div className="animate-pulse space-y-4"><div className="h-8 bg-surface-muted rounded w-1/4"></div><div className="h-64 bg-surface-muted rounded"></div></div></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary">Observations</h1>
          <p className="text-text-muted text-xs sm:text-sm mt-1">{allObservations.length} observations</p>
        </div>
        <Link to="/observations/add" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Observation
        </Link>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search observations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary text-sm" />
      </div>

      {/* Desktop */}
      <div className="hidden md:block surface overflow-hidden">
        <div className="table-responsive">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-surface-muted border-b border-border">
                {["Student", "Mastery", "Note", "Date", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allObservations.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">No observations found.</td></tr>
              ) : allObservations.map((obs) => (
                <tr key={obs.id} className="border-b border-border hover:bg-surface-muted/50 transition-colors">
                  <td className="px-4 sm:px-6 py-3 font-medium text-text-primary">{obs.student?.firstName} {obs.student?.lastName}</td>
                  <td className="px-4 sm:px-6 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getMasteryColor(obs.masteryLevel)}`}>
                      {obs.masteryLevel.charAt(0) + obs.masteryLevel.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-sm text-text-muted max-w-md truncate">{obs.note.length > 80 ? `${obs.note.substring(0, 80)}...` : obs.note}</td>
                  <td className="px-4 sm:px-6 py-3 text-sm text-text-muted">{new Date(obs.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 sm:px-6 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setViewModal(obs)} className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => window.location.href = `/observations/add?edit=${obs.id}`}
                        className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(obs)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-red-50 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {allObservations.map((obs) => (
          <div key={obs.id} className="surface p-4 hover-lift">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-text-primary">{obs.student?.firstName} {obs.student?.lastName}</p>
                <p className="text-xs text-text-muted">{new Date(obs.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getMasteryColor(obs.masteryLevel)}`}>
                {obs.masteryLevel.charAt(0) + obs.masteryLevel.slice(1).toLowerCase()}
              </span>
            </div>
            <p className="text-sm text-text-muted mb-3 line-clamp-2">{obs.note}</p>
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <button onClick={() => setViewModal(obs)} className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"><Eye className="w-4 h-4" /></button>
              <button onClick={() => setDeleteTarget(obs)} className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-red-50 transition-colors ml-auto"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {offlineObservations.length > 0 && (
        <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-xl text-sm text-warning">
          {offlineObservations.length} observation(s) pending sync. Will upload when online.
        </div>
      )}

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setViewModal(null)}>
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-primary">Observation Detail</h3>
              <button onClick={() => setViewModal(null)} className="p-2 rounded-lg hover:bg-surface-muted transition-colors text-text-muted">✕</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Student</span>
                <span className="text-sm font-medium text-text-primary">{viewModal.student?.firstName} {viewModal.student?.lastName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Mastery</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getMasteryColor(viewModal.masteryLevel)}`}>
                  {viewModal.masteryLevel.charAt(0) + viewModal.masteryLevel.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Date</span>
                <span className="text-sm text-text-primary">{new Date(viewModal.createdAt).toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-sm text-text-muted mb-1">Note</p>
                <p className="text-sm text-text-primary whitespace-pre-wrap">{viewModal.note}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Observation"
        message="Are you sure you want to delete this observation? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

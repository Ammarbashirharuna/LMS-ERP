import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { Megaphone, Plus, Trash2, Eye, X } from "lucide-react";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import type { Announcement } from "../../api/communication";

export function AnnouncementsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [showCreate, setShowCreate] = useState(false);
  const [viewAnnouncement, setViewAnnouncement] = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => apiClient.get("/communication/announcements").then((r) => r.data),
    retry: 1,
  });

  const announcements: Announcement[] = data?.data || data || [];

  const markRead = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/communication/announcements/${id}/read`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });

  const createAnnouncement = useMutation({
    mutationFn: (data: { title: string; body: string }) =>
      apiClient.post("/communication/announcements", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      setShowCreate(false);
    },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/communication/announcements/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      setDeleteTarget(null);
    },
  });

  const unreadCount = announcements.filter((a) => !a.participants?.[0]?.isRead).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Announcements
          </h1>
          <p className="text-text-muted text-xs sm:text-sm mt-1">
            {announcements.length} announcement{announcements.length !== 1 ? "s" : ""}
            {unreadCount > 0 && ` · ${unreadCount} unread`}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-danger text-sm">
          Failed to load announcements.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="surface p-4 animate-pulse">
              <div className="h-5 bg-surface-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-surface-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="surface p-8 sm:p-12 text-center">
          <Megaphone className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-muted font-medium">No announcements yet</p>
          {isAdmin && <p className="text-text-muted text-sm mt-1">Create your first announcement to notify everyone</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const isRead = a.participants?.[0]?.isRead ?? true;
            return (
              <div
                key={a.id}
                className={`surface p-4 sm:p-5 border-l-4 hover-lift cursor-pointer ${
                  isRead ? "border-surface-muted" : "border-primary"
                }`}
                onClick={() => {
                  setViewAnnouncement(a);
                  if (!isRead) markRead.mutate(a.id);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>}
                      <h3 className={`text-sm sm:text-base ${isRead ? "font-medium" : "font-bold"} text-text-primary truncate`}>
                        {a.title}
                      </h3>
                    </div>
                    <p className="text-xs text-text-muted">
                      {new Date(a.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-sm text-text-muted mt-1.5 line-clamp-2">{a.body}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setViewAnnouncement(a); }}
                      className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(a); }}
                        className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateAnnouncementModal
          onClose={() => setShowCreate(false)}
          onSubmit={(title, body) => createAnnouncement.mutateAsync({ title, body })}
          loading={createAnnouncement.isPending}
          error={createAnnouncement.error instanceof Error ? createAnnouncement.error.message : null}
        />
      )}

      {/* View Modal */}
      {viewAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setViewAnnouncement(null)}>
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 animate-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">{viewAnnouncement.title}</h2>
              <button onClick={() => setViewAnnouncement(null)} className="p-1.5 rounded-lg hover:bg-surface-muted transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <p className="text-xs text-text-muted mb-4">
              {new Date(viewAnnouncement.createdAt).toLocaleString()}
            </p>
            <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed bg-surface-muted rounded-xl p-4">
              {viewAnnouncement.body}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteAnnouncement.isPending}
        onConfirm={() => deleteTarget && deleteAnnouncement.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function CreateAnnouncementModal({
  onClose,
  onSubmit,
  loading,
  error,
}: {
  onClose: () => void;
  onSubmit: (title: string, body: string) => Promise<unknown>;
  loading: boolean;
  error: string | null;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(title, body);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-text-primary">New Announcement</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-muted transition-colors">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-danger text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
              placeholder="e.g. School Holiday Notice"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm resize-none"
              placeholder="Write your announcement..."
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-text-muted bg-surface-muted rounded-xl hover:bg-border transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim() || !body.trim()} className="flex-1 btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? "Publishing..." : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

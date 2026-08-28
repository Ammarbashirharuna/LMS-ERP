import { useState } from "react";
import { useClasses, useCreateClass, useDeleteClass } from "../../hooks/useClasses";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { School, Plus, Trash2, Users, X, Edit2, UserPlus, Search } from "lucide-react";

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
}

interface ClassItem {
  id: string;
  name: string;
  academicYear: string;
  teacherIds: string[];
  createdAt: string;
}

export function ClassesPage() {
  const { data, isLoading, error } = useClasses();
  const createClass = useCreateClass();
  const deleteClass = useDeleteClass();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null);
  const [assignModal, setAssignModal] = useState<ClassItem | null>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

  const { data: staffData } = useQuery({
    queryKey: ["hr-staff"],
    queryFn: () => apiClient.get("/hr").then((r) => r.data),
  });

  const staffList: StaffMember[] = staffData?.data || staffData || [];
  const classes: ClassItem[] = data?.data || data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createClass.mutateAsync({ name, academicYear });
    setName("");
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteClass.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const openAssignModal = (cls: ClassItem) => {
    setAssignModal(cls);
    setSelectedTeachers(cls.teacherIds || []);
  };

  const toggleTeacher = (staffId: string) => {
    setSelectedTeachers((prev) =>
      prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]
    );
  };

  const saveTeachers = async () => {
    if (!assignModal) return;
    try {
      await apiClient.patch(`/classes/${assignModal.id}`, { teacherIds: selectedTeachers });
      setAssignModal(null);
      window.location.reload();
    } catch { /* ignore */ }
  };

  const getTeacherNames = (teacherIds: string[]) => {
    if (!teacherIds?.length) return "No teachers assigned";
    return teacherIds
      .map((id) => {
        const staff = staffList.find((s) => s.id === id);
        return staff ? `${staff.firstName} ${staff.lastName}` : id.slice(0, 8);
      })
      .join(", ");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <School className="w-6 h-6 text-primary" /> Classes
          </h1>
          <p className="text-text-muted text-sm mt-1">Manage classrooms and assign teachers</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "New Class"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-border p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Create Class</h2>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-text-primary mb-1">Class Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                placeholder="e.g. Sunflower Class (3-6)" required />
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-text-primary mb-1">Academic Year</label>
              <input type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm" required />
            </div>
            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={createClass.isPending}>
              {createClass.isPending ? "Creating..." : "Create"}
            </button>
          </form>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <div className="animate-pulse text-text-muted">Loading classes...</div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <p className="text-danger">Failed to load classes.</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
          <School className="w-12 h-12 text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-muted font-medium">No classes yet</p>
          <p className="text-text-muted text-sm mt-1">Create your first class to get started</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-muted/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Class Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Academic Year</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Teachers</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <tr key={cls.id} className="border-b border-border last:border-0 hover:bg-surface-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-subtle flex items-center justify-center">
                          <School className="w-4 h-4 text-primary" />
                        </div>
                        <p className="font-medium text-text-primary">{cls.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">{cls.academicYear}</td>
                    <td className="px-6 py-4 text-sm text-text-muted max-w-xs truncate">{getTeacherNames(cls.teacherIds)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openAssignModal(cls)}
                          className="text-text-muted hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary-subtle" title="Assign Teachers">
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(cls)}
                          className="text-text-muted hover:text-danger transition-colors p-1.5 rounded-lg hover:bg-red-50" title="Delete Class">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {classes.map((cls) => (
              <div key={cls.id} className="bg-white rounded-xl border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-subtle flex items-center justify-center">
                      <School className="w-4 h-4 text-primary" />
                    </div>
                    <p className="font-medium text-text-primary">{cls.name}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openAssignModal(cls)} className="p-1.5 rounded-lg hover:bg-primary-subtle text-text-muted">
                      <UserPlus className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(cls)} className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-text-muted">{cls.academicYear} | {getTeacherNames(cls.teacherIds)}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Class"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Assign Teachers Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setAssignModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Assign Teachers</h2>
                <p className="text-sm text-text-muted">{assignModal.name}</p>
              </div>
              <button onClick={() => setAssignModal(null)} className="p-2 hover:bg-surface-muted rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh] space-y-2">
              {staffList.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-4">No staff members found. Add staff from HR first.</p>
              ) : (
                staffList.map((staff) => (
                  <button key={staff.id} onClick={() => toggleTeacher(staff.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedTeachers.includes(staff.id) ? "border-primary bg-primary-subtle" : "border-border hover:bg-surface-muted"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedTeachers.includes(staff.id) ? "bg-primary text-white" : "bg-surface-muted text-text-muted"}`}>
                      {staff.firstName[0]}{staff.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">{staff.firstName} {staff.lastName}</p>
                      <p className="text-xs text-text-muted">{staff.position}</p>
                    </div>
                    {selectedTeachers.includes(staff.id) && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><span className="text-white text-xs">&#10003;</span></div>}
                  </button>
                ))
              )}
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button onClick={() => setAssignModal(null)} className="px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-muted rounded-xl">Cancel</button>
              <button onClick={saveTeachers} className="btn-primary">Save Teachers</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

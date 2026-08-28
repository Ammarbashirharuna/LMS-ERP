import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMaterials, useCreateMaterial, useAdjustStock } from "../../hooks/useInventory";
import { apiClient } from "../../api/client";
import { Package, Plus, AlertTriangle, CheckCircle, X, Pencil, Trash2 } from "lucide-react";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

interface Material {
  id: string;
  name: string;
  quantity: number;
  location?: string;
  lowStockThreshold: number;
}

export function InventoryPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useMaterials();
  const createMaterial = useCreateMaterial();
  const adjustStock = useAdjustStock();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", quantity: "0", location: "", lowStockThreshold: "5" });
  const [adjustModal, setAdjustModal] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState("0");
  const [editModal, setEditModal] = useState<Material | null>(null);
  const [editForm, setEditForm] = useState({ name: "", location: "", lowStockThreshold: "5" });

  const materials: Material[] = data?.data || data || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMaterial.mutateAsync({
      name: form.name,
      quantity: Number(form.quantity),
      location: form.location || undefined,
      lowStockThreshold: Number(form.lowStockThreshold),
    });
    setForm({ name: "", quantity: "0", location: "", lowStockThreshold: "5" });
    setShowForm(false);
  };

  const handleAdjust = async (id: string) => {
    await adjustStock.mutateAsync({ id, adjustment: Number(adjustValue) });
    setAdjustModal(null);
    setAdjustValue("0");
  };

  const handleEdit = (m: Material) => {
    setEditModal(m);
    setEditForm({ name: m.name, location: m.location || "", lowStockThreshold: String(m.lowStockThreshold) });
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    try {
      await apiClient.patch(`/inventory/${editModal.id}`, {
        name: editForm.name,
        location: editForm.location || undefined,
        lowStockThreshold: Number(editForm.lowStockThreshold),
      });
      qc.invalidateQueries({ queryKey: ["materials"] });
      setEditModal(null);
    } catch { /* handled */ }
  };

  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.delete(`/inventory/${deleteTarget.id}`);
      qc.invalidateQueries({ queryKey: ["materials"] });
      setDeleteTarget(null);
    } catch { /* handled */ }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Inventory
          </h1>
          <p className="text-text-muted text-xs sm:text-sm mt-1">Montessori materials stock tracking</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add Material"}
        </button>
      </div>

      {showForm && (
        <div className="surface p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Add Material</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-text-primary mb-1">Material Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                placeholder="e.g. Pink Tower" required />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-primary mb-1">Quantity</label>
              <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm" min="0" />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-primary mb-1">Low Stock At</label>
              <input type="number" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm" min="0" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-text-primary mb-1">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                placeholder="e.g. Sensorial shelf, Room 2" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary text-sm" disabled={createMaterial.isPending}>
                {createMaterial.isPending ? "Adding..." : "Add Material"}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="surface p-8 text-center"><div className="animate-pulse text-text-muted">Loading inventory...</div></div>
      ) : materials.length === 0 ? (
        <div className="surface p-8 sm:p-12 text-center">
          <Package className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted/30 mx-auto mb-3" />
          <p className="text-text-muted font-medium">No materials in inventory</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block surface overflow-hidden">
            <div className="table-responsive">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/50">
                    {["Material", "Location", "Quantity", "Threshold", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m: Material) => {
                    const isLow = m.quantity <= m.lowStockThreshold;
                    return (
                      <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-subtle flex items-center justify-center">
                              <Package className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium text-text-primary">{m.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted">{m.location || "—"}</td>
                        <td className="px-6 py-4 text-sm font-medium text-text-primary text-center">{m.quantity}</td>
                        <td className="px-6 py-4 text-sm text-text-muted text-center">{m.lowStockThreshold}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isLow ? "bg-danger text-white" : "bg-success text-white"}`}>
                            {isLow ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                            {isLow ? "Low Stock" : "In Stock"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => { setAdjustModal(m.id); setAdjustValue("0"); }}
                              className="px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                              Restock
                            </button>
                            <button onClick={() => handleEdit(m)} className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteTarget(m)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-red-50 transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
            {materials.map((m: Material) => {
              const isLow = m.quantity <= m.lowStockThreshold;
              return (
                <div key={m.id} className="surface p-4 hover-lift">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-subtle flex items-center justify-center">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{m.name}</p>
                        <p className="text-xs text-text-muted">{m.location || "No location"}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${isLow ? "bg-danger text-white" : "bg-success text-white"}`}>
                      {isLow ? "Low" : "OK"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-text-muted">Qty: <strong className="text-text-primary">{m.quantity}</strong> / {m.lowStockThreshold}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <button onClick={() => { setAdjustModal(m.id); setAdjustValue("0"); }}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                      Restock
                    </button>
                    <button onClick={() => handleEdit(m)} className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(m)} className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Adjust Stock Modal */}
      {adjustModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-lg p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Adjust Stock</h3>
            <p className="text-sm text-text-muted mb-4">Positive to add, negative to remove</p>
            <input type="number" value={adjustValue} onChange={(e) => setAdjustValue(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm mb-4" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setAdjustModal(null)} className="px-4 py-2 text-sm text-text-muted hover:text-text-primary rounded-xl transition-colors">Cancel</button>
              <button onClick={() => handleAdjust(adjustModal)} className="btn-primary text-sm" disabled={adjustStock.isPending}>
                {adjustStock.isPending ? "Adjusting..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Material Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setEditModal(null)}>
          <div className="bg-surface rounded-2xl shadow-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Edit Material</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Location</label>
                <input type="text" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Low Stock Threshold</label>
                <input type="number" value={editForm.lowStockThreshold} onChange={(e) => setEditForm({ ...editForm, lowStockThreshold: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm" />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setEditModal(null)} className="px-4 py-2 text-sm text-text-muted hover:text-text-primary rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSaveEdit} className="btn-primary text-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Material"
        message={`Are you sure you want to delete \"${deleteTarget?.name}\" from inventory? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

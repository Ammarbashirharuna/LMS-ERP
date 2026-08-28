import { useState } from "react";
import {
  useStaff,
  useCreateStaff,
  useLeaveRequests,
  useApproveLeaveRequest,
  useCreateStaffAccount,
  useRoles,
} from "../../hooks/useHR";
import { apiClient } from "../../api/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  X,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  Phone,
  Key,
  Shield,
  Copy,
  Check,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  salary?: number;
  phone?: string;
  email?: string;
  hireDate: string;
  leaveBalance: number;
  userId?: string | null;
}

interface LeaveRequest {
  id: string;
  staffId: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
  staff?: { firstName: string; lastName: string };
}

interface Role {
  id: string;
  name: string;
  isSystem: boolean;
}

export function HRPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"staff" | "leave">("staff");
  const { data: staffData, isLoading: staffLoading } = useStaff();
  const { data: leaveData, isLoading: leaveLoading } = useLeaveRequests();
  const { data: rolesData } = useRoles();
  const createStaff = useCreateStaff();
  const approveLeave = useApproveLeaveRequest();
  const createAccount = useCreateStaffAccount();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", position: "", email: "", phone: "", hireDate: "", salary: "" });

  // Account creation modal state
  const [accountModal, setAccountModal] = useState<StaffMember | null>(null);
  const [selectedRole, setSelectedRole] = useState("teacher");
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; tempPassword: string; role: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [customEmail, setCustomEmail] = useState("");

  // Edit modal state
  const [editModal, setEditModal] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", position: "", email: "", phone: "", hireDate: "", salary: "" });

  const staff: StaffMember[] = staffData?.data || staffData || [];
  const leaves: LeaveRequest[] = leaveData?.data || leaveData || [];
  const roles: Role[] = rolesData || [];

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createStaff.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        position: form.position,
        email: form.email || undefined,
        phone: form.phone || undefined,
        hireDate: form.hireDate,
        salary: form.salary ? Number(form.salary) : undefined,
      });
      setForm({ firstName: "", lastName: "", position: "", email: "", phone: "", hireDate: "", salary: "" });
      setShowForm(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    await approveLeave.mutateAsync({ id, approved });
  };

  const handleCreateAccount = async () => {
    if (!accountModal) return;
    setAccountError("");
    try {
      const emailToUse = customEmail || accountModal.email || undefined;
      const result = await createAccount.mutateAsync({ staffId: accountModal.id, role: selectedRole, email: emailToUse });
      setCreatedCredentials(result);
    } catch (err: unknown) {
      setAccountError(err instanceof Error ? err.message : "Failed to create account. Please try again.");
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Login Credentials:\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.tempPassword}\nRole: ${createdCredentials.role}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const closeAccountModal = () => {
    setAccountModal(null);
    setCreatedCredentials(null);
    setSelectedRole("teacher");
    setCopied(false);
    setAccountError("");
    setCustomEmail("");
  };

  const handleEditStaff = (s: StaffMember) => {
    setEditModal(s);
    setEditForm({
      firstName: s.firstName,
      lastName: s.lastName,
      position: s.position,
      email: s.email || "",
      phone: s.phone || "",
      hireDate: s.hireDate ? new Date(s.hireDate).toISOString().split("T")[0] : "",
      salary: s.salary ? String(s.salary) : "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    try {
      await apiClient.patch(`/hr/${editModal.id}`, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        position: editForm.position,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        salary: editForm.salary ? Number(editForm.salary) : undefined,
      });
      qc.invalidateQueries({ queryKey: ["staff"] });
      setEditModal(null);
    } catch {
      // handled
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

  const handleDeleteStaff = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.delete(`/hr/${deleteTarget.id}`);
      qc.invalidateQueries({ queryKey: ["staff"] });
      setDeleteTarget(null);
    } catch {
      // handled
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Human Resources
          </h1>
          <p className="text-text-muted text-xs sm:text-sm mt-1">Staff management and leave requests</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 overflow-x-auto">
        <button
          onClick={() => setTab("staff")}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
            tab === "staff" ? "bg-primary text-white shadow-sm" : "bg-surface-muted text-text-muted hover:text-text-primary"
          }`}
        >
          <Users className="w-4 h-4" />
          Staff ({staff.length})
        </button>
        <button
          onClick={() => setTab("leave")}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
            tab === "leave" ? "bg-primary text-white shadow-sm" : "bg-surface-muted text-text-muted hover:text-text-primary"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Leave ({leaves.filter((l) => l.status === "PENDING").length} pending)
        </button>
      </div>

      {tab === "staff" && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? "Cancel" : "Add Staff"}
            </button>
          </div>

          {showForm && (
            <div className="surface p-4 sm:p-6 mb-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Add Staff Member</h2>
              <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { label: "First Name", key: "firstName", type: "text", required: true },
                  { label: "Last Name", key: "lastName", type: "text", required: true },
                  { label: "Position", key: "position", type: "text", required: true },
                  { label: "Email", key: "email", type: "email" },
                  { label: "Phone", key: "phone", type: "tel" },
                  { label: "Hire Date", key: "hireDate", type: "date", required: true },
                  { label: "Salary", key: "salary", type: "number" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs sm:text-sm font-medium text-text-primary mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      value={(form as Record<string, string>)[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                      required={field.required}
                    />
                  </div>
                ))}
                <div className="flex items-end">
                  <button type="submit" className="btn-primary text-sm" disabled={createStaff.isPending}>
                    {createStaff.isPending ? "Adding..." : "Add Staff"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {staffLoading ? (
            <div className="surface p-8 text-center"><div className="animate-pulse text-text-muted">Loading staff...</div></div>
          ) : staff.length === 0 ? (
            <div className="surface p-8 sm:p-12 text-center">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-muted font-medium">No staff members yet</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block surface overflow-hidden">
                <div className="table-responsive">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-border bg-surface-muted/50">
                        {["Name", "Position", "Contact", "Hire Date", "Login Status", "Actions"].map((h) => (
                          <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map((s: StaffMember) => (
                        <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary-subtle flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-primary">{s.firstName[0]}{s.lastName[0]}</span>
                              </div>
                              <span className="font-medium text-text-primary">{s.firstName} {s.lastName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-text-muted">{s.position}</td>
                          <td className="px-6 py-4 text-sm text-text-muted">
                            <div className="flex flex-col gap-0.5">
                              {s.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</span>}
                              {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-text-muted">{new Date(s.hireDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            {s.userId ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-success">
                                <Shield className="w-3 h-3" /> Has Login
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-warning">No Login</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 justify-end flex-wrap">
                              {!s.userId && s.email && (
                                <button
                                  onClick={() => { setAccountModal(s); setSelectedRole("teacher"); setAccountError(""); setCustomEmail(s.email || ""); }}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                                >
                                  <Key className="w-3 h-3" /> Create Login
                                </button>
                              )}
                              <button onClick={() => handleEditStaff(s)} className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors" title="Edit">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-red-50 transition-colors" title="Delete">
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
                {staff.map((s: StaffMember) => (
                  <div key={s.id} className="surface p-4 hover-lift">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-subtle flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">{s.firstName[0]}{s.lastName[0]}</span>
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-text-muted">{s.position}</p>
                        </div>
                      </div>
                      {s.userId ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-success">
                          <Shield className="w-3 h-3" /> Has Login
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-warning">No Login</span>
                      )}
                    </div>
                    <div className="text-xs text-text-muted space-y-1 mb-3">
                      {s.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {s.email}</p>}
                      {s.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.phone}</p>}
                      <p>Hired: {new Date(s.hireDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      {!s.userId && s.email && (
                        <button onClick={() => { setAccountModal(s); setSelectedRole("teacher"); setAccountError(""); setCustomEmail(s.email || ""); }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                          <Key className="w-3.5 h-3.5" /> Create Login
                        </button>
                      )}
                      <button onClick={() => handleEditStaff(s)} className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(s)} className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {tab === "leave" && (
        <>
          {leaveLoading ? (
            <div className="surface p-8 text-center"><div className="animate-pulse text-text-muted">Loading leave requests...</div></div>
          ) : leaves.length === 0 ? (
            <div className="surface p-8 sm:p-12 text-center">
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-muted font-medium">No leave requests</p>
            </div>
          ) : (
            <div className="surface overflow-hidden">
              <div className="table-responsive">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/50">
                      {["Staff", "Period", "Reason", "Status", "Actions"].map((h) => (
                        <th key={h} className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((lr: LeaveRequest) => (
                      <tr key={lr.id} className="border-b border-border last:border-0 hover:bg-surface-muted/30 transition-colors">
                        <td className="px-4 sm:px-6 py-4 text-sm font-medium text-text-primary">
                          {lr.staff ? `${lr.staff.firstName} ${lr.staff.lastName}` : lr.staffId}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-text-muted">
                          {new Date(lr.startDate).toLocaleDateString()} — {new Date(lr.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-text-muted">{lr.reason || "—"}</td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            lr.status === "APPROVED" ? "bg-success text-white"
                              : lr.status === "REJECTED" ? "bg-danger text-white"
                              : "bg-warning text-white"
                          }`}>{lr.status}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          {lr.status === "PENDING" && (
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => handleApprove(lr.id, true)} className="p-1.5 rounded-lg text-success hover:bg-green-50 transition-colors"><CheckCircle className="w-4 h-4" /></button>
                              <button onClick={() => handleApprove(lr.id, false)} className="p-1.5 rounded-lg text-danger hover:bg-red-50 transition-colors"><XCircle className="w-4 h-4" /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================== ACCOUNT CREATION MODAL ======================== */}
      {accountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeAccountModal}>
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-subtle flex items-center justify-center">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-text-primary">Create Login Account</h2>
                  <p className="text-xs text-text-muted">{accountModal.firstName} {accountModal.lastName}</p>
                </div>
              </div>
              <button onClick={closeAccountModal} className="p-2 rounded-lg hover:bg-surface-muted transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="px-6 py-5">
              {accountError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-danger text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {accountError}
                </div>
              )}

              {!createdCredentials && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-primary mb-1">Email for Login</label>
                  <input
                    type="email"
                    value={customEmail || accountModal?.email || ""}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                    placeholder="Enter email for login"
                  />
                  <p className="text-xs text-text-muted mt-1">Change this if the default email is already in use</p>
                </div>
              )}

              {createdCredentials ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-center">
                    <CheckCircle className="w-10 h-10 text-success mx-auto mb-2" />
                    <p className="font-bold text-success text-lg">Account Created!</p>
                    <p className="text-sm text-text-muted mt-1">Share these credentials with the staff member</p>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-surface-muted rounded-xl p-4">
                      <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">Email</label>
                      <p className="text-sm font-mono text-text-primary mt-1">{createdCredentials.email}</p>
                    </div>
                    <div className="bg-surface-muted rounded-xl p-4">
                      <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">Temporary Password</label>
                      <p className="text-sm font-mono text-text-primary mt-1 font-bold">{createdCredentials.tempPassword}</p>
                    </div>
                    <div className="bg-surface-muted rounded-xl p-4">
                      <label className="text-xs font-semibold text-text-muted uppercase tracking-wide">Role</label>
                      <p className="text-sm font-mono text-text-primary mt-1 capitalize">{createdCredentials.role}</p>
                    </div>
                  </div>
                  <button onClick={handleCopyCredentials} className="w-full btn-primary flex items-center justify-center gap-2">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied to Clipboard!" : "Copy Credentials"}
                  </button>
                  <p className="text-xs text-text-muted text-center">The staff member should change their password after first login.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-text-muted">
                    Create a login for <strong>{accountModal.firstName} {accountModal.lastName}</strong>. You can change the email below if the default one is already in use.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Assign Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      {roles.filter((r) => ["teacher", "parent", "finance_staff", "hr_staff"].includes(r.name)).map((r) => (
                        <button
                          key={r.name}
                          onClick={() => setSelectedRole(r.name)}
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                            selectedRole === r.name
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-surface hover:border-primary/50"
                          }`}
                        >
                          {r.name.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </button>
                      ))}
                    </div>
                    {roles.length === 0 && (
                      <p className="text-xs text-text-muted mt-2">No custom roles found. Teacher role will be used.</p>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                    A temporary password will be generated. Share it securely with the staff member — they should change it on first login.
                  </div>
                </div>
              )}
            </div>

            {!createdCredentials && (
              <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
                <button onClick={closeAccountModal} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors">Cancel</button>
                <button
                  onClick={handleCreateAccount}
                  disabled={createAccount.isPending}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  {createAccount.isPending ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================== EDIT STAFF MODAL ======================== */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditModal(null)}>
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-text-primary">Edit Staff Member</h2>
              <button onClick={() => setEditModal(null)} className="p-2 rounded-lg hover:bg-surface-muted transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "First Name", key: "firstName", type: "text" },
                { label: "Last Name", key: "lastName", type: "text" },
                { label: "Position", key: "position", type: "text" },
                { label: "Email", key: "email", type: "email" },
                { label: "Phone", key: "phone", type: "tel" },
                { label: "Salary", key: "salary", type: "number" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-text-muted mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={editForm[field.key as keyof typeof editForm]}
                    onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button onClick={() => setEditModal(null)} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors">Cancel</button>
              <button onClick={handleSaveEdit} className="btn-primary text-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Remove Staff Member"
        message={`Are you sure you want to remove ${deleteTarget?.firstName} ${deleteTarget?.lastName} from staff? This action cannot be undone.`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleDeleteStaff}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

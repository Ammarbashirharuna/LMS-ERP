import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { apiClient } from "../../api/client";
import { useFeeStructures } from "../../hooks/useFinance";
import type { FeeStructure, Invoice } from "../../api/finance";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import {
  DollarSign, FileText, Plus, CreditCard, CheckCircle, Clock,
  AlertCircle, X, Loader2,
} from "lucide-react";

interface SchoolSettings {
  schoolName?: string; schoolMotto?: string; schoolLogo?: string;
  currency?: string; currencySymbol?: string; bankName?: string;
  bankAccount?: string; bankSortCode?: string; invoicePrefix?: string;
}

export function FinancePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "admin";
  const isParent = user?.role === "parent";
  const [activeTab, setActiveTab] = useState<"invoices" | "fees">("invoices");
  const [showCreateFee, setShowCreateFee] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"success" | "failed" | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  // Handle Paystack redirect callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentResult = params.get("payment");
    const reference = params.get("reference");
    const invoiceId = params.get("invoiceId");

    if (paymentResult === "success" && reference && invoiceId) {
      apiClient
        .get(`/finance/payments/verify/${reference}?invoiceId=${invoiceId}`)
        .then((r) => {
          if (r.data.status === "success") {
            setPaymentStatus("success");
            qc.invalidateQueries({ queryKey: ["invoices"] });
          } else {
            setPaymentStatus("failed");
          }
        })
        .catch(() => setPaymentStatus("failed"))
        .finally(() => {
          window.history.replaceState({}, "", window.location.pathname);
          setTimeout(() => setPaymentStatus(null), 5000);
        });
    }
  }, []);

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiClient.get("/settings").then((r) => r.data),
    retry: 1, staleTime: 300000,
  });
  const settings: SchoolSettings = settingsData?.data || settingsData || {};
  const currencySymbol = settings.currencySymbol || "$";

  const { data: feeData, isLoading: feesLoading } = useFeeStructures();
  const fees: FeeStructure[] = feeData || [];

  const { data: invoiceData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => apiClient.get("/finance/invoices").then((r) => r.data),
    retry: 1,
  });

  const invoices: Invoice[] = invoiceData?.data || invoiceData || [];

  const recordPayment = useMutation({
    mutationFn: (data: { invoiceId: string; amount: number; method: string }) =>
      apiClient.post("/finance/payments", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });

  const handlePayNow = async (invoice: Invoice) => {
    setPayingInvoiceId(invoice.id);
    try {
      const result = await apiClient
        .post("/finance/payments/initialize", { invoiceId: invoice.id })
        .then((r) => r.data);

      // Redirect to Paystack payment page
      if (result.authorization_url) {
        window.location.href = result.authorization_url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start payment";
      setPayError(msg);
      setPayingInvoiceId(null);
    }
  };

  const totalPending = invoices
    .filter((i) => i.status === "PENDING")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalPaid = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 page-enter">
      {/* Payment Success/Failed Banner */}
      {payError && (
        <div className="mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in bg-red-50 border-red-200 text-danger">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium flex-1">{payError}</p>
          <button onClick={() => setPayError(null)} className="p-1 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      {paymentStatus && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in ${
            paymentStatus === "success"
              ? "bg-green-50 border-green-200 text-success"
              : "bg-red-50 border-red-200 text-danger"
          }`}
        >
          {paymentStatus === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium flex-1">
            {paymentStatus === "success"
              ? "Payment successful! Your invoice has been updated."
              : "Payment was not completed. Please try again."}
          </p>
          <button onClick={() => setPaymentStatus(null)} className="p-1 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Finance
          </h1>
          <p className="text-text-muted text-xs sm:text-sm mt-1">Invoices, payments, and fee structures</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && activeTab === "fees" && (
            <button onClick={() => setShowCreateFee(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> New Fee
            </button>
          )}
          {isAdmin && activeTab === "invoices" && (
            <button onClick={() => setShowCreateInvoice(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> New Invoice
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-border p-4 glass-primary">
          <p className="text-xs text-text-muted">Total Invoices</p>
          <p className="text-2xl font-bold text-text-primary">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4">
          <p className="text-xs text-text-muted">Pending</p>
          <p className="text-2xl font-bold text-warning">{currencySymbol}{totalPending.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4">
          <p className="text-xs text-text-muted">Paid</p>
          <p className="text-2xl font-bold text-success">{currencySymbol}{totalPaid.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 border-b border-border overflow-x-auto">
        {[
          { key: "invoices" as const, label: "Invoices & Payments", icon: FileText },
          { key: "fees" as const, label: "Fee Structures", icon: DollarSign },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "text-primary border-primary"
                : "text-text-muted border-transparent hover:text-text-primary"
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <>
          {invoicesLoading ? (
            <div className="surface p-8 text-center animate-pulse text-text-muted">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="surface p-8 sm:p-12 text-center">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-muted font-medium">No invoices yet</p>
              {isAdmin && <p className="text-text-muted text-sm mt-1">Create an invoice to start tracking payments</p>}
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block surface overflow-hidden">
                <div className="table-responsive">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border bg-surface-muted/50">
                        {["Student", "Amount", "Due Date", "Status", "Actions"].map((h) => (
                          <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-surface-muted/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-text-primary">
                            {inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : "—"}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-text-primary">
                            {currencySymbol}{Number(inv.amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-text-muted">
                            {new Date(inv.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={inv.status} />
                          </td>
                          <td className="px-6 py-4">
                            {inv.status === "PENDING" && (
                              <div className="flex items-center gap-2 justify-end">
                                {isParent && (
                                  <button
                                    onClick={() => handlePayNow(inv)}
                                    disabled={payingInvoiceId === inv.id}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-success rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                  >
                                    {payingInvoiceId === inv.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <CreditCard className="w-3.5 h-3.5" />
                                    )}
                                    {payingInvoiceId === inv.id ? "Loading..." : "Pay Now"}
                                  </button>
                                )}
                                {isAdmin && (
                                  <button
                                    onClick={() => recordPayment.mutate({ invoiceId: inv.id, amount: Number(inv.amount), method: "CASH" })}
                                    className="text-xs px-2 py-1 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                  >
                                    Mark Paid
                                  </button>
                                )}
                              </div>
                            )}
                            {inv.status === "PAID" && (
                              <span className="text-xs text-success flex items-center gap-1 justify-end">
                                <CheckCircle className="w-3.5 h-3.5" /> Paid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {invoices.map((inv) => (
                  <div key={inv.id} className="surface p-4 hover-lift">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-text-primary">
                          {inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : "Invoice"}
                        </p>
                        <p className="text-xs text-text-muted">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="text-lg font-bold text-text-primary">{currencySymbol}{Number(inv.amount).toFixed(2)}</span>
                      {inv.status === "PENDING" && isParent && (
                        <button
                          onClick={() => handlePayNow(inv)}
                          disabled={payingInvoiceId === inv.id}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-success rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {payingInvoiceId === inv.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CreditCard className="w-3.5 h-3.5" />
                          )}
                          {payingInvoiceId === inv.id ? "Loading..." : "Pay Now"}
                        </button>
                      )}
                      {inv.status === "PENDING" && isAdmin && (
                        <button
                          onClick={() => recordPayment.mutate({ invoiceId: inv.id, amount: Number(inv.amount), method: "CASH" })}
                          className="text-xs px-3 py-1.5 text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Fee Structures Tab */}
      {activeTab === "fees" && (
        <>
          {feesLoading ? (
            <div className="surface p-8 text-center animate-pulse text-text-muted">Loading fee structures...</div>
          ) : fees.length === 0 ? (
            <div className="surface p-8 sm:p-12 text-center">
              <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted/30 mx-auto mb-3" />
              <p className="text-text-muted font-medium">No fee structures configured</p>
            </div>
          ) : (
            <div className="surface overflow-hidden">
              <div className="table-responsive">
                <table className="w-full min-w-[400px]">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/50">
                      {["Grade", "Term", "Amount"].map((h) => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((fee) => (
                      <tr key={fee.id} className="border-b border-border last:border-0 hover:bg-surface-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-text-primary">{fee.grade}</td>
                        <td className="px-6 py-4 text-sm text-text-muted">{fee.term}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-text-primary">{currencySymbol}{Number(fee.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Fee Structure Modal */}
      {showCreateFee && (
        <CreateFeeModal
          onClose={() => setShowCreateFee(false)}
          onSuccess={() => { setShowCreateFee(false); qc.invalidateQueries({ queryKey: ["fee-structures"] }); }}
        />
      )}

      {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <CreateInvoiceModal
          onClose={() => setShowCreateInvoice(false)}
          onSuccess={() => { setShowCreateInvoice(false); qc.invalidateQueries({ queryKey: ["invoices"] }); }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: typeof CheckCircle; className: string; label: string }> = {
    PAID: { icon: CheckCircle, className: "bg-success text-white", label: "Paid" },
    PENDING: { icon: Clock, className: "bg-warning text-white", label: "Pending" },
    OVERDUE: { icon: AlertCircle, className: "bg-danger text-white", label: "Overdue" },
    CANCELLED: { icon: X, className: "bg-surface-muted text-text-muted", label: "Cancelled" },
  };
  const c = config[status] || config.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.className}`}>
      <c.icon className="w-3 h-3" /> {c.label}
    </span>
  );
}

function CreateFeeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ grade: "", term: "", amount: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post("/finance/fee-structures", {
        grade: form.grade,
        term: form.term,
        amount: Number(form.amount),
      });
      onSuccess();
    } catch { /* handled */ }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-text-primary">New Fee Structure</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-muted transition-colors"><X className="w-5 h-5 text-text-muted" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Grade</label>
            <input type="text" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Term</label>
            <input type="text" value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm" placeholder="e.g. Term 1 2025" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Amount</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm" step="0.01" min="0" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-text-muted bg-surface-muted rounded-xl hover:bg-border transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary text-sm disabled:opacity-50">{loading ? "Creating..." : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateInvoiceModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { data: studentsData } = useQuery({
    queryKey: ["students"],
    queryFn: () => apiClient.get("/students?limit=100").then((r) => r.data),
  });
  const students = studentsData?.data || studentsData || [];
  const [form, setForm] = useState({ studentId: "", amount: "", dueDate: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiClient.post("/finance/invoices", {
        studentId: form.studentId,
        amount: Number(form.amount),
        dueDate: form.dueDate,
      });
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-text-primary">New Invoice</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-muted transition-colors"><X className="w-5 h-5 text-text-muted" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-danger text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Student</label>
            <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm bg-white" required>
              <option value="">Select student</option>
              {students.map((s: { id: string; firstName: string; lastName: string }) => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Amount</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm" step="0.01" min="0" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Due Date</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-text-muted bg-surface-muted rounded-xl hover:bg-border transition-colors">Cancel</button>
            <button type="submit" disabled={loading || !form.studentId} className="flex-1 btn-primary text-sm disabled:opacity-50">{loading ? "Creating..." : "Create Invoice"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

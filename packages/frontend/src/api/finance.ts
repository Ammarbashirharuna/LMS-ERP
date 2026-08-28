import { apiClient } from "./client";

export interface FeeStructure {
  id: string;
  tenantId: string;
  grade: string;
  term: string;
  amount: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  studentId: string;
  feeStructureId?: string | null;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  dueDate: string;
  amount: number;
  createdAt: string;
  student?: { id: string; firstName: string; lastName: string };
  feeStructure?: FeeStructure | null;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId: string;
  amount: number;
  method: "CASH" | "CARD" | "BANK_TRANSFER" | "OTHER";
  paidAt: string;
}

export const financeApi = {
  getFeeStructures() {
    return apiClient.get("/finance/fee-structures");
  },

  createFeeStructure(data: { grade: string; term: string; amount: number }) {
    return apiClient.post("/finance/fee-structures", data);
  },

  getInvoices(filters?: { studentId?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.studentId) params.append("studentId", filters.studentId);
    if (filters?.status) params.append("status", filters.status);
    return apiClient.get("/finance/invoices", { params });
  },

  createInvoice(data: { studentId: string; feeStructureId?: string; dueDate: string; amount: number }) {
    return apiClient.post("/finance/invoices", data);
  },

  getStudentInvoices(studentId: string) {
    return apiClient.get(`/finance/invoices/student/${studentId}`);
  },

  recordPayment(data: { invoiceId: string; amount: number; method: "CASH" | "CARD" | "BANK_TRANSFER" | "OTHER" }) {
    return apiClient.post("/finance/payments", data);
  },
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "../api/finance";
import type { FeeStructure, Invoice } from "../api/finance";

export const useFeeStructures = () => {
  return useQuery({
    queryKey: ["fee-structures"],
    queryFn: () => financeApi.getFeeStructures().then((res) => res.data as FeeStructure[]),
  });
};

export const useInvoices = (filters?: { studentId?: string; status?: string }) => {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: () => financeApi.getInvoices(filters).then((res) => res.data),
  });
};

export const useStudentInvoices = (studentId: string) => {
  return useQuery({
    queryKey: ["student-invoices", studentId],
    queryFn: () => financeApi.getStudentInvoices(studentId).then((res) => res.data as InvoiceExtended[]),
    enabled: !!studentId,
  });
};

interface InvoiceExtended extends Invoice {
  totalPaid: number;
  remaining: number;
}

export const useCreateFeeStructure = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { grade: string; term: string; amount: number }) =>
      financeApi.createFeeStructure(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
    },
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { invoiceId: string; amount: number; method: "CASH" | "CARD" | "BANK_TRANSFER" | "OTHER" }) =>
      financeApi.recordPayment(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["student-invoices"] });
    },
  });
};

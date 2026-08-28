import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hrApi } from "../api/hr";

export function useStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: () => hrApi.listStaff().then((r) => r.data),
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof hrApi.createStaff>[0]) =>
      hrApi.createStaff(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useLeaveRequests() {
  return useQuery({
    queryKey: ["leave-requests"],
    queryFn: () => hrApi.listLeaveRequests().then((r) => r.data),
  });
}

export function useApproveLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      hrApi.approveLeaveRequest(id, approved).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-requests"] }),
  });
}

export function useCreateStaffAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, role, email }: { staffId: string; role?: string; email?: string }) =>
      hrApi.createStaffAccount(staffId, role, email).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => hrApi.listRoles().then((r) => r.data),
  });
}

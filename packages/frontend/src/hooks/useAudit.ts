import { useQuery } from "@tanstack/react-query";
import { auditApi } from "../api/audit";

export function useAuditLog(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["audit-log", params],
    queryFn: () => auditApi.list(params).then((r) => r.data),
  });
}

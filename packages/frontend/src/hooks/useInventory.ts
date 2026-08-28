import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "../api/inventory";

export function useMaterials(lowStock?: boolean) {
  return useQuery({
    queryKey: ["materials", { lowStock }],
    queryFn: () => inventoryApi.list({ lowStock }).then((r) => r.data),
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof inventoryApi.create>[0]) =>
      inventoryApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materials"] }),
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, adjustment }: { id: string; adjustment: number }) =>
      inventoryApi.adjustStock(id, adjustment).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materials"] }),
  });
}

export function useCheckoutMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof inventoryApi.checkout>[0]) =>
      inventoryApi.checkout(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materials"] }),
  });
}

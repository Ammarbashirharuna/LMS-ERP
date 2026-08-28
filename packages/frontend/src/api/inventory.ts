import { apiClient } from "./client";

export const inventoryApi = {
  list: (params?: { lowStock?: boolean }) =>
    apiClient.get("/inventory", { params: params?.lowStock ? { lowStock: "true" } : undefined }),
  get: (id: string) => apiClient.get(`/inventory/${id}`),
  create: (data: { name: string; quantity: number; location?: string; lowStockThreshold?: number }) =>
    apiClient.post("/inventory", data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/inventory/${id}`, data),
  delete: (id: string) => apiClient.delete(`/inventory/${id}`),
  adjustStock: (id: string, adjustment: number) =>
    apiClient.patch(`/inventory/${id}/stock`, { adjustment }),
  checkout: (data: { materialId: string; classId?: string; quantity?: number }) =>
    apiClient.post("/inventory/checkout", data),
  return: (checkoutId: string) =>
    apiClient.post(`/inventory/checkout/${checkoutId}/return`),
};

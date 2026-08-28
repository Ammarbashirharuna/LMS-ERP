import { apiClient } from "./client";

export const hrApi = {
  // Staff
  listStaff: () => apiClient.get("/hr"),
  getStaff: (id: string) => apiClient.get(`/hr/${id}`),
  createStaff: (data: {
    firstName: string;
    lastName: string;
    position: string;
    salary?: number;
    phone?: string;
    email?: string;
    hireDate: string;
  }) => apiClient.post("/hr", data),
  updateStaff: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/hr/${id}`, data),
  deleteStaff: (id: string) => apiClient.delete(`/hr/${id}`),

  /** Create a login account for a staff member */
  createStaffAccount: (staffId: string, role?: string, email?: string) =>
    apiClient.post(`/hr/${staffId}/create-account`, { role: role || "teacher", email }),

  /** Get all roles in the tenant */
  listRoles: () => apiClient.get("/hr/meta/roles"),

  // Leave requests
  listLeaveRequests: () => apiClient.get("/hr/leave-requests"),
  createLeaveRequest: (data: {
    staffId: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) => apiClient.post("/hr/leave-requests", data),
  approveLeaveRequest: (id: string, approved: boolean) =>
    apiClient.patch(`/hr/leave-requests/${id}/approve`, { approved }),
};

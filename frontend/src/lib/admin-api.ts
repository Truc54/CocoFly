import { fetchApi } from "./api";

export const adminApi = {
  dashboard: {
    getStats: () => fetchApi("/api/admin/dashboard/stats"),
    getRevenue: (period: "day" | "week" | "month") =>
      fetchApi(`/api/admin/dashboard/revenue?period=${period}`),
    getActivity: () => fetchApi("/api/admin/dashboard/activity"),
  },
  users: {
    list: (params: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.search) query.append("search", params.search);
      if (params.role) query.append("role", params.role);
      if (params.status) query.append("status", params.status);
      return fetchApi(`/api/admin/users?${query.toString()}`);
    },
    getById: (id: string) => fetchApi(`/api/admin/users/${id}`),
    ban: (id: string, reason: string) =>
      fetchApi(`/api/admin/users/${id}/ban`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      }),
    unban: (id: string) =>
      fetchApi(`/api/admin/users/${id}/unban`, {
        method: "PATCH",
      }),
    changeRole: (id: string, role: string) =>
      fetchApi(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    resetStrikes: (id: string) =>
      fetchApi(`/api/admin/users/${id}/reset-strikes`, {
        method: "PATCH",
      }),
  },
  auctions: {
    list: (params: { page?: number; limit?: number; status?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.status) query.append("status", params.status);
      if (params.search) query.append("search", params.search);
      return fetchApi(`/api/admin/auctions?${query.toString()}`);
    },
    getById: (id: string) => fetchApi(`/api/admin/auctions/${id}`),
    forceEnd: (id: string) =>
      fetchApi(`/api/admin/auctions/${id}/force-end`, {
        method: "POST",
      }),
    cancel: (id: string) =>
      fetchApi(`/api/admin/auctions/${id}/cancel`, {
        method: "POST",
      }),
  },
  payments: {
    list: (params: { page?: number; limit?: number; status?: string; method?: string }) => {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.status) query.append("status", params.status);
      if (params.method) query.append("method", params.method);
      return fetchApi(`/api/admin/payments?${query.toString()}`);
    },
    refund: (id: string, amount: number, reason: string) =>
      fetchApi(`/api/admin/payments/${id}/refund`, {
        method: "POST",
        body: JSON.stringify({ amount, reason }),
      }),
  },
  disputes: {
    list: (params: { page?: number; limit?: number; status?: string }) => {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.status) query.append("status", params.status);
      return fetchApi(`/api/admin/disputes?${query.toString()}`);
    },
    getById: (id: string) => fetchApi(`/api/admin/disputes/${id}`),
    review: (id: string) =>
      fetchApi(`/api/admin/disputes/${id}/review`, {
        method: "PATCH",
      }),
    resolve: (id: string, resolution: "buyer" | "seller", note: string) =>
      fetchApi(`/api/admin/disputes/${id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ resolution, note }),
      }),
  },
  categories: {
    list: () => fetchApi("/api/admin/categories"),
    create: (data: { name: string; slug: string; description?: string; parentId?: number | null; sortOrder?: number; iconUrl?: string }) =>
      fetchApi("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: { name?: string; slug?: string; description?: string; parentId?: number | null; sortOrder?: number; iconUrl?: string; isActive?: boolean }) =>
      fetchApi(`/api/admin/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    remove: (id: number) =>
      fetchApi(`/api/admin/categories/${id}`, {
        method: "DELETE",
      }),
  },
  config: {
    getAll: () => fetchApi("/api/admin/config"),
    update: (key: string, value: string) =>
      fetchApi(`/api/admin/config/${key}`, {
        method: "PUT",
        body: JSON.stringify({ value }),
      }),
  },
  auditLogs: {
    list: (params: { page?: number; limit?: number; actionType?: string; actorId?: string }) => {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.actionType) query.append("actionType", params.actionType);
      if (params.actorId) query.append("actorId", params.actorId);
      return fetchApi(`/api/admin/audit-logs?${query.toString()}`);
    },
  },
};

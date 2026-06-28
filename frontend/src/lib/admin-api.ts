import { fetchApi } from "./api";
import { ApiEndpoints } from "./api-endpoints";

export const adminApi = {
  dashboard: {
    getStats: () => fetchApi(ApiEndpoints.ADMIN.DASHBOARD.STATS),
    getRevenue: (period: "day" | "week" | "month") =>
      fetchApi(`${ApiEndpoints.ADMIN.DASHBOARD.REVENUE}?period=${period}`),
    getActivity: () => fetchApi(ApiEndpoints.ADMIN.DASHBOARD.ACTIVITY),
  },
  users: {
    list: (params: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.search) query.append("search", params.search);
      if (params.role) query.append("role", params.role);
      if (params.status) query.append("status", params.status);
      return fetchApi(`${ApiEndpoints.ADMIN.USERS.BASE}?${query.toString()}`);
    },
    getById: (id: string) => fetchApi(ApiEndpoints.ADMIN.USERS.BY_ID(id)),
    ban: (id: string, reason: string) =>
      fetchApi(ApiEndpoints.ADMIN.USERS.BAN(id), {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      }),
    unban: (id: string) =>
      fetchApi(ApiEndpoints.ADMIN.USERS.UNBAN(id), {
        method: "PATCH",
      }),
    changeRole: (id: string, role: string) =>
      fetchApi(ApiEndpoints.ADMIN.USERS.ROLE(id), {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    resetStrikes: (id: string) =>
      fetchApi(ApiEndpoints.ADMIN.USERS.RESET_STRIKES(id), {
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
      return fetchApi(`${ApiEndpoints.ADMIN.AUCTIONS.BASE}?${query.toString()}`);
    },
    getById: (id: string) => fetchApi(ApiEndpoints.ADMIN.AUCTIONS.BY_ID(id)),
    forceEnd: (id: string) =>
      fetchApi(ApiEndpoints.ADMIN.AUCTIONS.FORCE_END(id), {
        method: "POST",
      }),
    cancel: (id: string) =>
      fetchApi(ApiEndpoints.ADMIN.AUCTIONS.CANCEL(id), {
        method: "POST",
      }),
  },
  payments: {
    list: (params: { page?: number; limit?: number; status?: string; method?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.status) query.append("status", params.status);
      if (params.method) query.append("method", params.method);
      if (params.search) query.append("search", params.search);
      return fetchApi(`${ApiEndpoints.ADMIN.PAYMENTS.BASE}?${query.toString()}`);
    },
    refund: (id: string, reason: string) =>
      fetchApi(ApiEndpoints.ADMIN.PAYMENTS.REFUND(id), {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
  },
  disputes: {
    list: (params: { page?: number; limit?: number; status?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.status) query.append("status", params.status);
      if (params.search) query.append("search", params.search);
      return fetchApi(`${ApiEndpoints.ADMIN.DISPUTES.BASE}?${query.toString()}`);
    },
    getById: (id: string) => fetchApi(ApiEndpoints.ADMIN.DISPUTES.BY_ID(id)),
    resolve: (
      id: string,
      payload: { refundBuyer: boolean; strikeSeller: boolean; strikeBuyer: boolean; note: string }
    ) =>
      fetchApi(ApiEndpoints.ADMIN.DISPUTES.RESOLVE(id), {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
  },
  categories: {
    list: () => fetchApi(ApiEndpoints.ADMIN.CATEGORIES.BASE),
    create: (data: { name: string; slug: string; description?: string; parentId?: number | null; sortOrder?: number; iconUrl?: string }) =>
      fetchApi(ApiEndpoints.ADMIN.CATEGORIES.BASE, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: { name?: string; slug?: string; description?: string; parentId?: number | null; sortOrder?: number; iconUrl?: string; isActive?: boolean }) =>
      fetchApi(ApiEndpoints.ADMIN.CATEGORIES.BY_ID(id), {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    remove: (id: number) =>
      fetchApi(ApiEndpoints.ADMIN.CATEGORIES.BY_ID(id), {
        method: "DELETE",
      }),
  },
  config: {
    getAll: () => fetchApi(ApiEndpoints.ADMIN.CONFIG.BASE),
    update: (key: string, value: string) =>
      fetchApi(ApiEndpoints.ADMIN.CONFIG.BY_KEY(key), {
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
      return fetchApi(`${ApiEndpoints.ADMIN.AUDIT_LOGS}?${query.toString()}`);
    },
  },
};

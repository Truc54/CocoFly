import { authStorage } from "./auth-storage";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

export async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_URL}${endpoint}`;
  
  // Use 'include' to securely send the HttpOnly refresh cookie to the backend
  const defaultOptions: RequestInit = {
    credentials: "include",
    cache: "no-store", 
  };

  let token = authStorage.getToken();
  
  // Helper to build headers
  const getHeaders = (accessToken: string | null) => ({
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  });

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: getHeaders(token),
  });

  // Handle Token Expiry
  if (response.status === 401 && endpoint !== "/auth/login" && endpoint !== "/auth/refresh") {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        // Automatically ask for a new token using the HttpOnly cookie
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!refreshResponse.ok) {
          throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }

        const refreshData = await refreshResponse.json();
        
        // Save the new access token silently
        const currentUser = authStorage.getUser() || {};
        authStorage.save(refreshData.accessToken, currentUser);
        
        onTokenRefreshed(refreshData.accessToken);
        isRefreshing = false;

        // Retry the original request with the new token
        options.headers = getHeaders(refreshData.accessToken);
        return fetchApi(endpoint, options);
      } catch (err) {
        isRefreshing = false;
        authStorage.clear();
        window.dispatchEvent(new Event("auth-change"));
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
    } else {
      // If another request is already refreshing the token, wait for it
      return new Promise((resolve) => {
        addRefreshSubscriber((newToken) => {
          options.headers = getHeaders(newToken);
          resolve(fetchApi(endpoint, options));
        });
      });
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let errorMessage = "Có lỗi xảy ra, vui lòng thử lại sau.";
    if (data) {
      if (Array.isArray(data.message)) {
        errorMessage = data.message.join("\n");
      } else if (typeof data.message === "string") {
        errorMessage = data.message;
      } else if (data.error) {
        errorMessage = data.error;
      }
    }
    throw new Error(errorMessage || `Request Failed: ${response.status}`);
  }

  return data;
}

export const authApi = {
  register: (data: any) => fetchApi("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: any) => fetchApi("/auth/login", { 
    method: "POST", 
    body: JSON.stringify(data),
    credentials: "include",
  }),
  verifyOtp: (data: { email: string; otp: string }) => fetchApi("/auth/verify-otp", { method: "POST", body: JSON.stringify({ email: data.email, code: data.otp }) }),
  resendOtp: (data: { email: string }) => fetchApi("/auth/resend-otp", { method: "POST", body: JSON.stringify(data) }),
  logout: () => fetchApi("/auth/logout", { method: "POST", credentials: "include" }),
  forgotPassword: (data: { email: string }) => fetchApi("/auth/forgot-password", { method: "POST", body: JSON.stringify(data) }),
  verifyResetOtp: (data: { email: string; otp: string }) => fetchApi("/auth/verify-reset-otp", { method: "POST", body: JSON.stringify({ email: data.email, code: data.otp }) }),
  resetPassword: (data: { email: string; token: string; newPassword: string }) => fetchApi("/auth/reset-password", { method: "POST", body: JSON.stringify(data) }),
};

export const userApi = {
  upgradeRole: async (phoneNumber: string, token: string) => {
    return fetchApi('/api/users/upgrade-role', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  },
  getAddress: () => fetchApi('/api/users/me/address'),
  saveAddress: (addressLine: string, phone: string) => fetchApi('/api/users/me/address', {
    method: 'POST',
    body: JSON.stringify({ addressLine, phone }),
  }),
  getParticipatedAuctions: (tab?: string, page: number = 1, limit: number = 10) => {
    const qs = new URLSearchParams();
    if (tab) qs.set('tab', tab);
    qs.set('page', page.toString());
    qs.set('limit', limit.toString());
    return fetchApi(`/api/users/me/participated-auctions?${qs.toString()}`);
  },
  getMyProfile: () => fetchApi('/api/users/me/profile'),
  togglePin: (auctionId: string) => fetchApi(`/api/users/me/pin/${auctionId}`, { method: 'POST' }),
  getMyRelatedAuctions: (page: number = 1, limit: number = 8) =>
    fetchApi(`/api/users/me/related-auctions?page=${page}&limit=${limit}`),
  getMyReviews: (page: number = 1, limit: number = 10) =>
    fetchApi(`/api/users/me/reviews?page=${page}&limit=${limit}`),
  getTransactions: (page: number = 1, limit: number = 10) => 
    fetchApi(`/api/users/me/transactions?page=${page}&limit=${limit}`),
};

export const mediaApi = {
  getUploadSignature: () => fetchApi('/api/media/sign', { method: 'POST' }),
};

export const auctionApi = {
  // ── Listing pages
  getLive: (params?: { page?: number; limit?: number; categoryId?: number; sort?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.categoryId) searchParams.set('categoryId', String(params.categoryId));
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return fetchApi(`/api/auctions/live${qs ? `?${qs}` : ''}`);
  },
  getUpcoming: (params?: { page?: number; limit?: number; categoryId?: number; period?: string; search?: string; sort?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.categoryId) searchParams.set('categoryId', String(params.categoryId));
    if (params?.period) searchParams.set('period', params.period);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sort) searchParams.set('sort', params.sort);
    const qs = searchParams.toString();
    return fetchApi(`/api/auctions/upcoming${qs ? `?${qs}` : ''}`);
  },
  // ── Single auction
  getById: (id: string) => fetchApi(`/api/auctions/${id}`),
  // ── Bid history for detail page
  getBidHistory: (id: string, page = 1, limit = 20) =>
    fetchApi(`/api/auctions/${id}/bids?page=${page}&limit=${limit}`),
  // ── Create auction
  create: (data: any) => fetchApi('/api/auctions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  // ── Search suggestions
  getSuggestions: (q: string, status: 'active' | 'scheduled' = 'active', limit = 8) =>
    fetchApi(`/api/auctions/suggestions?q=${encodeURIComponent(q)}&status=${status}&limit=${limit}`),
  // ── Get user's bid status for an auction (requires auth)
  getMyBidStatus: (id: string) => fetchApi(`/api/auctions/${id}/my-status`),
  // ── Seller: manage own auctions
  getMyListings: (tab?: string, page: number = 1, limit: number = 10) => {
    const qs = new URLSearchParams();
    if (tab) qs.set('tab', tab);
    qs.set('page', page.toString());
    qs.set('limit', limit.toString());
    return fetchApi(`/api/auctions/my-listings?${qs.toString()}`);
  },
  update: (id: string, data: any) => fetchApi(`/api/auctions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  remove: (id: string) => fetchApi(`/api/auctions/${id}`, { method: 'DELETE' }),
  // ── Watchlist (Favorites)
  toggleWatch: (auctionId: string) => fetchApi(`/api/auctions/${auctionId}/watch`, { method: 'POST' }),
  getWatchlist: (page: number = 1, limit: number = 10) =>
    fetchApi(`/api/auctions/watchlist?page=${page}&limit=${limit}`),
  getWatchStatus: (auctionId: string) => fetchApi(`/api/auctions/${auctionId}/watch-status`),
  // ── Review Seller
  reviewSeller: (id: string, data: { rating: number; comment?: string }) => fetchApi(`/api/auctions/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const categoryApi = {
  getAll: () => fetchApi('/api/categories'),
};

export const notificationApi = {
  getNotifications: (cursor?: string, limit: number = 20, unreadOnly: boolean = false) => {
    const qs = new URLSearchParams();
    if (cursor) qs.set('cursor', cursor);
    qs.set('limit', limit.toString());
    if (unreadOnly) qs.set('unreadOnly', 'true');
    return fetchApi(`/api/notifications?${qs.toString()}`);
  },
  getUnreadCount: async (): Promise<number> => {
    const res = await fetchApi('/api/notifications/unread-count');
    return res?.count || 0;
  },
  markAsRead: (id: string) => fetchApi(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => fetchApi('/api/notifications/read-all', { method: 'PATCH' }),
};

export const paymentApi = {
  getByAuctionId: (auctionId: string) => fetchApi(`/api/payments/auction/${auctionId}`),
  initiate: (paymentId: string, method: string, shippingInfo?: { addressLine: string; phone: string }) => fetchApi(`/api/payments/${paymentId}/initiate`, {
    method: 'POST',
    body: JSON.stringify({ method, shippingInfo }),
  }),
  decline: (paymentId: string) =>
    fetchApi(`/api/auctions/payments/${paymentId}/decline`, { method: 'POST' }),
  confirmShipping: (paymentId: string) =>
    fetchApi(`/api/payments/${paymentId}/confirm-shipping`, { method: 'PATCH' }),
  confirmDelivery: (paymentId: string) =>
    fetchApi(`/api/payments/${paymentId}/confirm-delivery`, { method: 'PATCH' }),
};

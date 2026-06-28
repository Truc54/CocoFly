import { authStorage } from "./auth-storage";
import { ApiEndpoints } from "./api-endpoints";

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
  if (response.status === 401 && endpoint !== ApiEndpoints.AUTH.LOGIN && endpoint !== ApiEndpoints.AUTH.REFRESH) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshToken = authStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }

        // Automatically ask for a new token using the body-based refreshToken
        const refreshResponse = await fetch(`${API_URL}${ApiEndpoints.AUTH.REFRESH}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (!refreshResponse.ok) {
          throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }

        const refreshData = await refreshResponse.json();
        
        // Save the new access token and refresh token silently
        const currentUser = authStorage.getUser() || {};
        authStorage.save(refreshData.accessToken, currentUser, refreshData.refreshToken);
        
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
    let errorCode = "UNKNOWN_ERROR";

    if (data) {
      if (data.error) {
        if (typeof data.error === "object") {
          errorCode = data.error.code || errorCode;
          errorMessage = data.error.message || errorMessage;
        } else if (typeof data.error === "string") {
          errorMessage = data.error;
        }
      } else if (typeof data.message === "string") {
        errorMessage = data.message;
      } else if (Array.isArray(data.message)) {
        errorMessage = data.message.join("\n");
      }
    }
    const errorObj = new Error(errorMessage);
    (errorObj as any).code = errorCode;
    throw errorObj;
  }

  return data;
}

export const authApi = {
  register: (data: any) => fetchApi(ApiEndpoints.AUTH.REGISTER, { method: "POST", body: JSON.stringify(data) }),
  login: (data: any) => fetchApi(ApiEndpoints.AUTH.LOGIN, { 
    method: "POST", 
    body: JSON.stringify(data),
    credentials: "include",
  }),
  verifyOtp: (data: { email: string; otp: string }) => fetchApi(ApiEndpoints.AUTH.VERIFY_OTP, { method: "POST", body: JSON.stringify({ email: data.email, code: data.otp }) }),
  resendOtp: (data: { email: string }) => fetchApi(ApiEndpoints.AUTH.RESEND_OTP, { method: "POST", body: JSON.stringify(data) }),
  logout: () => {
    const refreshToken = authStorage.getRefreshToken();
    return fetchApi(ApiEndpoints.AUTH.LOGOUT, { 
      method: "POST", 
      credentials: "include",
      body: refreshToken ? JSON.stringify({ refreshToken }) : undefined
    });
  },
  forgotPassword: (data: { email: string }) => fetchApi(ApiEndpoints.AUTH.FORGOT_PASSWORD, { method: "POST", body: JSON.stringify(data) }),
  verifyResetOtp: (data: { email: string; otp: string }) => fetchApi(ApiEndpoints.AUTH.VERIFY_RESET_OTP, { method: "POST", body: JSON.stringify({ email: data.email, code: data.otp }) }),
  resetPassword: (data: { email: string; token: string; newPassword: string; oldPassword?: string }) => fetchApi(ApiEndpoints.AUTH.RESET_PASSWORD, { method: "POST", body: JSON.stringify(data) }),
};

export const userApi = {
  upgradeRole: async (phoneNumber: string, token: string) => {
    return fetchApi(ApiEndpoints.USERS.UPGRADE_ROLE, {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  },
  getAddress: () => fetchApi(ApiEndpoints.USERS.ADDRESS),
  saveAddress: (addressLine: string, phone: string) => fetchApi(ApiEndpoints.USERS.ADDRESS, {
    method: 'POST',
    body: JSON.stringify({ addressLine, phone }),
  }),
  getParticipatedAuctions: (tab?: string, page: number = 1, limit: number = 10) => {
    const qs = new URLSearchParams();
    if (tab) qs.set('tab', tab);
    qs.set('page', page.toString());
    qs.set('limit', limit.toString());
    return fetchApi(`${ApiEndpoints.USERS.PARTICIPATED_AUCTIONS}?${qs.toString()}`);
  },
  getMyProfile: () => fetchApi(ApiEndpoints.USERS.PROFILE),
  updateProfile: (data: { fullName?: string; bio?: string; address?: string; avatarUrl?: string }) => fetchApi(ApiEndpoints.USERS.PROFILE, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  updateNotificationSettings: (settings: any) => fetchApi(ApiEndpoints.USERS.NOTIFICATIONS, {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),
  togglePin: (auctionId: string) => fetchApi(ApiEndpoints.USERS.PIN(auctionId), { method: 'POST' }),
  getMyRelatedAuctions: (page: number = 1, limit: number = 8) =>
    fetchApi(`${ApiEndpoints.USERS.RELATED_AUCTIONS}?page=${page}&limit=${limit}`),
  getMyReviews: (page: number = 1, limit: number = 10) =>
    fetchApi(`${ApiEndpoints.USERS.REVIEWS}?page=${page}&limit=${limit}`),
  getTransactions: (page: number = 1, limit: number = 10) => 
    fetchApi(`${ApiEndpoints.USERS.TRANSACTIONS}?page=${page}&limit=${limit}`),
  getUserProfile: (id: string) => 
    fetchApi(ApiEndpoints.USERS.USER_PROFILE(id)),
  getUserRelatedAuctions: (id: string, page: number = 1, limit: number = 8) =>
    fetchApi(`${ApiEndpoints.USERS.USER_RELATED_AUCTIONS(id)}?page=${page}&limit=${limit}`),
  getUserReviews: (id: string, page: number = 1, limit: number = 10) =>
    fetchApi(`${ApiEndpoints.USERS.USER_REVIEWS(id)}?page=${page}&limit=${limit}`),
};

export const mediaApi = {
  getUploadSignature: () => fetchApi(ApiEndpoints.MEDIA.SIGN, { method: 'POST' }),
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
    return fetchApi(`${ApiEndpoints.AUCTIONS.LIVE}${qs ? `?${qs}` : ''}`);
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
    return fetchApi(`${ApiEndpoints.AUCTIONS.UPCOMING}${qs ? `?${qs}` : ''}`);
  },
  // ── Single auction
  getById: (id: string) => fetchApi(ApiEndpoints.AUCTIONS.BY_ID(id)),
  // ── Bid history for detail page
  getBidHistory: (id: string, page = 1, limit = 20) =>
    fetchApi(`${ApiEndpoints.AUCTIONS.BIDS(id)}?page=${page}&limit=${limit}`),
  // ── Create auction
  create: (data: any) => fetchApi(ApiEndpoints.AUCTIONS.CREATE, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  // ── Search suggestions
  getSuggestions: (q: string, status: 'active' | 'scheduled' = 'active', limit = 8) =>
    fetchApi(`${ApiEndpoints.AUCTIONS.SUGGESTIONS}?q=${encodeURIComponent(q)}&status=${status}&limit=${limit}`),
  // ── Get user's bid status for an auction (requires auth)
  getMyBidStatus: (id: string) => fetchApi(ApiEndpoints.AUCTIONS.MY_STATUS(id)),
  // ── Seller: manage own auctions
  getMyListings: (tab?: string, page: number = 1, limit: number = 10) => {
    const qs = new URLSearchParams();
    if (tab) qs.set('tab', tab);
    qs.set('page', page.toString());
    qs.set('limit', limit.toString());
    return fetchApi(`${ApiEndpoints.AUCTIONS.MY_LISTINGS}?${qs.toString()}`);
  },
  update: (id: string, data: any) => fetchApi(ApiEndpoints.AUCTIONS.BY_ID(id), {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  remove: (id: string) => fetchApi(ApiEndpoints.AUCTIONS.BY_ID(id), { method: 'DELETE' }),
  // ── Watchlist (Favorites)
  toggleWatch: (auctionId: string) => fetchApi(ApiEndpoints.AUCTIONS.WATCH(auctionId), { method: 'POST' }),
  getWatchlist: (page: number = 1, limit: number = 10) =>
    fetchApi(`${ApiEndpoints.AUCTIONS.WATCHLIST}?page=${page}&limit=${limit}`),
  getWatchStatus: (auctionId: string) => fetchApi(ApiEndpoints.AUCTIONS.WATCH_STATUS(auctionId)),
  // ── Review Seller
  reviewSeller: (id: string, data: { rating: number; comment?: string }) => fetchApi(ApiEndpoints.AUCTIONS.REVIEW(id), {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const categoryApi = {
  getAll: (params?: { featured?: boolean }) => {
    const qs = params?.featured ? '?featured=true' : '';
    return fetchApi(`${ApiEndpoints.CATEGORIES.GET_ALL}${qs}`);
  },
};

export const notificationApi = {
  getNotifications: (cursor?: string, limit: number = 20, unreadOnly: boolean = false) => {
    const qs = new URLSearchParams();
    if (cursor) qs.set('cursor', cursor);
    qs.set('limit', limit.toString());
    if (unreadOnly) qs.set('unreadOnly', 'true');
    return fetchApi(`${ApiEndpoints.NOTIFICATIONS.BASE}?${qs.toString()}`);
  },
  getUnreadCount: async (): Promise<number> => {
    const res = await fetchApi(ApiEndpoints.NOTIFICATIONS.UNREAD_COUNT);
    return res?.count || 0;
  },
  markAsRead: (id: string) => fetchApi(ApiEndpoints.NOTIFICATIONS.MARK_READ(id), { method: 'PATCH' }),
  markAllAsRead: () => fetchApi(ApiEndpoints.NOTIFICATIONS.MARK_ALL_READ, { method: 'PATCH' }),
};

export const paymentApi = {
  getByAuctionId: (auctionId: string) => fetchApi(ApiEndpoints.PAYMENTS.BY_AUCTION_ID(auctionId)),
  initiate: (paymentId: string, method: string, shippingInfo?: { addressLine: string; phone: string }) => fetchApi(ApiEndpoints.PAYMENTS.INITIATE(paymentId), {
    method: 'POST',
    body: JSON.stringify({ method, shippingInfo }),
  }),
  decline: (paymentId: string) =>
    fetchApi(ApiEndpoints.PAYMENTS.DECLINE(paymentId), { method: 'POST' }),
  confirmShipping: (paymentId: string) =>
    fetchApi(ApiEndpoints.PAYMENTS.CONFIRM_SHIPPING(paymentId), { method: 'PATCH' }),
  confirmDelivery: (paymentId: string) =>
    fetchApi(ApiEndpoints.PAYMENTS.CONFIRM_DELIVERY(paymentId), { method: 'PATCH' }),
  openDispute: (paymentId: string, reason: string) => fetchApi(ApiEndpoints.PAYMENTS.OPEN_DISPUTE(paymentId), {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
  getDispute: (id: string) => fetchApi(ApiEndpoints.PAYMENTS.GET_DISPUTE(id)),
  getDisputeByAuction: (auctionId: string) => fetchApi(ApiEndpoints.PAYMENTS.GET_DISPUTE_BY_AUCTION(auctionId)),
  respondDispute: (id: string, response: string) => fetchApi(ApiEndpoints.PAYMENTS.RESPOND_DISPUTE(id), {
    method: 'POST',
    body: JSON.stringify({ response }),
  }),
};

export const messageApi = {
  getConversations: (cursor?: string, limit: number = 20) => {
    const qs = new URLSearchParams();
    if (cursor) qs.set('cursor', cursor);
    qs.set('limit', limit.toString());
    return fetchApi(`${ApiEndpoints.MESSAGES.CONVERSATIONS}?${qs.toString()}`);
  },
  getOrCreateConversation: (targetUserId: string) => {
    return fetchApi(ApiEndpoints.MESSAGES.CONVERSATIONS, {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  },
  getMessages: (conversationId: string, cursor?: string, limit: number = 50) => {
    const qs = new URLSearchParams();
    if (cursor) qs.set('cursor', cursor);
    qs.set('limit', limit.toString());
    return fetchApi(`${ApiEndpoints.MESSAGES.GET_MESSAGES(conversationId)}?${qs.toString()}`);
  },
  markAsRead: (conversationId: string) => {
    return fetchApi(ApiEndpoints.MESSAGES.MARK_AS_READ(conversationId), {
      method: 'PATCH',
    });
  },
  getUnreadCount: async (): Promise<number> => {
    const res = await fetchApi(ApiEndpoints.MESSAGES.UNREAD_COUNT);
    return res?.count || 0;
  },
};

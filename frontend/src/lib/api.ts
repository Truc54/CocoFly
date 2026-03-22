export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  
  // Mặc định gọi API kèm credentials để gửi/nhận cookie (refresh token)
  const defaultOptions: RequestInit = {
    credentials: "omit", // tạm thời omit vì backend CORS chưa config allow-credentials hoàn chỉnh cho mọi request, hoặc tùy ý. Đặc tả ghi refresh token dùng cookie HttpOnly, login cũng trả cookie.
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let errorMessage = "Có lỗi xảy ra, vui lòng thử lại sau.";
    if (data) {
      if (Array.isArray(data.message)) {
        errorMessage = data.message.join("\\n");
      } else if (typeof data.message === "string") {
        errorMessage = data.message;
      } else if (data.error) {
        errorMessage = data.error;
      }
    }
    throw new Error(errorMessage);
  }

  return data;
}

export const authApi = {
  register: (data: any) => fetchApi("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: any) => fetchApi("/auth/login", { 
    method: "POST", 
    body: JSON.stringify(data),
    credentials: "omit", // Login/register cơ bản trước
  }),
  verifyOtp: (data: { email: string; otp: string }) => fetchApi("/auth/verify-otp", { method: "POST", body: JSON.stringify(data) }),
  resendOtp: (data: { email: string }) => fetchApi("/auth/resend-otp", { method: "POST", body: JSON.stringify(data) }),
  logout: () => fetchApi("/auth/logout", { method: "POST", credentials: "omit" }),
};

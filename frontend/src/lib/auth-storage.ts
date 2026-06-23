const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";
const REMEMBER_KEY = "remember_me";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REMEMBER_KEY) === "true"
    ? localStorage
    : sessionStorage;
}

export const authStorage = {
  setRememberMe(value: boolean) {
    if (typeof window === "undefined") return;
    if (value) {
      localStorage.setItem(REMEMBER_KEY, "true");
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  },

  save(accessToken: string, user: object, refreshToken?: string) {
    if (typeof window === "undefined") return;
    const storage = getStorage();
    if (storage) {
      storage.setItem(TOKEN_KEY, accessToken);
      storage.setItem(USER_KEY, JSON.stringify(user));
      if (refreshToken) {
        storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    }
  },

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
  },

  saveRefreshToken(refreshToken: string) {
    if (typeof window === "undefined") return;
    const storage = getStorage();
    if (storage) {
      storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  getUser(): object | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },

  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};

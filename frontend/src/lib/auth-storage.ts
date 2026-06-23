const TOKEN_KEY = "access_token";
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

  save(accessToken: string, user: object) {
    if (typeof window === "undefined") return;
    const storage = getStorage();
    if (storage) {
      storage.setItem(TOKEN_KEY, accessToken);
      storage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
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
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};

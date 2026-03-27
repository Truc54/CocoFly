const TOKEN_KEY = "access_token";
const USER_KEY = "user";
const REMEMBER_KEY = "remember_me";

function getStorage(): Storage {
  if (typeof window === "undefined") return localStorage;
  return localStorage.getItem(REMEMBER_KEY) === "true"
    ? localStorage
    : sessionStorage;
}

export const authStorage = {
  setRememberMe(value: boolean) {
    if (value) {
      localStorage.setItem(REMEMBER_KEY, "true");
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  },

  save(accessToken: string, user: object) {
    const storage = getStorage();
    storage.setItem(TOKEN_KEY, accessToken);
    storage.setItem(USER_KEY, JSON.stringify(user));
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },

  getUser(): object | null {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};

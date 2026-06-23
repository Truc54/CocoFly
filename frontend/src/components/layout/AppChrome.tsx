"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut } from "lucide-react";

import HeaderNew from "@/components/layout/HeaderNew";
import FooterNew from "@/components/layout/FooterNew";
import FloatingChatButton from "@/components/message/FloatingChatButton";
import { ToastProvider } from "@/context/ToastContext";
import { authStorage } from "@/lib/auth-storage";
import { authApi, userApi } from "@/lib/api";

type AppChromeProps = {
  children: React.ReactNode;
};

const AUTH_PATHS = new Set([
  "/login",
  "/register",
  "/verify-otp",
  "/verification-success",
  "/forgot-password",
  "/reset-verify-otp",
  "/reset-password",
  "/password-reset-success",
]);

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role?: string;
  accountStatus?: "unverified" | "active" | "suspended" | "banned";
  nonPaymentStrikes?: number;
  banReason?: string | null;
}

export default function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = AUTH_PATHS.has(pathname);
  const isAdminPage = pathname.startsWith("/admin");
  const hideChrome = isAuthPage || isAdminPage;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchProfile = useCallback(async () => {
    let token = authStorage.getToken();
    const refreshToken = authStorage.getRefreshToken();

    if (!token && refreshToken) {
      // Try silent refresh on mount
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const refreshResponse = await fetch(`${apiUrl}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          authStorage.save(refreshData.accessToken, authStorage.getUser() || {}, refreshData.refreshToken);
          token = refreshData.accessToken;
          // Dispatch auth-change so other parts of the app are updated
          window.dispatchEvent(new Event("auth-change"));
        } else {
          // Refresh token expired or revoked
          authStorage.clear();
        }
      } catch (e) {
        console.error("Silent refresh on mount failed:", e);
      }
    }

    if (!token) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const res = await userApi.getMyProfile();
      if (res && res.id) {
        setProfile(res);
      } else if (res?.data) {
        setProfile(res.data);
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.error("Failed to fetch user profile in chrome:", e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchProfile();
    window.addEventListener("auth-change", fetchProfile);
    return () => window.removeEventListener("auth-change", fetchProfile);
  }, [fetchProfile]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error("Failed to call logout API:", e);
    } finally {
      authStorage.clear();
      setProfile(null);
      window.dispatchEvent(new Event("auth-change"));
      router.push("/");
    }
  };

  const isLocked =
    profile &&
    (profile.accountStatus === "banned" ||
      profile.accountStatus === "suspended" ||
      (profile.nonPaymentStrikes ?? 0) >= 3);

  if (mounted && loading && (authStorage.getToken() || authStorage.getRefreshToken())) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-main/20 border-t-primary-main rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest animate-pulse">
            Đang tải...
          </span>
        </div>
      </div>
    );
  }

  if (isLocked) {
    const defaultReason = "Tài khoản của bạn đã vi phạm chính sách giao dịch hoặc nhận quá số gậy vi phạm tối đa cho phép (3 gậy không thanh toán).";
    const displayReason = profile.banReason || defaultReason;

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 select-none">
        <div className="w-full max-w-md bg-white border-2 border-primary-main shadow-[6px_6px_0px_#E2B9A1] p-8 md:p-10 rounded-2xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-500 ease-out">
          {/* Logo */}
          <div className="relative w-16 h-16 hover:scale-105 transition-transform duration-300">
            <Image
              src="/logo.png"
              alt="CocoFly Logo"
              width={64}
              height={64}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold font-brand uppercase text-red-600 text-center tracking-wide mt-6">
            Tài khoản bị khóa
          </h1>

          <p className="text-slate-500 text-sm text-center mt-2 font-medium">
            Tài khoản của bạn hiện đang bị tạm khóa và đình chỉ hoạt động.
          </p>

          {/* Reason Block */}
          <div className="w-full mt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left mb-1.5">Lý do khóa tài khoản:</h2>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed font-medium text-left">
              {displayReason}
            </div>
          </div>

          {/* Support notice */}
          <p className="text-xs text-slate-400 text-center mt-5 leading-normal">
            Nếu bạn tin rằng đây là một sự nhầm lẫn, vui lòng liên hệ với ban quản trị hoặc bộ phận hỗ trợ của CocoFly để được giải quyết.
          </p>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full mt-8 border-2 border-primary-main bg-primary-main text-white rounded-xl py-3 font-bold hover:bg-primary-main/90 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#E2B9A1] active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      {!hideChrome && <HeaderNew />}
      <main className={hideChrome ? "min-h-dvh" : "grow"}>{children}</main>
      {!hideChrome && <FooterNew />}
      {!hideChrome && <FloatingChatButton />}
    </ToastProvider>
  );
}

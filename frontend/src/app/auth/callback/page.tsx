"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authStorage } from "@/lib/auth-storage";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const userStr = searchParams.get("user");
    const errorMessage = searchParams.get("error");

    if (errorMessage) {
      router.push(`/login?error=${encodeURIComponent(errorMessage)}`);
      return;
    }

    if (accessToken) {
      let user = {};
      if (userStr) {
        try { user = JSON.parse(userStr); } catch {}
      }
      // OAuth login always persists (remember me = true)
      authStorage.setRememberMe(true);
      authStorage.save(accessToken, user);
    }

    if (accessToken) {
      // Dispatch event to update the Header immediately
      window.dispatchEvent(new Event("auth-change"));
      // Redirect to home page smoothly
      router.push("/");
    } else {
      router.push("/login?error=auth_failed");
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-background-dark">
      <div className="flex flex-col items-center gap-4">
        {/* Simple spinner */}
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}

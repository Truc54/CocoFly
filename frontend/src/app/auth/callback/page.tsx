"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authStorage } from "@/lib/auth-storage";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const userStr = searchParams.get("user");
    const errorMessage = searchParams.get("error");
    const redirectUrl = searchParams.get("redirect");

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
      authStorage.save(accessToken, user, refreshToken || undefined);
    }

    if (accessToken) {
      // Dispatch event to update the Header immediately
      window.dispatchEvent(new Event("auth-change"));
      // Redirect to target page or home page smoothly
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push("/");
      }
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

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-[#8f5c38] border-t-transparent animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Đang tải...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // We only want this logic to run on the client, inside useEffect
    const accessToken = searchParams.get("accessToken");
    const userStr = searchParams.get("user");
    const errorMessage = searchParams.get("error");

    if (errorMessage) {
      router.push(`/login?error=${encodeURIComponent(errorMessage)}`);
      return;
    }

    if (accessToken) {
      localStorage.setItem("access_token", accessToken);
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        localStorage.setItem("user", JSON.stringify(user));
      } catch (e) {
        // failed to parse user
      }
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

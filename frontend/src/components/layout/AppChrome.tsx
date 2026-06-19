"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import HeaderNew from "@/components/layout/HeaderNew";
import FooterNew from "@/components/layout/FooterNew";
import FloatingChatButton from "@/components/message/FloatingChatButton";
import { ToastProvider } from "@/context/ToastContext";

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

export default function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.has(pathname);
  const isAdminPage = pathname.startsWith("/admin");
  const hideChrome = isAuthPage || isAdminPage;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <ToastProvider>
      {!hideChrome && <HeaderNew />}
      <main className={hideChrome ? "min-h-dvh" : "grow"}>{children}</main>
      {!hideChrome && <FooterNew />}
      {!hideChrome && <FloatingChatButton />}
    </ToastProvider>
  );
}

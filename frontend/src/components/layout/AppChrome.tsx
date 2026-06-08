"use client";

import { usePathname } from "next/navigation";

import HeaderNew from "@/components/layout/HeaderNew";
import FooterNew from "@/components/layout/FooterNew";
import FloatingChatButton from "@/components/message/FloatingChatButton";

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

  return (
    <>
      {!isAuthPage && <HeaderNew />}
      <main className={isAuthPage ? "min-h-dvh" : "grow"}>{children}</main>
      {!isAuthPage && <FooterNew />}
      {!isAuthPage && <FloatingChatButton />}
    </>
  );
}

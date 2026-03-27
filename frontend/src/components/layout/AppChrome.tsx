"use client";

import { usePathname } from "next/navigation";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
      {!isAuthPage && <Header />}
      <main className={isAuthPage ? "min-h-dvh" : "grow"}>{children}</main>
      {!isAuthPage && <Footer />}
    </>
  );
}

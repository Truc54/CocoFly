"use client";

import { usePathname } from "next/navigation";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

type AppChromeProps = {
  children: React.ReactNode;
};

const AUTH_PATHS = new Set(["/login", "/register"]);

export default function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.has(pathname);

  return (
    <>
      {!isAuthPage && <Header />}
      <main className={isAuthPage ? "min-h-screen" : "flex-grow"}>{children}</main>
      {!isAuthPage && <Footer />}
    </>
  );
}

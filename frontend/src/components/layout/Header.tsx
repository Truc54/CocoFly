"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Bell, Plus } from "lucide-react";
import { authStorage } from "@/lib/auth-storage";
import AccountDropdown from "@/components/account/AccountDropdown";

const NAV_LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/live", label: "Đấu giá đang diễn ra" },
  { href: "/upcoming", label: "Sắp diễn ra" },
  { href: "/how-it-works", label: "Cách hoạt động" },
];

export default function Header() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const checkAuth = () => {
      const token = authStorage.getToken();
      setIsLoggedIn(!!token);
      const user = authStorage.getUser() as { role?: string } | null;
      setUserRole(user?.role || null);
    };
    checkAuth();
    window.addEventListener("auth-change", checkAuth);
    return () => window.removeEventListener("auth-change", checkAuth);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-background-dark border-b border-primary/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <Image
            src="/logo.png"
            alt="CocoFly Logo"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <span className="brand-text text-[2rem] leading-none text-primary">CocoFly</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          {(userRole === "seller"
            ? [
                NAV_LINKS[0],
                { href: "/create-auction", label: "Tạo đấu giá" },
                ...NAV_LINKS.slice(1)
              ]
            : NAV_LINKS
          ).map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm font-semibold cursor-pointer transition-colors duration-200 pb-1 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300 ${
                  isActive
                    ? "text-primary after:w-full"
                    : "hover:text-primary after:w-0 hover:after:w-full"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {!mounted ? (
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          ) : isLoggedIn ? (
            <>
              {/* Notification Bell */}
              <button
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                aria-label="Thông báo"
              >
                <Bell className="w-[18px] h-[18px] text-foreground/70" />
                {/* Unread dot */}
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-white dark:ring-background-dark" />
              </button>

              {/* Account Dropdown (tự quản lý state, logout, navigation) */}
              <AccountDropdown />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-5 py-2 text-sm font-bold text-primary bg-white dark:bg-slate-800 border-2 border-primary rounded-xl hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0px_#E2B9A1] hover:shadow-[3px_3px_0px_#E2B9A1] active:shadow-[1px_1px_0px_#E2B9A1] cursor-pointer"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className={`px-5 py-2 text-sm font-bold rounded-xl border-2 border-primary transition-all duration-200 cursor-pointer shadow-[2px_2px_0px_#E2B9A1] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#E2B9A1] active:translate-y-px active:shadow-[1px_1px_0px_#E2B9A1] ${
                  pathname === "/register"
                    ? "bg-primary/90 text-white"
                    : "bg-primary text-white"
                }`}
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

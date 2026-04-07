"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { authApi } from "@/lib/api";
import { authStorage } from "@/lib/auth-storage";
import { LogOut, Settings } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/live", label: "Đấu giá đang diễn ra" },
  { href: "/upcoming", label: "Sắp diễn ra" },
  { href: "/how-it-works", label: "Cách hoạt động" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ fullName?: string; email?: string; avatar?: string; avatarUrl?: string; role?: string } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const checkUser = () => {
      try {
        const storedUser = authStorage.getUser() as { fullName?: string; email?: string; avatar?: string; avatarUrl?: string; role?: string } | null;
        const accessToken = authStorage.getToken();

        if (storedUser) {
          setUser(storedUser);
        } else if (accessToken) {
          try {
            const payload = JSON.parse(atob(accessToken.split('.')[1]));
            setUser({ email: payload.email, fullName: payload.fullName || "Người dùng", role: payload.role });
          } catch {
            setUser({ fullName: "Người dùng" });
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };
    checkUser();
    window.addEventListener("auth-change", checkUser);
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("auth-change", checkUser);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error(e);
    } finally {
      authStorage.clear();
      setUser(null);
      window.dispatchEvent(new Event("auth-change"));
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-background-dark border-b border-primary/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <Image
            src="/logo.jpeg"
            alt="COCOFLY Logo"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <span className="brand-text text-[2rem] leading-none text-primary">COCOFLY</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          {NAV_LINKS.map((link) => {
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

        <div className="flex items-center gap-3">
          {!mounted ? (
            <div className="w-24 h-10 border border-slate-200 rounded-xl" /> // Skeleton roughly size of logic
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label="User Menu"
              >
                <Image
                  src={user.avatarUrl || user.avatar || "/default-avatar.svg"}
                  alt={user.fullName || "User Avatar"}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {user.fullName || "Người dùng"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user.email || ""}</p>
                  </div>
                  
                  <Link
                    href="/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    Cài đặt
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className={`px-5 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  pathname === "/login"
                    ? "bg-primary/10 text-primary"
                    : "text-slate-700 dark:text-slate-200 hover:bg-primary/5 dark:hover:bg-primary/20"
                }`}
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className={`px-5 py-2 text-sm font-bold rounded-none border-2 border-primary transition-all duration-200 cursor-pointer shadow-[2px_2px_0px_#E2B9A1] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#E2B9A1] active:translate-y-px active:shadow-[1px_1px_0px_#E2B9A1] ${
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

"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  Heart,
  ArrowUpCircle,
  Settings,
  LogOut,
  Gavel,
  LayoutDashboard,
} from "lucide-react";
import { authApi, userApi } from "@/lib/api";
import { authStorage } from "@/lib/auth-storage";

// ─── Types ───────────────────────────────────────────────────────────────────
export type UserRole = "buyer" | "seller" | "admin";

export interface AccountUser {
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  avatar?: string;
  role?: UserRole;
  rating?: number;
  totalReviews?: number;
}

// ─── Mock Data (sẽ thay bằng API thực tế sau) ───────────────────────────────
const MOCK_COUNTS = {
  activeAuctions: 2,
  watchlist: 3,
  orders: 1,
};

// ─── Role Badge Component ────────────────────────────────────────────────────
function RoleBadge({ role }: { role: UserRole }) {
  /** Hiển thị label role hiện tại với màu phân biệt */
  const config = {
    buyer: {
      label: "BUYER",
      className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    seller: {
      label: "SELLER",
      className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    admin: {
      label: "ADMIN",
      className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
  };
  const c = config[role] || config.buyer;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-md border ${c.className}`}
    >
      {c.label}
    </span>
  );
}

// ─── Menu Item Component ─────────────────────────────────────────────────────
interface MenuItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  highlight?: boolean;
  onClick?: () => void;
}

function MenuItem({ href, icon, label, badge, highlight, onClick }: MenuItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150
        ${highlight
          ? "text-foreground/80 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
          : "text-foreground/80 hover:bg-muted dark:hover:bg-muted/50"
        }`}
    >
      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>

      {/* Badge số lượng */}
      {badge !== undefined && badge > 0 && (
        <span className="flex-shrink-0 min-w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

// ─── Separator ───────────────────────────────────────────────────────────────
function MenuSeparator() {
  return <div className="my-1.5 mx-3 h-px bg-border" />;
}

// ─── Section Label ───────────────────────────────────────────────────────────
function MenuSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-2 pb-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        {children}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function AccountDropdown() {
  const router = useRouter();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Hydration + load user ──────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const checkUser = async () => {
      try {
        const storedUser = authStorage.getUser() as AccountUser | null;
        const accessToken = authStorage.getToken();

        let initialUser: AccountUser | null = null;

        if (storedUser) {
          // Use stored user but default to 0 for rating/reviews initially
          initialUser = {
            ...storedUser,
            rating: storedUser.rating ?? 0,
            totalReviews: storedUser.totalReviews ?? 0,
          };
        } else if (accessToken) {
          try {
            const payload = JSON.parse(atob(accessToken.split(".")[1]));
            initialUser = {
              email: payload.email,
              fullName: payload.fullName || "Người dùng",
              role: payload.role || "buyer",
              rating: 0,
              totalReviews: 0,
            };
          } catch {
            initialUser = { fullName: "Người dùng", role: "buyer", rating: 0, totalReviews: 0 };
          }
        }

        setUser(initialUser);

        // Fetch real data to override the stats
        if (accessToken) {
          try {
            const res = await userApi.getMyProfile();
            if (res.data) {
              setUser(prev => prev ? {
                ...prev,
                rating: res.data.rating || 0,
                totalReviews: res.data.totalReviews || 0,
                avatarUrl: res.data.avatarUrl || res.data.avatar || prev.avatarUrl
              } : null);
            }
          } catch (e) {
            console.error("Failed to load user profile stats for dropdown", e);
          }
        }
      } catch {
        setUser(null);
      }
    };
    checkUser();
    window.addEventListener("auth-change", checkUser);
    return () => window.removeEventListener("auth-change", checkUser);
  }, []);

  // ── Click outside to close ─────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // ── Escape key to close ────────────────────────────────────────────────────
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  // ── Logout handler ─────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setIsOpen(false);
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

  const closeMenu = () => setIsOpen(false);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (!mounted) {
    return <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />;
  }

  // ── Not logged in: render nothing (Header handles login/register buttons) ─
  if (!user) return null;

  const role = (user.role || "buyer").toLowerCase() as UserRole;
  const isBuyer = role === "buyer";
  const avatarSrc = user.avatarUrl || user.avatar || "/default-avatar.svg";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Trigger Button ──────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full p-0.5 border-2 border-transparent hover:border-primary/30 focus:border-primary/50 focus:outline-none transition-all duration-200"
        aria-label="Mở menu tài khoản"
        aria-expanded={isOpen}
      >
        <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/20">
          <Image
            src={avatarSrc}
            alt={user.fullName || "Avatar"}
            width={36}
            height={36}
            className="w-full h-full object-cover"
          />
          {/* Online indicator */}
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-background-dark" />
        </div>
      </button>

      {/* ── Dropdown Panel ──────────────────────────────────────────────── */}
      {isOpen && (
        <>
          {/* Invisible overlay for mobile */}
          <div className="fixed inset-0 z-40 md:hidden" onClick={closeMenu} />

          <div
            className="absolute right-0 mt-2 w-72 z-50
              bg-white dark:bg-card rounded-2xl
              border border-border shadow-xl shadow-black/10 dark:shadow-black/30
              overflow-hidden
              animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200"
          >
            {/* ── User Info Header ──────────────────────────────────────── */}
            <Link
              href="/profile"
              onClick={closeMenu}
              className="group block px-4 pt-4 pb-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0 w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/20">
                  <Image
                    src={avatarSrc}
                    alt={user.fullName || "Avatar"}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user.fullName || "Người dùng"}
                    </p>
                    <RoleBadge role={role} />
                  </div>

                  {/* Reputation Score */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-semibold text-foreground/80">
                      {user.rating?.toFixed(1) || "0.0"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {user.totalReviews || 0} đánh giá
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            <MenuSeparator />

            {/* ── Hoạt động ─────────────────────────────────────────────── */}
            <MenuSectionLabel>Hoạt động</MenuSectionLabel>
            <MenuItem
              href="/won-auctions"
              icon={<Gavel className="w-4 h-4" />}
              label="Sản phẩm đã đấu giá"
              onClick={closeMenu}
            />
            {role === "seller" && (
              <MenuItem
                href="/manage-auctions"
                icon={<LayoutDashboard className="w-4 h-4" />}
                label="Quản lý đấu giá"
                onClick={closeMenu}
              />
            )}
            <MenuItem
              href="/watchlist"
              icon={<Heart className="w-4 h-4" />}
              label="Đấu giá yêu thích"
              onClick={closeMenu}
            />

            {/* ── Nâng cấp tài khoản (chỉ hiện nếu là BUYER) ───────────── */}
            {isBuyer && (
              <>
                <MenuSeparator />
                <MenuSectionLabel>Xác thực</MenuSectionLabel>
                <MenuItem
                  href="/upgrade"
                  icon={<ArrowUpCircle className="w-4 h-4" />}
                  label="Nâng cấp tài khoản"
                  highlight
                  onClick={closeMenu}
                />
              </>
            )}

            <MenuSeparator />

            {/* ── Cài đặt ───────────────────────────────────────────────── */}
            <MenuSectionLabel>Cài đặt</MenuSectionLabel>
            <MenuItem
              href="/settings"
              icon={<Settings className="w-4 h-4" />}
              label="Cài đặt & Bảo mật"
              onClick={closeMenu}
            />

            <MenuSeparator />

            {/* ── Đăng xuất ─────────────────────────────────────────────── */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>

            {/* Bottom padding */}
            <div className="h-1.5" />
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Bell, Plus, Search, Menu, X } from "lucide-react";
import { authStorage } from "@/lib/auth-storage";
import { categoryApi } from "@/lib/api";
import AccountDropdown from "@/components/account/AccountDropdown";

interface CategoryLink {
  id: number;
  name: string;
  slug: string;
}

function normalizeCategoryName(name?: string) {
  return (name || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function isRealEstateCategory(cat: CategoryLink) {
  const name = normalizeCategoryName(cat.name);
  const slug = (cat.slug || "").toLowerCase().trim();
  return name.includes("bất động sản") || name.includes("bat dong san") || slug.includes("bat-dong-san") || slug === "bds";
}

export default function HeaderNew() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<CategoryLink[]>([]);
  const [unreadCount] = useState(3); // mock
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Fetch categories for shortcuts
  useEffect(() => {
    categoryApi
      .getAll()
      .then((res) => {
        if (res?.data) {
          const filtered = res.data.filter((cat: CategoryLink) => !isRealEstateCategory(cat));
          setCategories(filtered.slice(0, 9));
        }
      })
      .catch(() => {
        // Fallback mock
        const fallback = [
          { id: 3, name: "Cổ vật & Sưu tầm", slug: "co-vat-suu-tam" },
          { id: 7, name: "Rượu vang & Đồ uống", slug: "ruou-vang-do-uong" },
          { id: 5, name: "Xe & Phương tiện", slug: "xe-phuong-tien" },
          { id: 4, name: "Nghệ thuật", slug: "nghe-thuat" },
          { id: 6, name: "Đồng hồ & Trang sức", slug: "dong-ho-trang-suc" },
          { id: 1, name: "Công nghệ", slug: "cong-nghe" },
          { id: 2, name: "Thời trang & Phụ kiện", slug: "thoi-trang-phu-kien" },
          { id: 13, name: "Máy ảnh & Ống kính", slug: "may-anh-ong-kinh" },
        ];
        setCategories(fallback.filter((cat) => !isRealEstateCategory(cat)).slice(0, 9));
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/live?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-700/50 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_auto] items-center gap-x-2 md:gap-x-2.5 lg:gap-x-3 gap-y-1 pt-4 pb-1">
          <div className="row-start-1 col-start-1 flex items-center gap-2 lg:gap-3 min-w-0">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image
                src="/logo.jpeg"
                alt="COCOFLY Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="brand-text text-[1.8rem] leading-none text-primary hidden sm:block">
                COCOFLY
              </span>
            </Link>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="row-start-1 col-start-2 w-full min-w-0 justify-self-stretch">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-1 py-1 shadow-[3px_3px_0px_#E2B9A1] transition-all">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm phiên đấu giá, sản phẩm..."
                className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-primary-main bg-primary-main px-3 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_#E2B9A1] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#E2B9A1] shrink-0"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Tìm kiếm</span>
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="row-start-1 col-start-3 flex items-center justify-end gap-1.5 lg:gap-2 min-w-0 shrink-0">

            {/* Notification bell */}
            {mounted && isLoggedIn && (
              <button
                className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Thông báo"
              >
                <Bell className="w-[18px] h-[18px] text-slate-600 dark:text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 ring-2 ring-white dark:ring-background-dark">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Tạo đấu giá — chỉ hiện khi seller */}
            {mounted && isLoggedIn && userRole === "seller" && (
              <Link
                href="/create-auction"
                className="hidden md:inline-flex items-center gap-1.5 rounded-lg border-2 border-primary-main bg-primary-main px-3 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_#E2B9A1] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#E2B9A1]"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo đấu giá</span>
              </Link>
            )}

            {/* Auth */}
            {!mounted ? (
              <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />
            ) : isLoggedIn ? (
              <AccountDropdown />
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                Đăng nhập
              </Link>
            )}
          </div>

          {/* ── Category shortcuts ─────────────────────────────────── */}
          <div className="row-start-2 col-start-2">
            <div className="flex flex-wrap items-center justify-start gap-1.5 pb-0.5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/live?categoryId=${cat.id}`}
                  className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors whitespace-nowrap px-2 py-0.5 rounded-md"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile menu overlay ─────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[72px] z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <nav
            className="bg-white dark:bg-background-dark w-72 h-full shadow-xl overflow-y-auto animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Danh mục</p>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/live?categoryId=${cat.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="p-4">
              {mounted && isLoggedIn && userRole === "seller" && (
                <Link
                  href="/create-auction"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-primary rounded-lg hover:bg-primary/5"
                >
                  <Plus className="w-4 h-4" />
                  Tạo đấu giá
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

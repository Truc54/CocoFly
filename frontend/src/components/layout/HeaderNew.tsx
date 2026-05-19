"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Plus, Search, Menu, X } from "lucide-react";
import { authStorage } from "@/lib/auth-storage";
import { categoryApi, auctionApi } from "@/lib/api";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useSearchHistory } from "@/lib/hooks/useSearchHistory";
import AccountDropdown from "@/components/account/AccountDropdown";
import SearchSuggestionDropdown from "@/components/layout/SearchSuggestionDropdown";
import NotificationDropdown from "@/components/layout/NotificationDropdown";

interface CategoryLink {
  id: number;
  name: string;
  slug: string;
}

interface SuggestionItem {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  currentPrice?: number;
  scheduledStart?: string;
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
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<CategoryLink[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Search Suggestions State ──
  const [searchStatus, setSearchStatus] = useState<"active" | "scheduled">("active");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();

  // ── Default toggle based on current page ──
  useEffect(() => {
    if (pathname.startsWith("/upcoming")) {
      setSearchStatus("scheduled");
    } else if (pathname.startsWith("/live")) {
      setSearchStatus("active");
    }
  }, [pathname]);

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

  // ── Fetch suggestions when debounced query changes ──
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    setIsLoadingSuggestions(true);

    auctionApi
      .getSuggestions(trimmed, searchStatus, 8)
      .then((res) => {
        if (!cancelled && res?.data) {
          setSuggestions(res.data);
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSuggestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, searchStatus]);

  // ── Click outside to close dropdowns ──
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Keyboard: Escape to close ──
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Search submit (Enter / button) → listing page ──
  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      addToHistory(trimmed);
      setDropdownOpen(false);

      const targetPage = searchStatus === "scheduled" ? "/upcoming" : "/live";
      router.push(`${targetPage}?search=${encodeURIComponent(trimmed)}`);
      setSearchQuery("");
    },
    [searchQuery, searchStatus, addToHistory, router]
  );

  // ── Click a suggestion → auction detail page ──
  const handleSelectSuggestion = useCallback(
    (suggestion: SuggestionItem) => {
      addToHistory(searchQuery.trim());
      setDropdownOpen(false);
      setSearchQuery("");
      router.push(`/auction/${suggestion.id}`);
    },
    [searchQuery, addToHistory, router]
  );

  // ── Click a history item → fill input and search ──
  const handleSelectHistory = useCallback(
    (term: string) => {
      setSearchQuery(term);
      addToHistory(term);
      setDropdownOpen(false);

      const targetPage = searchStatus === "scheduled" ? "/upcoming" : "/live";
      router.push(`${targetPage}?search=${encodeURIComponent(term)}`);
      setSearchQuery("");
    },
    [searchStatus, addToHistory, router]
  );

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

          {/* ── Search bar with toggle + suggestions ── */}
          <div ref={searchWrapperRef} className="row-start-1 col-start-2 w-full min-w-0 justify-self-stretch relative">
            <form onSubmit={handleSearch}>
              <div className="flex items-center bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-1 py-1 shadow-[3px_3px_0px_#E2B9A1] transition-all">
                {/* Status Toggle Dropdown */}
                <div className="hidden sm:block relative ml-1 shrink-0 z-[60]">
                  <button
                    type="button"
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    className="flex items-center justify-center gap-1.5 w-[125px] px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-lg hover:border-primary/50 hover:text-primary transition-all whitespace-nowrap"
                  >
                    <span>{searchStatus === "active" ? "Đang diễn ra" : "Sắp diễn ra"}</span>
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </button>
                  
                  {statusDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-36 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg shadow-[3px_3px_0px_#E2B9A1] overflow-hidden z-[60]">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchStatus("active");
                          setStatusDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors ${
                          searchStatus === "active" 
                            ? "bg-primary/10 text-primary" 
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        Đang diễn ra
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchStatus("scheduled");
                          setStatusDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors ${
                          searchStatus === "scheduled" 
                            ? "bg-primary/10 text-primary" 
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        Sắp diễn ra
                      </button>
                    </div>
                  )}
                </div>

                {/* Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    setDropdownOpen(true);
                    setStatusDropdownOpen(false);
                  }}
                  placeholder="Tìm phiên đấu giá, sản phẩm..."
                  className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-slate-400 min-w-0"
                />

                {/* Search Button */}
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg border-2 border-primary-main bg-primary-main px-3 py-2 text-sm font-bold text-white shadow-[2px_2px_0px_#E2B9A1] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#E2B9A1] shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Tìm kiếm</span>
                </button>
              </div>
            </form>

            {/* Dropdown */}
            <SearchSuggestionDropdown
              isOpen={dropdownOpen}
              suggestions={suggestions}
              history={history}
              isLoading={isLoadingSuggestions || searchQuery !== debouncedQuery}
              query={searchQuery}
              searchStatus={searchStatus}
              onSelectSuggestion={handleSelectSuggestion}
              onSelectHistory={handleSelectHistory}
              onRemoveHistory={removeFromHistory}
              onClearHistory={clearHistory}
            />
          </div>

          {/* Right actions */}
          <div className="row-start-1 col-start-3 flex items-center justify-end gap-1.5 lg:gap-2 min-w-0 shrink-0">

            {/* Notification bell */}
            {mounted && isLoggedIn && (
              <NotificationDropdown />
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
            {/* Mobile status toggle */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Tìm kiếm theo</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSearchStatus("active")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 transition-all ${
                    searchStatus === "active"
                      ? "bg-primary text-white border-primary"
                      : "text-slate-500 border-slate-200 dark:border-slate-600"
                  }`}
                >
                  Đang diễn ra
                </button>
                <button
                  onClick={() => setSearchStatus("scheduled")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 transition-all ${
                    searchStatus === "scheduled"
                      ? "bg-primary text-white border-primary"
                      : "text-slate-500 border-slate-200 dark:border-slate-600"
                  }`}
                >
                  Sắp diễn ra
                </button>
              </div>
            </div>

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

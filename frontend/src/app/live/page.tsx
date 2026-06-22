"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { auctionApi, categoryApi } from "@/lib/api";
import { getCategoryImageUrl } from "@/lib/categoryImages";

interface AuctionItem {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  category: { id: number; name: string } | null;
  condition: string;
  location: string;
  currentPrice: number;
  startingPrice: number;
  bidIncrement: number;
  endTime: string;
  totalBids: number;
  totalWatchers: number;
  seller: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    rating: number;
  } | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  iconUrl: string | null;
}

function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function parseNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getHoursLeft(endTime: string, nowMs: number): number {
  const diffMs = new Date(endTime).getTime() - nowMs;
  return diffMs <= 0 ? 0 : diffMs / 3600000;
}

function useCountdown(endTimes: string[]) {
  const [timeLefts, setTimeLefts] = useState<string[]>([]);
  const endTimesKey = JSON.stringify(endTimes);

  useEffect(() => {
    const times: string[] = JSON.parse(endTimesKey);
    if (times.length === 0) { setTimeLefts([]); return; }

    function calc() {
      return times.map((endTime: string) => {
        const diff = new Date(endTime).getTime() - Date.now();
        if (diff <= 0) return "00:00:00";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = String(Math.floor((diff % (1000 * 60 * 60 * 24)) / 3600000)).padStart(2, "0");
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
        if (days > 0) {
          return `${days}d ${h}:${m}:${s}`;
        }
        return `${h}:${m}:${s}`;
      });
    }
    setTimeLefts(calc());
    const timer = setInterval(() => setTimeLefts(calc()), 1000);
    return () => clearInterval(timer);
  }, [endTimesKey]);

  return timeLefts;
}

function LiveAuctionsPageContent() {
  const searchParams = useSearchParams();
  const urlCategoryId = searchParams.get("categoryId");
  const urlSort = searchParams.get("sort");
  const urlSearch = searchParams.get("search");

  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>(
    urlCategoryId ? parseInt(urlCategoryId) : undefined
  );
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const laptopIndex = categories.findIndex((c) => c.slug === "laptop-may-vi-tinh");
  const displayedCategories = laptopIndex !== -1 ? categories.slice(0, laptopIndex + 1) : categories;
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState(urlSort || "ending_soon");
  const [searchKeyword, setSearchKeyword] = useState(urlSearch || "");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [hoursLeft, setHoursLeft] = useState("");
  const [pendingRating, setPendingRating] = useState(0);
  const [pendingMinPrice, setPendingMinPrice] = useState("");
  const [pendingMaxPrice, setPendingMaxPrice] = useState("");
  const [pendingHoursLeft, setPendingHoursLeft] = useState("");

  // Sync URL params on mount
  useEffect(() => {
    if (urlCategoryId) setActiveCategoryId(parseInt(urlCategoryId));
    if (urlSort) setSort(urlSort);
    setSearchKeyword(urlSearch || "");
  }, [urlCategoryId, urlSort, urlSearch]);

  // Fetch categories for sidebar
  useEffect(() => {
    categoryApi.getAll().then((res) => {
      if (res?.data) setCategories(res.data);
    }).catch(() => {});
  }, []);

  const fetchAuctions = useCallback(async (page: number) => {
    try {
      if (page === 1) {
        if (!loading) setIsRefetching(true);
        else setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const res = await auctionApi.getLive({
        page,
        limit: 15,
        categoryId: activeCategoryId,
        sort,
        search: searchKeyword || undefined,
      });

      const { auctions: data, pagination: pag } = res.data;
      setAuctions(data);
      setPagination(pag);

      // Scroll smoothly back to top of listings on page change
      if (page > 1) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách đấu giá");
    } finally {
      setLoading(false);
      setIsRefetching(false);
      setLoadingMore(false);
    }
  }, [activeCategoryId, sort, searchKeyword, loading]);

  useEffect(() => {
    fetchAuctions(1);
  }, [activeCategoryId, sort, searchKeyword]);

  const endTimes = useMemo(() => auctions.map((a) => a.endTime), [auctions]);
  const timeLefts = useCountdown(endTimes);
  const timeLeftsById = useMemo(
    () => new Map(auctions.map((auction, index) => [auction.id, timeLefts[index]])),
    [auctions, timeLefts]
  );

  const filteredAuctions = useMemo(() => {
    const minPriceValue = parseNumber(minPrice);
    const maxPriceValue = parseNumber(maxPrice);
    const hoursValue = parseNumber(hoursLeft);
    const nowMs = Date.now();

    return auctions.filter((auction) => {
      const sellerRating = auction.seller?.rating ?? 0;
      if (ratingFilter > 0 && sellerRating < ratingFilter) return false;
      if (minPriceValue !== undefined && auction.currentPrice < minPriceValue) return false;
      if (maxPriceValue !== undefined && auction.currentPrice > maxPriceValue) return false;

      if (hoursValue !== undefined) {
        const actualHoursLeft = getHoursLeft(auction.endTime, nowMs);
        if (actualHoursLeft > hoursValue) return false;
      }

      return true;
    });
  }, [auctions, ratingFilter, minPrice, maxPrice, hoursLeft]);

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const { page, totalPages } = pagination;
    const pages = [];

    const range = 2;
    let start = Math.max(1, page - range);
    let end = Math.min(totalPages, page + range);

    if (page <= range) {
      end = Math.min(totalPages, range * 2 + 1);
    }
    if (page > totalPages - range) {
      start = Math.max(1, totalPages - range * 2);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-1.5 mt-10">
        <button
          onClick={() => page > 1 && fetchAuctions(page - 1)}
          disabled={page === 1 || loadingMore || isRefetching}
          className="flex items-center justify-center w-10 h-10 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:border-orange-400 hover:text-orange-500 disabled:opacity-40 disabled:cursor-default disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition-all cursor-pointer font-bold"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>

        {start > 1 && (
          <>
            <button
              onClick={() => fetchAuctions(1)}
              className="flex items-center justify-center w-10 h-10 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:border-orange-400 hover:text-orange-500 transition-all cursor-pointer font-bold"
            >
              1
            </button>
            {start > 2 && (
              <span className="w-8 text-center text-slate-400 dark:text-slate-600 font-bold">...</span>
            )}
          </>
        )}

        {pages.map((p) => {
          const isActive = p === page;
          return (
            <button
              key={p}
              onClick={() => !isActive && fetchAuctions(p)}
              disabled={loadingMore || isRefetching}
              className={`flex items-center justify-center w-10 h-10 border-2 rounded-xl transition-all cursor-pointer font-bold ${
                isActive
                  ? "border-orange-400 bg-orange-400/10 text-orange-600 shadow-[3px_3px_0px_#fed7aa]"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-400 hover:text-orange-500"
              }`}
            >
              {p}
            </button>
          );
        })}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && (
              <span className="w-8 text-center text-slate-400 dark:text-slate-600 font-bold">...</span>
            )}
            <button
              onClick={() => fetchAuctions(totalPages)}
              className="flex items-center justify-center w-10 h-10 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:border-orange-400 hover:text-orange-500 transition-all cursor-pointer font-bold"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => page < totalPages && fetchAuctions(page + 1)}
          disabled={page === totalPages || loadingMore || isRefetching}
          className="flex items-center justify-center w-10 h-10 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:border-orange-400 hover:text-orange-500 disabled:opacity-40 disabled:cursor-default disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition-all cursor-pointer font-bold"
        >
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>
    );
  };

  const handleResetFilters = () => {
    setRatingFilter(0);
    setMinPrice("");
    setMaxPrice("");
    setHoursLeft("");
    setPendingRating(0);
    setPendingMinPrice("");
    setPendingMaxPrice("");
    setPendingHoursLeft("");
  };

  const handleApplyFilters = () => {
    setRatingFilter(pendingRating);
    setMinPrice(pendingMinPrice);
    setMaxPrice(pendingMaxPrice);
    setHoursLeft(pendingHoursLeft);
  };

  const ratingOptions = [
    { value: 5, label: "5" },
    { value: 4.5, label: "4.5+" },
    { value: 4, label: "4+" },
    { value: 3.5, label: "3.5+" },
    { value: 3, label: "3+" },
  ];

  const hasPendingChanges =
    pendingRating !== ratingFilter ||
    pendingMinPrice.trim() !== minPrice.trim() ||
    pendingMaxPrice.trim() !== maxPrice.trim() ||
    pendingHoursLeft.trim() !== hoursLeft.trim();

  const hasActiveFilters = Boolean(
    ratingFilter > 0 ||
    minPrice.trim() ||
    maxPrice.trim() ||
    hoursLeft.trim() ||
    pendingRating > 0 ||
    pendingMinPrice.trim() ||
    pendingMaxPrice.trim() ||
    pendingHoursLeft.trim()
  );

  const renderFilterFields = () => (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <span className="material-symbols-outlined text-base text-amber-500">star</span>
          Đánh giá người bán
        </div>
        <div className="grid gap-1.5">
          {ratingOptions.map((option) => {
            const isActive = pendingRating === option.value;
            const starCount = option.value;
            const fullStars = Math.floor(starCount);
            const hasHalf = starCount % 1 !== 0;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPendingRating(option.value)}
                aria-pressed={isActive}
                className={`group flex items-center justify-between gap-4 px-3 py-2.5 border-2 rounded-xl text-sm font-semibold transition-all duration-200 w-full ${
                  isActive
                    ? "border-primary bg-primary/5 text-primary shadow-[3px_3px_0px_#E2B9A1]"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/50 hover:bg-primary/5 hover:shadow-[2px_2px_0px_#E2B9A1]"
                }`}
              >
                <div className="flex items-center gap-0.5 shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const filled = i < fullStars;
                    const half = !filled && hasHalf && i === fullStars;
                    return (
                      <span
                        key={i}
                        className={`material-symbols-outlined text-sm transition-colors ${
                          filled || half ? "text-amber-400" : "text-slate-300 dark:text-slate-600"
                        }`}
                        style={{ fontVariationSettings: filled ? "'FILL' 1" : half ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {half ? "star_half" : "star"}
                      </span>
                    );
                  })}
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 text-right self-center">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span className="material-symbols-outlined text-sm text-emerald-500">payments</span>
          Khoảng giá
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            step={1000}
            value={pendingMinPrice}
            onChange={(e) => setPendingMinPrice(e.target.value)}
            placeholder="Từ"
            className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:border-slate-300 dark:focus:border-slate-600 outline-none transition-all"
          />
          <input
            type="number"
            min={0}
            step={1000}
            value={pendingMaxPrice}
            onChange={(e) => setPendingMaxPrice(e.target.value)}
            placeholder="Đến"
            className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:border-slate-300 dark:focus:border-slate-600 outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span className="material-symbols-outlined text-sm text-rose-500">schedule</span>
          Thời gian còn lại (giờ)
        </div>
        <input
          type="number"
          min={0}
          step={1}
          value={pendingHoursLeft}
          onChange={(e) => setPendingHoursLeft(e.target.value)}
          placeholder="Ví dụ: 3"
          className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 focus:border-slate-300 dark:focus:border-slate-600 outline-none transition-all"
        />
      </div>
    </div>
  );

  return (
    <section className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
      {/* Search keyword banner */}
      {searchKeyword && (
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined text-[16px] mt-0.5">chevron_right</span>
          <span>Kết quả tìm kiếm &quot;{searchKeyword}&quot;</span>
        </div>
      )}
      <div className="flex gap-6 relative">
        {/* Filter Sidebar Wrapper */}
        <div className="hidden lg:block w-64 shrink-0">
          <aside className="sticky top-[var(--header-height,82px)] h-fit pb-6 pr-1 z-10">
          {/* Filter Panel */}
          <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] overflow-hidden rounded-xl animate-in fade-in slide-in-from-left-2 duration-500">
            {/* Header */}
            <div className="px-4 py-3 border-b-2 border-slate-200 dark:border-slate-700 flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  Bộ lọc
                </h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleResetFilters}
                  disabled={!hasActiveFilters}
                  className="text-[10px] font-bold uppercase tracking-wide text-slate-500 hover:text-primary border-2 border-slate-200 dark:border-slate-600 px-2 py-1 transition-all disabled:opacity-30 hover:border-primary whitespace-nowrap rounded-lg"
                >
                  Xóa tất cả
                </button>
                <button
                  onClick={handleApplyFilters}
                  disabled={!hasPendingChanges}
                  className="text-[10px] font-bold uppercase tracking-wide bg-primary text-white border-2 border-primary px-2 py-1 transition-all disabled:opacity-40 hover:shadow-[2px_2px_0px_#E2B9A1] hover:-translate-y-[1px] whitespace-nowrap active:translate-y-0 active:shadow-none rounded-lg"
                >
                  Áp dụng
                </button>
              </div>
            </div>
            <div className="p-4">
              {renderFilterFields()}
            </div>
          </div>

          {/* Category Panel */}
          <div className="mt-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] overflow-hidden rounded-xl">
            <div className="px-4 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-primary/5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                Danh mục
              </h3>
            </div>
            <nav className="py-1 flex flex-col">
              <button
                onClick={() => setActiveCategoryId(undefined)}
                className={`flex items-center gap-3 px-3 py-2 text-[12px] font-semibold transition-all cursor-pointer rounded-xl mx-2 my-0.5 border border-transparent shrink-0 ${
                  !activeCategoryId
                    ? "bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                }`}
              >
                <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src="https://img.icons8.com/color/96/categorize.png"
                    alt="Tất cả"
                    fill
                    sizes="28px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <span className="flex-1 truncate text-left">Tất cả</span>
              </button>
              {displayedCategories.map((cat) => {
                const imgUrl = getCategoryImageUrl(cat.slug);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`flex items-center gap-3 px-3 py-2 text-[12px] font-semibold transition-all cursor-pointer rounded-xl mx-2 my-0.5 border border-transparent shrink-0 ${
                      activeCategoryId === cat.id
                        ? "bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    {imgUrl ? (
                      <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={imgUrl}
                          alt={cat.name}
                          fill
                          sizes="28px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <span className="material-symbols-outlined text-[20px] text-slate-400">
                        {cat.iconUrl || "category"}
                      </span>
                    )}
                    <span className="flex-1 truncate text-left">{cat.name.replace(/&/g, "-")}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sort Panel */}
          <div className="mt-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] overflow-hidden rounded-xl">
            <div className="px-4 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-primary/5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 flex items-center gap-2">
                Sắp xếp
              </h3>
            </div>
            <nav className="py-1 flex flex-col">
              {[
                { value: "ending_soon", label: "Sắp kết thúc", icon: "https://img.icons8.com/color/96/alarm-clock.png" },
                { value: "newest", label: "Mới nhất", icon: "https://img.icons8.com/color/96/new.png" },
                { value: "most_bids", label: "Nhiều lượt đấu giá", icon: "https://img.icons8.com/color/96/law.png" },
                { value: "price_asc", label: "Giá thấp → cao", icon: "https://img.icons8.com/color/96/numerical-sorting-12.png" },
                { value: "price_desc", label: "Giá cao → thấp", icon: "https://img.icons8.com/color/96/numerical-sorting-21.png" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={`flex items-center gap-3 px-3 py-2 text-[12px] font-semibold transition-all cursor-pointer rounded-xl mx-2 my-0.5 border border-transparent shrink-0 ${
                    sort === opt.value
                      ? "bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <div className="relative w-5 h-5 overflow-hidden shrink-0">
                    <Image
                      src={opt.icon}
                      alt={opt.label}
                      fill
                      sizes="20px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  {opt.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      </div>

        {/* Product Grid */}
        <div className={`flex-1 min-w-0 transition-opacity duration-200 ${isRefetching ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
          {/* Mobile filters */}
          <div className="lg:hidden mb-6">
            <details className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden group">
              <summary className="list-none px-4 py-3 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">tune</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Bộ lọc tìm kiếm</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 transition-transform group-open:rotate-180">expand_more</span>
              </summary>
              <div className="border-t border-slate-100 dark:border-slate-700 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-400">Tinh chỉnh kết quả nhanh chóng</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetFilters}
                      disabled={!hasActiveFilters}
                      className="px-3 py-1.5 rounded-full text-[11px] font-bold border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-primary/40 hover:text-primary transition-all disabled:opacity-50"
                    >
                      Xóa tất cả
                    </button>
                    <button
                      onClick={handleApplyFilters}
                      disabled={!hasPendingChanges}
                      className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-primary text-white border border-primary transition-all disabled:opacity-50"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
                {renderFilterFields()}
              </div>
            </details>
          </div>

          {/* Mobile Category Tabs */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center bg-white dark:bg-background-dark p-1.5 rounded-xl shadow-sm border border-primary/5 overflow-x-auto">
              <button
                onClick={() => setActiveCategoryId(undefined)}
                className={`px-5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  !activeCategoryId ? "bg-primary text-white shadow-md" : "text-slate-500 hover:text-primary"
                }`}
              >
                Tất cả
              </button>
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`px-5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategoryId === cat.id ? "bg-primary text-white shadow-md" : "text-slate-500 hover:text-primary"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] animate-pulse">
                  <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700" />
                  <div className="p-3 space-y-2">
                    <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-5xl text-red-400 mb-4">error</span>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Đã xảy ra lỗi</p>
              <p className="text-slate-500 mb-4">{error}</p>
              <button
                onClick={() => fetchAuctions(1)}
                className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-all"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && auctions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">gavel</span>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Chưa có phiên đấu giá nào</p>
              <p className="text-slate-500">Hiện tại chưa có phiên đấu giá nào đang diễn ra. Hãy quay lại sau!</p>
            </div>
          )}

          {/* Auction grid */}
          {!loading && !error && auctions.length > 0 && (
            <>
              {filteredAuctions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">filter_alt_off</span>
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Không có phiên phù hợp bộ lọc
                  </p>
                  <p className="text-slate-500">Hãy thử điều chỉnh bộ lọc hoặc bấm &quot;Xóa tất cả&quot;.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredAuctions.map((auction, idx) => (
                    <Link
                      href={`/auction/${auction.id}`}
                      key={auction.id}
                      className="group bg-white dark:bg-slate-800/60 overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] transition-all duration-300 cursor-pointer rounded-xl"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-700">
                        {auction.thumbnailUrl ? (
                          <Image
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            alt={auction.title}
                            src={auction.thumbnailUrl}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                            <span className="material-symbols-outlined text-4xl text-slate-400">image</span>
                          </div>
                        )}
                        {/* LIVE badge */}
                        <div className="absolute top-2 right-2 bg-red-500 px-2 py-0.5 rounded-full text-[9px] font-bold text-white flex items-center gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Đang diễn ra
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-3 space-y-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {(auction.category?.name ?? "Khác").replace(/&/g, "-")}
                        </span>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1 leading-snug">
                          {auction.title}
                        </h3>
                        <div className="space-y-1">
                          <div>
                            <p className="text-[10px] text-slate-500 font-medium">Giá hiện tại</p>
                            <p className="text-sm font-bold text-orange-600 dark:text-orange-500">{formatVND(auction.currentPrice)}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-slate-500 font-medium">Còn lại</p>
                            <p className="text-xs text-red-500 font-bold flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-xs">schedule</span>
                              {timeLeftsById.get(auction.id) || "--:--:--"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default function LiveAuctionsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-[#8f5c38] border-t-transparent animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Đang tải...</p>
        </div>
      </div>
    }>
      <LiveAuctionsPageContent />
    </Suspense>
  );
}

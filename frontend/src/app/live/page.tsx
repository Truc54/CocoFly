"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { auctionApi, categoryApi } from "@/lib/api";

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

export default function LiveAuctionsPage() {
  const searchParams = useSearchParams();
  const urlCategoryId = searchParams.get("categoryId");
  const urlSort = searchParams.get("sort");

  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>(
    urlCategoryId ? parseInt(urlCategoryId) : undefined
  );
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState(urlSort || "ending_soon");
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
  }, [urlCategoryId, urlSort]);

  // Fetch categories for sidebar
  useEffect(() => {
    categoryApi.getAll().then((res) => {
      if (res?.data) setCategories(res.data);
    }).catch(() => {});
  }, []);

  const fetchAuctions = useCallback(async (page: number, append = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const res = await auctionApi.getLive({
        page,
        limit: 20,
        categoryId: activeCategoryId,
        sort,
      });

      const { auctions: data, pagination: pag } = res.data;
      setAuctions((prev) => (append ? [...prev, ...data] : data));
      setPagination(pag);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách đấu giá");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeCategoryId, sort]);

  useEffect(() => {
    fetchAuctions(1);
  }, [fetchAuctions]);

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
        const hoursBucket = Math.max(0, Math.floor(getHoursLeft(auction.endTime, nowMs)));
        if (hoursBucket !== Math.floor(hoursValue)) return false;
      }

      return true;
    });
  }, [auctions, ratingFilter, minPrice, maxPrice, hoursLeft, timeLefts]);

  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      fetchAuctions(pagination.page + 1, true);
    }
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
    { value: 0, label: "Tất cả" },
    { value: 4.5, label: "Từ 4.5 trở lên" },
    { value: 4, label: "Từ 4.0 trở lên" },
    { value: 3.5, label: "Từ 3.5 trở lên" },
    { value: 3, label: "Từ 3.0 trở lên" },
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
            const starCount = option.value === 0 ? 5 : option.value;
            const fullStars = Math.floor(starCount);
            const hasHalf = starCount % 1 !== 0;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPendingRating(option.value)}
                aria-pressed={isActive}
                className={`group flex items-center gap-2 px-3 py-2.5 border-2 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "border-primary bg-primary/5 text-primary shadow-[3px_3px_0px_#E2B9A1]"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/50 hover:bg-primary/5 hover:shadow-[2px_2px_0px_#E2B9A1]"
                }`}
              >
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const filled = option.value === 0 ? true : i < fullStars;
                    const half = option.value === 0 ? false : !filled && hasHalf && i === fullStars;
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
                <span className="text-xs flex-1">
                  {option.value === 0 ? "Tất cả" : `${option.value}+`}
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
            className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 focus:border-slate-300 dark:focus:border-slate-600 outline-none transition-all"
          />
          <input
            type="number"
            min={0}
            step={1000}
            value={pendingMaxPrice}
            onChange={(e) => setPendingMaxPrice(e.target.value)}
            placeholder="Đến"
            className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 focus:border-slate-300 dark:focus:border-slate-600 outline-none transition-all"
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
          className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 focus:border-slate-300 dark:focus:border-slate-600 outline-none transition-all"
        />
      </div>
    </div>
  );

  return (
    <section className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
      <div className="flex gap-6">
        {/* Filter Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 self-start sticky top-[102px]">
          {/* Filter Panel */}
          <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] overflow-hidden animate-in fade-in slide-in-from-left-2 duration-500">
            {/* Header */}
            <div className="px-4 py-3 border-b-2 border-slate-200 dark:border-slate-700 flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>tune</span>
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  Bộ lọc
                </h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleResetFilters}
                  disabled={!hasActiveFilters}
                  className="text-[10px] font-bold uppercase tracking-wide text-slate-500 hover:text-primary border-2 border-slate-200 dark:border-slate-600 px-2 py-1 transition-all disabled:opacity-30 hover:border-primary whitespace-nowrap"
                >
                  Xóa tất cả
                </button>
                <button
                  onClick={handleApplyFilters}
                  disabled={!hasPendingChanges}
                  className="text-[10px] font-bold uppercase tracking-wide bg-primary text-white border-2 border-primary px-2 py-1 transition-all disabled:opacity-40 hover:shadow-[2px_2px_0px_#E2B9A1] hover:-translate-y-[1px] whitespace-nowrap active:translate-y-0 active:shadow-none"
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
          <div className="mt-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] overflow-hidden">
            <div className="px-4 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-primary/5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <div className="w-5 h-5 bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>category</span>
                </div>
                Danh mục
              </h3>
            </div>
            <nav className="py-1">
              <button
                onClick={() => setActiveCategoryId(undefined)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer border-l-4 ${
                  !activeCategoryId
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-primary hover:border-primary/40"
                }`}
              >
                <span className="material-symbols-outlined text-base">apps</span>
                Tất cả
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer border-l-4 ${
                    activeCategoryId === cat.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-primary hover:border-primary/40"
                  }`}
                >
                  {cat.iconUrl && (
                    <span className={`material-symbols-outlined text-base ${activeCategoryId === cat.id ? "text-primary" : "text-slate-400"}`}>
                      {cat.iconUrl}
                    </span>
                  )}
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Sort Panel */}
          <div className="mt-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] overflow-hidden">
            <div className="px-4 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-primary/5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <div className="w-5 h-5 bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>sort</span>
                </div>
                Sắp xếp
              </h3>
            </div>
            <nav className="py-1">
              {[
                { value: "ending_soon", label: "Sắp kết thúc", icon: "alarm" },
                { value: "newest", label: "Mới nhất", icon: "fiber_new" },
                { value: "most_bids", label: "Nhiều lượt đấu giá", icon: "gavel" },
                { value: "price_asc", label: "Giá thấp → cao", icon: "arrow_upward" },
                { value: "price_desc", label: "Giá cao → thấp", icon: "arrow_downward" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold transition-all text-left border-l-4 ${
                    sort === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-primary hover:border-primary/40"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
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
                  <p className="text-slate-500">Hãy thử điều chỉnh bộ lọc hoặc bấm "Xóa tất cả".</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredAuctions.map((auction, idx) => (
                    <Link
                      href={`/auction/${auction.id}`}
                      key={auction.id}
                      className="group bg-white dark:bg-slate-800/60 overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] transition-all duration-300 cursor-pointer"
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
                        {/* Bid count */}
                        <span className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-orange-600 flex items-center gap-1 shadow-sm">
                          <span className="material-symbols-outlined text-xs">groups</span>
                          {auction.totalBids} lượt
                        </span>
                        {/* LIVE badge */}
                        <div className="absolute top-2 right-2 bg-red-500 px-2 py-0.5 rounded-full text-[9px] font-bold text-white flex items-center gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          LIVE
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-3 space-y-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {auction.category?.name ?? "Khác"}
                        </span>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
                          {auction.title}
                        </h3>
                        <div className="space-y-1">
                          <div>
                            <p className="text-[10px] text-slate-500 font-medium">Giá hiện tại</p>
                            <p className="text-sm font-bold text-primary">{formatVND(auction.currentPrice)}</p>
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

              {/* Load more */}
              {pagination && pagination.page < pagination.totalPages && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-primary font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">expand_more</span>
                        Xem thêm ({pagination.totalItems - auctions.length} phiên còn lại)
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

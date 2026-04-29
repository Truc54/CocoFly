"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
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
  scheduledStart: string;
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

const PERIOD_TABS = [
  { label: "Hôm nay", value: "today" },
  { label: "Ngày mai", value: "tomorrow" },
  { label: "Tuần này", value: "this_week" },
  { label: "Tất cả", value: "all" },
];

function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function formatScheduledStart(dateStr: string): string {
  const date = new Date(dateStr);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${hours}:${minutes} — ${day}/${month}`;
}

export default function UpcomingPage() {
  const [activePeriod, setActivePeriod] = useState("all");
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Fetch categories
  useEffect(() => {
    categoryApi.getAll().then((res) => {
      if (res?.data) setCategories(res.data);
    }).catch(() => {});
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchAuctions = useCallback(async (page: number, append = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const res = await auctionApi.getUpcoming({
        page,
        limit: 20,
        categoryId: activeCategoryId,
        period: activePeriod,
        search: debouncedSearch || undefined,
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
  }, [activePeriod, activeCategoryId, debouncedSearch]);

  useEffect(() => {
    fetchAuctions(1);
  }, [fetchAuctions]);

  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      fetchAuctions(pagination.page + 1, true);
    }
  };

  const activeCategoryName = activeCategoryId
    ? categories.find((c) => c.id === activeCategoryId)?.name
    : null;

  return (
    <section className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {activeCategoryName
            ? `Sắp diễn ra — ${activeCategoryName}`
            : "Phiên đấu giá sắp diễn ra"}
        </h1>
        {!loading && pagination && (
          <p className="text-sm text-slate-500 mt-1">{pagination.totalItems} phiên sắp diễn ra</p>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center bg-white dark:bg-background-dark p-1.5 rounded-xl shadow-sm border border-primary/5">
          {PERIOD_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActivePeriod(tab.value)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                activePeriod === tab.value
                  ? "bg-primary text-white shadow-md"
                  : "text-slate-500 hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="w-full md:w-80 relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
          <input
            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white dark:bg-background-dark border border-primary/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm text-sm"
            placeholder="Tìm kiếm sản phẩm..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Category Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 self-start sticky top-[102px]">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">filter_list</span>
                Danh mục
              </h3>
            </div>
            <nav className="py-2">
              <button
                onClick={() => setActiveCategoryId(undefined)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all cursor-pointer ${
                  !activeCategoryId
                    ? "bg-primary/10 text-primary font-bold border-l-3 border-primary"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary"
                }`}
              >
                <span className="material-symbols-outlined text-lg">apps</span>
                Tất cả
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all cursor-pointer ${
                    activeCategoryId === cat.id
                      ? "bg-primary/10 text-primary font-bold border-l-3 border-primary"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary"
                  }`}
                >
                  {cat.iconUrl && (
                    <span className={`material-symbols-outlined text-lg ${activeCategoryId === cat.id ? "text-primary" : "text-slate-400"}`}>
                      {cat.iconUrl}
                    </span>
                  )}
                  {cat.name}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main grid */}
        <div className="flex-1 min-w-0">
          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-background-dark rounded-xl overflow-hidden border border-primary/5 shadow-sm animate-pulse">
                  <div className="aspect-square bg-slate-200 dark:bg-slate-700" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-full mt-2" />
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
              <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">event_upcoming</span>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Chưa có phiên đấu giá nào</p>
              <p className="text-slate-500">
                {debouncedSearch
                  ? `Không tìm thấy kết quả cho "${debouncedSearch}"`
                  : "Hiện tại chưa có phiên đấu giá nào sắp diễn ra. Hãy quay lại sau!"}
              </p>
            </div>
          )}

          {/* Auction grid */}
          {!loading && !error && auctions.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {auctions.map((auction, idx) => (
                  <div
                    key={auction.id}
                    className="group bg-white dark:bg-background-dark rounded-xl overflow-hidden border border-primary/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                      {auction.thumbnailUrl ? (
                        <Image
                          alt={auction.title}
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          src={auction.thumbnailUrl}
                          fill
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                          <span className="material-symbols-outlined text-4xl text-slate-400">image</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="bg-primary/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          {formatScheduledStart(auction.scheduledStart)}
                        </span>
                      </div>
                      {auction.category && (
                        <div className="absolute top-3 right-3">
                          <span className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm text-[10px] font-bold text-slate-600 px-2 py-0.5 rounded-full">
                            {auction.category.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{auction.title}</h3>
                      <p className="text-sm font-medium text-slate-500">Giá khởi điểm:</p>
                      <p className="text-lg font-extrabold text-primary">{formatVND(auction.startingPrice)}</p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                        <span className="material-symbols-outlined text-xs">visibility</span>
                        {auction.totalWatchers} người theo dõi
                      </div>
                      <button className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all text-sm">
                        <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                        Nhắc tôi
                      </button>
                    </div>
                  </div>
                ))}
              </div>

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

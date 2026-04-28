"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { auctionApi } from "@/lib/api";

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

const CATEGORIES = [
  { name: "Tất cả", icon: "apps", id: undefined },
  { name: "Công nghệ", icon: "devices", id: 1 },
  { name: "Thời trang", icon: "checkroom", id: 2 },
  { name: "Cổ vật", icon: "account_balance", id: 3 },
  { name: "Nghệ thuật", icon: "palette", id: 4 },
  { name: "Khác", icon: "dashboard_customize", id: 5 },
];

function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function useCountdown(endTimes: string[]) {
  const [timeLefts, setTimeLefts] = useState<string[]>([]);
  const endTimesKey = JSON.stringify(endTimes);

  useEffect(() => {
    const times: string[] = JSON.parse(endTimesKey);
    if (times.length === 0) {
      setTimeLefts([]);
      return;
    }

    function calc() {
      return times.map((endTime: string) => {
        const diff = new Date(endTime).getTime() - Date.now();
        if (diff <= 0) return "00:00:00";
        const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
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
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState("ending_soon");

  const fetchAuctions = useCallback(async (page: number, append = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const selectedCat = CATEGORIES.find((c) => c.name === activeCategory);
      const res = await auctionApi.getLive({
        page,
        limit: 20,
        categoryId: selectedCat?.id,
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
  }, [activeCategory, sort]);

  useEffect(() => {
    fetchAuctions(1);
  }, [fetchAuctions]);

  const endTimes = useMemo(() => auctions.map((a) => a.endTime), [auctions]);
  const timeLefts = useCountdown(endTimes);

  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      fetchAuctions(pagination.page + 1, true);
    }
  };

  return (
    <>
      {/* Hero Banner */}
      <section className="px-6 lg:px-20 py-10">
        <div className="max-w-7xl mx-auto">
          <div
            className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-10 py-16 flex flex-col items-center justify-center text-center shadow-2xl"
          >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
            <div className="relative z-10 flex flex-col items-center gap-4 max-w-2xl">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 text-white text-sm font-bold">
                <span className="w-2 h-2 rounded-full bg-red-300 animate-pulse"></span>
                LIVE
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Đấu giá đang diễn ra
              </h1>
              <p className="text-white/90 text-lg font-medium leading-relaxed">
                Tham gia ngay các phiên đấu giá nóng hổi. Đặt giá và trở thành chủ nhân của những sản phẩm tuyệt vời!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Sidebar + Grid */}
      <section className="px-6 lg:px-20 pb-20">
        <div className="max-w-7xl mx-auto flex gap-8">
          {/* Category Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0 self-start sticky top-20">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">filter_list</span>
                  Danh mục
                </h3>
              </div>
              <nav className="py-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all cursor-pointer ${
                      activeCategory === cat.name
                        ? "bg-primary/10 text-primary font-bold border-l-3 border-primary"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-lg ${
                      activeCategory === cat.name ? "text-primary" : "text-slate-400"
                    }`}>
                      {cat.icon}
                    </span>
                    {cat.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Active count */}
            <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="material-symbols-outlined text-green-500 text-base">circle</span>
                <span className="font-bold">
                  {loading ? "..." : `${pagination?.totalItems ?? 0} phiên đang hoạt động`}
                </span>
              </div>
            </div>

            {/* Sort selector */}
            <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Sắp xếp</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="ending_soon">Sắp kết thúc</option>
                <option value="newest">Mới nhất</option>
                <option value="most_bids">Nhiều lượt đấu giá</option>
                <option value="price_asc">Giá thấp → cao</option>
                <option value="price_desc">Giá cao → thấp</option>
              </select>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {/* Mobile Category Tabs */}
            <div className="lg:hidden mb-6">
              <div className="flex items-center bg-white dark:bg-background-dark p-1.5 rounded-xl shadow-sm border border-primary/5 overflow-x-auto">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`px-5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                      activeCategory === cat.name
                        ? "bg-primary text-white shadow-md"
                        : "text-slate-500 hover:text-primary"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm animate-pulse">
                    <div className="aspect-square bg-slate-200 dark:bg-slate-700" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-full mt-2" />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {auctions.map((auction, idx) => (
                    <Link
                      href={`/auction/${auction.id}`}
                      key={auction.id}
                      className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                      style={{ animationDelay: `${idx * 80}ms` }}
                    >
                      <div className="relative aspect-square overflow-hidden bg-slate-100">
                        {auction.thumbnailUrl ? (
                          <Image
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            alt={auction.title}
                            src={auction.thumbnailUrl}
                            fill
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                            <span className="material-symbols-outlined text-4xl text-slate-400">image</span>
                          </div>
                        )}
                        <span className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-bold text-red-600 flex items-center gap-1 shadow-sm">
                          <span className="material-symbols-outlined text-xs">groups</span>
                          🔥 {auction.totalBids}
                        </span>
                        <div className="absolute top-2 right-2 bg-red-500/90 backdrop-blur px-2 py-0.5 rounded-full text-[9px] font-bold text-white flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-white animate-pulse"></span>
                          LIVE
                        </div>
                      </div>

                      <div className="p-3 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {auction.category?.name ?? "Khác"}
                        </span>
                        <h3 className="text-sm font-bold line-clamp-1">{auction.title}</h3>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] text-slate-500 font-medium">Giá hiện tại</p>
                            <p className="text-sm font-bold text-primary">{formatVND(auction.currentPrice)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-500 font-medium">Còn lại</p>
                            <p className="text-xs text-red-500 font-bold flex items-center justify-end gap-0.5">
                              <span className="material-symbols-outlined text-xs">schedule</span>
                              {timeLefts[idx] || "--:--:--"}
                            </p>
                          </div>
                        </div>
                        <div
                          className="w-full py-2 bg-primary text-white text-center text-xs font-bold rounded-lg mt-1 hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer"
                        >
                          Đặt giá ngay
                        </div>
                      </div>
                    </Link>
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
    </>
  );
}

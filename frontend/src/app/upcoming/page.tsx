"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
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
  return `Bắt đầu lúc ${hours}:${minutes} - ${day}/${month}`;
}

export default function UpcomingPage() {
  const [activePeriod, setActivePeriod] = useState("all");
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input (300ms)
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
  }, [activePeriod, debouncedSearch]);

  useEffect(() => {
    fetchAuctions(1);
  }, [fetchAuctions]);

  const handleLoadMore = () => {
    if (pagination && pagination.page < pagination.totalPages) {
      fetchAuctions(pagination.page + 1, true);
    }
  };

  return (
    <>
      <section className="px-6 lg:px-20 py-10">
        <div className="max-w-7xl mx-auto">
          <div
            className="relative overflow-hidden rounded-xl bg-primary px-10 py-16 flex flex-col items-center justify-center text-center shadow-2xl"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/90 to-primary/80 opacity-90"></div>
            <div className="relative z-10 flex flex-col items-center gap-4 max-w-2xl animate-in fade-in zoom-in-95 duration-700">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight">Sắp diễn ra</h2>
              <p className="text-white/90 text-lg font-medium leading-relaxed">
                Đừng bỏ lỡ những siêu phẩm sắp lên sàn. Đặt lịch nhắc nhở ngay để trở thành người sở hữu đầu tiên!
              </p>
              <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span>Cập nhật liên tục mỗi giờ</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-20 pb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 border-b border-primary/10 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <div className="flex items-center bg-white dark:bg-background-dark p-1.5 rounded-xl shadow-sm border border-primary/5">
            {PERIOD_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActivePeriod(tab.value)}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activePeriod === tab.value
                    ? "bg-primary text-white shadow-md"
                    : "text-slate-500 hover:text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="w-full md:w-96 relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            <input
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-background-dark border border-primary/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm focus:shadow-md"
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="px-6 lg:px-20 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {auctions.map((auction, idx) => (
                  <div
                    key={auction.id}
                    className="group bg-white dark:bg-background-dark rounded-xl overflow-hidden border border-primary/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in zoom-in-95 cursor-pointer"
                    style={{ animationDelay: `${200 + idx * 50}ms`, animationFillMode: 'both' }}
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
                      <div className="absolute top-4 left-4">
                        <span className="bg-primary/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-lg">
                          {formatScheduledStart(auction.scheduledStart)}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex flex-col gap-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{auction.title}</h3>
                      <p className="text-sm font-medium text-slate-500">Giá khởi điểm:</p>
                      <p className="text-lg font-extrabold text-primary">{formatVND(auction.startingPrice)}</p>
                      <button className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all">
                        <span className="material-symbols-outlined text-[20px]">notifications_active</span>
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
      </section>
    </>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Clock,
  Calendar,
  Gavel,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { auctionApi } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WatchlistAuction {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  currentPrice: number;
  startingPrice: number;
  endTime: string;
  scheduledStart: string;
  status: string;
  totalBids: number;
  totalWatchers: number;
  category: { id: number; name: string } | null;
  seller: { id: string; fullName: string; avatarUrl: string | null } | null;
}

interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatVND(n: number) {
  return n.toLocaleString("vi-VN");
}

function getTimeLeft(endTime: string): string {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return "Đã kết thúc";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function getStatusLabel(status: string) {
  switch (status) {
    case "active":
      return { label: "ĐANG DIỄN RA", color: "bg-green-500" };
    case "scheduled":
      return { label: "SẮP DIỄN RA", color: "bg-blue-500" };
    case "ended":
    case "failed":
      return { label: "ĐÃ KẾT THÚC", color: "bg-slate-500" };
    default:
      return { label: status.toUpperCase(), color: "bg-slate-400" };
  }
}

// ═════════════════════════════════════════════════════════════════════════════
export default function WatchlistPage() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<WatchlistAuction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const fetchWatchlist = useCallback(async (p: number) => {
    try {
      setLoading(true);
      const res = await auctionApi.getWatchlist(p, LIMIT);
      setAuctions(res.data.auctions || []);
      setPagination(res.data.pagination || null);
    } catch {
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist(page);
  }, [page, fetchWatchlist]);

  const handleRemove = async (auctionId: string) => {
    setRemovingId(auctionId);
    try {
      await auctionApi.toggleWatch(auctionId);
      // Wait for animation then remove from list
      setTimeout(() => {
        setAuctions((prev) => prev.filter((a) => a.id !== auctionId));
        setRemovingId(null);
        // If last item on page, go back one page
        if (auctions.length === 1 && page > 1) {
          setPage((p) => p - 1);
        }
      }, 300);
    } catch {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              Đấu giá yêu thích
            </h1>
            {pagination && pagination.totalItems > 0 && (
              <p className="text-sm text-slate-500 mt-1">
                {pagination.totalItems} sản phẩm
              </p>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex gap-4 p-4 rounded-xl border-2 border-slate-200 bg-white animate-pulse"
              >
                <div className="w-28 h-28 rounded-lg bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : auctions.length > 0 ? (
          <>
            {/* Items List */}
            <div className="space-y-3">
              {auctions.map((item) => {
                const isEnded = item.status === "ended" || item.status === "failed";
                const isUpcoming = item.status === "scheduled";
                const statusInfo = getStatusLabel(item.status);

                return (
                  <div
                    key={item.id}
                    onClick={() => router.push(`/auction/${item.id}`)}
                    className={`group flex flex-col sm:flex-row items-start gap-4 rounded-xl border-2 border-slate-200 bg-white p-4 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#E2B9A1] transition-all cursor-pointer relative
                      ${removingId === item.id ? "opacity-0 scale-95 duration-300" : "opacity-100 scale-100"}`}
                  >
                    {/* Image */}
                    <Link
                      href={`/auction/${item.id}`}
                      className="relative flex-shrink-0 w-full sm:w-28 aspect-square rounded-lg border-2 border-slate-100 overflow-hidden bg-slate-50"
                    >
                      <Image
                        src={item.thumbnailUrl || "https://placehold.co/300x300/f1f5f9/94a3b8?text=No+Image"}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                      {/* Status Badge on Image */}
                      {(isEnded || isUpcoming) && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {statusInfo.label}
                          </span>
                        </div>
                      )}
                    </Link>

                    {/* Content */}
                    <div className="flex-1 min-w-0 w-full flex justify-between gap-4 sm:min-h-[88px]">
                      {/* Left Info */}
                      <div className="flex flex-col justify-between flex-1 min-w-0">
                        <div>
                          <Link
                            href={`/auction/${item.id}`}
                            className="text-base font-bold text-slate-800 line-clamp-2"
                          >
                            {item.title}
                          </Link>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {item.category && (
                              <span className="text-xs font-medium text-slate-400">
                                {item.category.name}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                              <Gavel className="w-3.5 h-3.5" />
                              {item.totalBids} lượt đặt giá
                            </span>
                            <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                              <Eye className="w-3.5 h-3.5" />
                              {item.totalWatchers} theo dõi
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 mt-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-lg font-extrabold text-[#E25C24]">
                              {formatVND(item.currentPrice)}đ
                            </p>
                            {/* Status badge */}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${statusInfo.color}`}
                            >
                              {item.status === "active" && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              )}
                              {statusInfo.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                            {item.status === "active" ? (
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="font-bold">
                                  Còn {getTimeLeft(item.endTime)}
                                </span>
                              </span>
                            ) : item.status === "scheduled" ? (
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(item.scheduledStart).toLocaleString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                Kết thúc {new Date(item.endTime).toLocaleDateString("vi-VN")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemove(item.id);
                          }}
                          disabled={removingId === item.id}
                          className="flex-shrink-0 p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors focus:outline-none disabled:opacity-50 cursor-pointer"
                          title="Bỏ theo dõi"
                        >
                          {removingId === item.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Heart className="w-5 h-5 fill-current" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border-2 border-slate-200 hover:border-slate-300 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                      p === page
                        ? "bg-primary text-white border-2 border-primary shadow-[2px_2px_0px_#8f5c38]"
                        : "border-2 border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="p-2 rounded-lg border-2 border-slate-200 hover:border-slate-300 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-muted-foreground/20 mx-auto" />
            <h3 className="text-lg font-semibold text-foreground mt-4">Chưa có sản phẩm nào</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Hãy thêm sản phẩm vào yêu thích để theo dõi biến động giá.
            </p>
            <Link
              href="/live"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Khám phá đấu giá
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

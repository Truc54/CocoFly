"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auctionApi, paymentApi } from "@/lib/api";
import {
  Activity,
  Calendar,
  CheckCircle2,
  Package,
  Eye,
  Users,
  Trophy,
  Edit,
  Trash2,
  Plus,
  Clock,
  Truck,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

// ─── Types & Config ──────────────────────────────────────────────────────────
type AuctionTab = "ongoing" | "upcoming" | "ended";

interface SellerAuction {
  id: string;
  status: string;
  title: string;
  thumbnailUrl: string | null;
  category: { id: number; name: string } | null;
  currentPrice: number;
  startingPrice: number;
  finalPrice: number | null;
  bidIncrement: number;
  scheduledStart: string;
  endTime: string;
  actualEndTime: string | null;
  totalBids: number;
  totalWatchers: number;
  viewCount: number;
  winner: { id: string; fullName: string; avatarUrl: string | null } | null;
  payment: { id: string; status: string; shippingStatus: string } | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

const TABS: { key: AuctionTab; label: string; icon: React.ReactNode }[] = [
  { key: "ongoing", label: "Đang diễn ra", icon: <Activity className="w-4 h-4" /> },
  { key: "upcoming", label: "Sắp diễn ra", icon: <Calendar className="w-4 h-4" /> },
  { key: "ended", label: "Đã kết thúc", icon: <CheckCircle2 className="w-4 h-4" /> },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatPrice(value: number): string {
  return value.toLocaleString("vi-VN") + "đ";
}

function formatTimeLeft(endTime: string): string {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return "Đã kết thúc";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} ngày ${hours % 24}h`;
  }
  return `${hours}h ${mins}m`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Skeleton Loader ────────────────────────────────────────────────────────
function AuctionSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 rounded-xl border-2 border-slate-200 bg-white p-4 animate-pulse">
          <div className="flex-shrink-0 w-28 h-28 rounded-lg bg-slate-200" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-3/4 bg-slate-200 rounded" />
            <div className="h-4 w-1/2 bg-slate-200 rounded" />
            <div className="h-6 w-1/3 bg-slate-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Delete Confirm Dialog ──────────────────────────────────────────────────
function DeleteDialog({
  isOpen,
  auctionTitle,
  isLoading,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  auctionTitle: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl border-2 border-slate-200 shadow-[4px_4px_0px_#e2e8f0] p-6 max-w-md mx-4 w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Xác nhận xóa</h3>
        </div>
        <p className="text-sm text-slate-600 mb-6">
          Bạn có chắc muốn xóa phiên đấu giá <strong>&quot;{auctionTitle}&quot;</strong>? Hành động này không thể hoàn tác.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors inline-flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ManageAuctionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuctionTab>("ongoing");
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  // Data state
  const [auctions, setAuctions] = useState<SellerAuction[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [shippingLoadingId, setShippingLoadingId] = useState<string | null>(null);

  // ── Fetch seller auctions ──────────────────────────────────────────────
  const fetchAuctions = useCallback(async (tab: string, p: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await auctionApi.getMyListings(tab, p, LIMIT);
      const { auctions: data, pagination: pag } = res.data;
      setAuctions(data);
      setPagination(pag);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách đấu giá");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuctions(activeTab, page);
  }, [activeTab, page, fetchAuctions]);

  // ── Tab change handler ─────────────────────────────────────────────────
  const handleTabChange = (tab: AuctionTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  // ── Delete handler ─────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await auctionApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      fetchAuctions(activeTab, page);
    } catch (err: any) {
      alert(err.message || "Không thể xóa phiên đấu giá");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Confirm shipping handler ───────────────────────────────────────────
  const handleConfirmShipping = async (paymentId: string) => {
    try {
      setShippingLoadingId(paymentId);
      await paymentApi.confirmShipping(paymentId);
      fetchAuctions(activeTab, page);
    } catch (err: any) {
      alert(err.message || "Không thể xác nhận giao hàng");
    } finally {
      setShippingLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Quản lý đấu giá</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-6 border-b border-border scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all
                ${activeTab === tab.key
                  ? "text-[#E25C24] border-[#E25C24]"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
                }`}
            >
              {tab.icon}
              {tab.label}
              {pagination && activeTab === tab.key && pagination.totalItems > 0 && (
                <span className="min-w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 bg-[#E25C24] text-white">
                  {pagination.totalItems}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && <AuctionSkeleton />}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-20">
            <AlertTriangle className="w-16 h-16 text-red-300 mx-auto" />
            <h3 className="text-lg font-semibold text-foreground mt-4">Có lỗi xảy ra</h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <button
              onClick={() => fetchAuctions(activeTab, page)}
              className="mt-4 px-5 py-2.5 rounded-lg bg-[#E25C24] text-white text-sm font-medium hover:bg-[#E25C24]/90 transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* List */}
        {!loading && !error && auctions.length > 0 && (
          <div className="space-y-3">
            {auctions.map(auction => (
              <div
                key={auction.id}
                onClick={() => router.push(`/auction/${auction.id}`)}
                className="group flex flex-col sm:flex-row items-start gap-4 rounded-xl border-2 border-slate-200 bg-white p-4 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#E2B9A1] transition-all cursor-pointer relative"
              >
                {/* Image */}
                <div className="relative flex-shrink-0 w-full sm:w-28 aspect-square rounded-lg border-2 border-slate-100 overflow-hidden bg-slate-50">
                  {auction.thumbnailUrl ? (
                    <Image
                      src={auction.thumbnailUrl}
                      alt={auction.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 w-full flex justify-between gap-4 sm:min-h-[88px]">

                  {/* Left: Info */}
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <div className="text-base font-bold text-slate-800 line-clamp-2">
                        {auction.title}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {activeTab === "ongoing" && (
                          <>
                            <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                              <Users className="w-3.5 h-3.5" />
                              {auction.totalBids} lượt đặt giá
                            </span>
                            <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                              <Eye className="w-3.5 h-3.5" />
                              {auction.viewCount || 0} lượt xem
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-2">
                      {activeTab === "ended" && auction.winner && (
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Trophy className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-bold text-slate-700">{auction.winner.fullName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {activeTab === "ongoing" && (
                          <p className="text-lg font-extrabold text-[#E25C24]">{formatPrice(auction.currentPrice)}</p>
                        )}
                        {activeTab === "upcoming" && (
                          <p className="text-lg font-extrabold text-[#E25C24]">{formatPrice(auction.startingPrice)}</p>
                        )}
                        {activeTab === "ended" && (
                          <p className="text-lg font-extrabold text-[#E25C24]">{formatPrice(auction.finalPrice ?? auction.currentPrice)}</p>
                        )}
                      </div>

                      {activeTab === "ongoing" ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-bold">Còn {formatTimeLeft(auction.endTime)}</span>
                        </span>
                      ) : activeTab === "upcoming" ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          Dự kiến: {formatDate(auction.scheduledStart)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          Kết thúc: {formatDate(auction.actualEndTime || auction.endTime)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {activeTab === "upcoming" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/auction/${auction.id}/edit`);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg border-2 border-slate-200 bg-white text-slate-700 shadow-[2px_2px_0px_#e2e8f0] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#e2e8f0] transition-all w-[110px] justify-center"
                        >
                          <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget({ id: auction.id, title: auction.title });
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg border-2 border-red-200 bg-red-50 text-red-600 shadow-[2px_2px_0px_#fecaca] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#fecaca] transition-all w-[110px] justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xóa
                        </button>
                      </>
                    )}
                    {activeTab === "ended" && auction.payment && (
                      <>
                        {auction.payment.shippingStatus === "shipped" || auction.payment.shippingStatus === "delivered" ? (
                          <span className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default whitespace-nowrap">
                            {auction.payment.shippingStatus === "delivered" ? "Đã giao hàng" : "Đã xác nhận giao hàng"}
                          </span>
                        ) : auction.payment.status === "paid" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmShipping(auction.payment!.id);
                            }}
                            disabled={shippingLoadingId === auction.payment.id}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg border-2 border-[#E25C24] bg-[#E25C24] text-white shadow-[2px_2px_0px_#E2B9A1] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#E2B9A1] transition-all whitespace-nowrap disabled:opacity-50"
                          >
                            {shippingLoadingId === auction.payment.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Truck className="w-3.5 h-3.5" />
                            )}
                            Xác nhận giao hàng
                          </button>
                        ) : (
                          <span className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-600 border border-amber-100 cursor-default whitespace-nowrap">
                            Chờ thanh toán
                          </span>
                        )}
                      </>
                    )}
                    {activeTab === "ended" && !auction.payment && auction.status === "failed" && (
                      <span className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-500 border border-slate-200 cursor-default whitespace-nowrap">
                        Thất bại
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && auctions.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-muted-foreground/20 mx-auto" />
            <h3 className="text-lg font-semibold text-foreground mt-4">Không có phiên đấu giá nào</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === "ongoing" && "Bạn không có phiên đấu giá nào đang diễn ra."}
              {activeTab === "upcoming" && "Bạn không có phiên đấu giá nào sắp diễn ra."}
              {activeTab === "ended" && "Chưa có phiên đấu giá nào kết thúc."}
            </p>
            {activeTab !== "ended" && (
              <button
                onClick={() => router.push("/create-auction")}
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-lg bg-[#E25C24] text-white text-sm font-medium hover:bg-[#E25C24]/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Tạo phiên đấu giá mới
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border-2 border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all
                  ${p === page
                    ? "bg-[#E25C24] text-white border-2 border-[#E25C24] shadow-[2px_2px_0px_#E2B9A1]"
                    : "border-2 border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="p-2 rounded-lg border-2 border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={!!deleteTarget}
        auctionTitle={deleteTarget?.title || ""}
        isLoading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

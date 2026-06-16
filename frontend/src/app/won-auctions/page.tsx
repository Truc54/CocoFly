"use client";

import React, { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Trophy,
  Gavel,
  Clock,
  CreditCard,
  CheckCircle2,
  Package,
  Truck,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Star } from "lucide-react";

import { userApi, paymentApi, auctionApi } from "@/lib/api";

// ─── Types & Config ──────────────────────────────────────────────────────────
type OrderTab = "bidding" | "won" | "delivering" | "received";

interface OrderItem {
  id: string;
  name: string;
  image: string;
  currentPrice: string;
  seller: string;
  date: string;
  status: OrderTab;
  timeLeft?: string;
  myBid?: string;
  isPaid?: boolean;
  paymentStatus?: string;
  paymentDeadline?: string | null;
  deliveryCountdown?: string;
  paymentId?: string;
  hasReviewed?: boolean;
  dispute?: { id: string; status: string; reason: string } | null;
}

const TABS: { key: OrderTab; label: string; icon: React.ReactNode }[] = [
  { key: "bidding", label: "Đang đấu giá", icon: <img src="https://img.icons8.com/color/96/law.png" className="w-5 h-5" alt="bidding" /> },
  { key: "won", label: "Đã thắng", icon: <img src="https://img.icons8.com/color/96/trophy.png" className="w-5 h-5" alt="won" /> },
  { key: "delivering", label: "Đang giao hàng", icon: <img src="https://img.icons8.com/color/96/delivery.png" className="w-5 h-5" alt="delivering" /> },
  { key: "received", label: "Đã nhận", icon: <img src="https://img.icons8.com/color/96/checkmark.png" className="w-5 h-5" alt="received" /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useCountdown(endTimes: string[]) {
  const [timeLefts, setTimeLefts] = useState<string[]>([]);
  const endTimesKey = useMemo(() => JSON.stringify(endTimes), [endTimes]);

  useEffect(() => {
    const times: string[] = JSON.parse(endTimesKey);
    if (times.length === 0) { setTimeLefts([]); return; }

    function calc() {
      return times.map((endTime: string) => {
        const diff = new Date(endTime).getTime() - Date.now();
        if (diff <= 0) return "Kết thúc";
        const d = Math.floor(diff / 86400000);
        const h = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, "0");
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
        return d > 0 ? `${d}d ${h}:${m}:${s}` : `${h}:${m}:${s}`;
      });
    }
    setTimeLefts(calc());
    const timer = setInterval(() => setTimeLefts(calc()), 1000);
    return () => clearInterval(timer);
  }, [endTimesKey]);

  return timeLefts;
}

// ═════════════════════════════════════════════════════════════════════════════
function WonAuctionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as OrderTab | null;
  const initialTab = tabParam && ["bidding", "won", "delivering", "received"].includes(tabParam)
    ? tabParam
    : "bidding";

  const [activeTab, setActiveTab] = useState<OrderTab>(initialTab);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ totalPages: number; total: number } | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const handleTabChange = (tab: OrderTab) => {
    setActiveTab(tab);
    setPage(1);
    router.replace(`?tab=${tab}`, { scroll: false });
  };

  useEffect(() => {
    if (initialTab !== activeTab) {
      setActiveTab(initialTab);
      setPage(1);
    }
  }, [initialTab]);

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryConfirmTarget, setDeliveryConfirmTarget] = useState<string | null>(null);
  const [deliveryConfirmLoading, setDeliveryConfirmLoading] = useState(false);
  const [deliverySuccess, setDeliverySuccess] = useState(false);

  // Review states
  const [reviewTarget, setReviewTarget] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Dispute states
  const [disputeTarget, setDisputeTarget] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState(false);

  useEffect(() => {
    if (deliverySuccess) {
      const timer = setTimeout(() => setDeliverySuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [deliverySuccess]);

  useEffect(() => {
    if (reviewSuccess) {
      const timer = setTimeout(() => setReviewSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [reviewSuccess]);

  useEffect(() => {
    if (disputeSuccess) {
      const timer = setTimeout(() => setDisputeSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [disputeSuccess]);

  const endTimes = useMemo(() => (activeTab === "bidding" ? orders.map(o => o.date) : []), [orders, activeTab]);
  const timeLefts = useCountdown(endTimes);

  const fetchAuctions = useCallback(() => {
    setIsLoading(true);
    userApi.getParticipatedAuctions(activeTab, page, 10)
      .then((res) => {
        if (res?.data) {
          setOrders(res.data);
          setMeta(res.meta);
          setCounts(res.counts || {});
        }
      })
      .catch((err) => console.error("Error fetching auctions:", err))
      .finally(() => {
        setIsLoading(false);
      });
  }, [activeTab, page]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const handleReceive = async (paymentId: string) => {
    if (!paymentId) return;
    setDeliveryConfirmLoading(true);
    try {
      await paymentApi.confirmDelivery(paymentId);
      setDeliverySuccess(true);
      setDeliveryConfirmTarget(null);
      fetchAuctions(); // refetch to update status
    } catch (err: any) {
      alert(err.message || "Có lỗi xảy ra khi xác nhận");
    } finally {
      setDeliveryConfirmLoading(false);
    }
  };

  const handleReview = async () => {
    if (!reviewTarget) return;
    setReviewLoading(true);
    try {
      await auctionApi.reviewSeller(reviewTarget, {
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewSuccess(true);
      setReviewTarget(null);
      setReviewRating(5);
      setReviewComment("");
      fetchAuctions();
    } catch (err: any) {
      alert(err.message || "Có lỗi xảy ra khi gửi đánh giá");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeTarget || !disputeReason.trim()) return;
    if (disputeReason.trim().length < 10) {
      alert("Lý do khiếu nại phải dài ít nhất 10 ký tự");
      return;
    }
    setDisputeLoading(true);
    try {
      await paymentApi.openDispute(disputeTarget, disputeReason);
      setDisputeSuccess(true);
      setDisputeTarget(null);
      setDisputeReason("");
      fetchAuctions();
    } catch (err: any) {
      alert(err.message || "Có lỗi xảy ra khi gửi khiếu nại");
    } finally {
      setDisputeLoading(false);
    }
  };

  const tabCounts = TABS.map(t => ({ ...t, count: counts[t.key] || 0 }));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <h1 className="text-2xl font-bold text-foreground mb-6">Sản phẩm đấu giá</h1>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-6 border-b border-border">
          {tabCounts.map(tab => (
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
              {tab.count > 0 && (
                <span className={`min-w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5
                  ${activeTab === tab.key ? "bg-[#E25C24] text-white" : "bg-muted text-muted-foreground"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#E25C24] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order, idx) => {
              const isExpired = order.paymentStatus === "failed" || 
                (order.paymentDeadline ? new Date() > new Date(order.paymentDeadline) : new Date() > new Date(new Date(order.date).getTime() + 48 * 60 * 60 * 1000));
              return (
                <div
                  key={order.id}
                  onClick={() => {
                    if (order.status === "won" && !order.isPaid && order.paymentStatus !== "refunded" && isExpired) {
                      router.push(`/checkout/${order.id}`);
                    } else {
                      router.push(`/auction/${order.id}`);
                    }
                  }}
                  className="group flex flex-col sm:flex-row items-start gap-4 rounded-xl border-2 border-slate-200 bg-white p-4 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#E2B9A1] transition-all cursor-pointer relative"
                >
                  {/* Image */}
                  <div className="relative flex-shrink-0 w-full sm:w-28 aspect-square rounded-lg border-2 border-slate-100 overflow-hidden">
                    <Image src={order.image} alt={order.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 w-full flex flex-col justify-between h-full">
                    <div className="flex items-start justify-between gap-4 w-full">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="text-base font-bold text-slate-800 line-clamp-2">
                          {order.name}
                        </div>
                        <p className="text-xs font-medium text-slate-500">Chủ đấu giá: {order.seller}</p>
                      </div>

                      {/* Action Buttons per status - moved to top right */}
                      {(order.status === "won" || order.status === "received" || order.status === "delivering") && (
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {order.status === "won" && (
                            order.paymentStatus === "refunded" ? (
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-600 border-2 border-emerald-100 cursor-default"
                              >
                                Đã hoàn tiền
                              </button>
                            ) : order.isPaid ? (
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-600 border-2 border-emerald-100 cursor-default"
                              >
                                Đã thanh toán
                              </button>
                            ) : isExpired ? (
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-500 border-2 border-slate-200 cursor-default"
                              >
                                Hết hạn thanh toán
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/checkout/${order.id}`);
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg border-2 border-emerald-500 bg-emerald-500 text-white shadow-[2px_2px_0px_#059669] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#059669] transition-all"
                              >
                                <CreditCard className="w-3.5 h-3.5" /> Thanh toán
                              </button>
                            )
                          )}
                          {order.status === "delivering" && (
                            order.dispute ? (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/disputes/${order.dispute?.id}`);
                                }}
                                className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold rounded-lg border-2 min-w-[120px] text-center cursor-pointer hover:scale-105 active:scale-95 transition-all
                                ${order.dispute.status === 'opened' || order.dispute.status === 'under_review'
                                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                                  : order.dispute.status === 'resolved_buyer'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                    : 'bg-slate-50 border-slate-200 text-slate-500'
                                }`}
                                title={order.dispute.reason}
                              >
                                {order.dispute.status === 'opened' && 'Đang khiếu nại'}
                                {order.dispute.status === 'under_review' && 'Đang xem xét'}
                                {order.dispute.status === 'resolved_buyer' && 'Khiếu nại thành công'}
                                {order.dispute.status === 'resolved_seller' && 'Khiếu nại thất bại'}
                              </span>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (order.paymentId) {
                                      setDeliveryConfirmTarget(order.paymentId);
                                    } else {
                                      alert("Không tìm thấy thông tin thanh toán");
                                    }
                                  }}
                                  className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg border-2 border-blue-500 bg-blue-500 text-white shadow-[2px_2px_0px_#2563eb] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#2563eb] transition-all min-w-[120px]"
                                >
                                  <Package className="w-3.5 h-3.5" /> Đã nhận
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (order.paymentId) {
                                      setDisputeTarget(order.paymentId);
                                    } else {
                                      alert("Không tìm thấy thông tin thanh toán");
                                    }
                                  }}
                                  className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg border-2 border-red-500 bg-white text-red-500 hover:bg-red-50 transition-all min-w-[120px]"
                                >
                                  Khiếu nại
                                </button>
                              </div>
                            )
                          )}
                          {order.status === "received" && (
                            <div className="flex flex-col gap-2">
                              {/* Review button or reviewed indicator */}
                              {order.hasReviewed ? (
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  disabled
                                  className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold rounded-lg border-2 border-orange-200 bg-orange-50 text-[#E25C24] cursor-default min-w-[120px]"
                                >
                                  Đã đánh giá
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReviewTarget(order.id);
                                  }}
                                  className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg border-2 border-[#E25C24] bg-[#E25C24] text-white shadow-[2px_2px_0px_#E2B9A1] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#E2B9A1] transition-all min-w-[120px]"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" /> Đánh giá
                                </button>
                              )}

                              {/* Dispute status badge or Open dispute button */}
                              {order.dispute ? (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/disputes/${order.dispute?.id}`);
                                  }}
                                  className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold rounded-lg border-2 min-w-[120px] text-center cursor-pointer hover:scale-105 active:scale-95 transition-all
                                    ${order.dispute.status === 'opened' || order.dispute.status === 'under_review'
                                      ? 'bg-amber-50 border-amber-200 text-amber-600'
                                      : order.dispute.status === 'resolved_buyer'
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                        : 'bg-slate-50 border-slate-200 text-slate-500'
                                    }`}
                                  title={order.dispute.reason}
                                >
                                  {order.dispute.status === 'opened' && 'Đang khiếu nại'}
                                  {order.dispute.status === 'under_review' && 'Đang xem xét'}
                                  {order.dispute.status === 'resolved_buyer' && 'Khiếu nại thành công'}
                                  {order.dispute.status === 'resolved_seller' && 'Khiếu nại thất bại'}
                                </span>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (order.paymentId) {
                                      setDisputeTarget(order.paymentId);
                                    } else {
                                      alert("Không tìm thấy thông tin thanh toán");
                                    }
                                  }}
                                  className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg border-2 border-red-500 bg-white text-red-500 hover:bg-red-50 transition-all min-w-[120px]"
                                >
                                  Khiếu nại
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 mt-auto pt-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-lg font-extrabold text-[#E25C24]">{order.currentPrice}</p>
                        {order.status === "bidding" && order.myBid && (
                          <span className="text-xs font-medium text-slate-500">
                            (Giá của bạn: <span className="text-slate-700">{order.myBid}</span>)
                          </span>
                        )}
                      </div>

                      {order.status === "bidding" ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          Còn lại: {timeLefts[idx] || "Đang tải..."}
                        </span>
                      ) : order.status === "delivering" ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                          <Truck className="w-3.5 h-3.5" />
                          Thời gian giao hàng dự kiến: {order.deliveryCountdown || "3-5 ngày"}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          {order.timeLeft || new Date(order.date).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-muted-foreground/20 mx-auto" />
            <h3 className="text-lg font-semibold text-foreground mt-4">Không có đơn hàng</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === "bidding" && "Bạn chưa tham gia phiên đấu giá nào."}
              {activeTab === "won" && "Bạn chưa thắng phiên đấu giá nào."}
              {activeTab === "delivering" && "Không có đơn hàng nào đang giao."}
              {activeTab === "received" && "Chưa có đơn hàng nào đã nhận."}
            </p>
            <button
              onClick={() => router.push("/live")}
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-lg bg-[#E25C24] text-white text-sm font-medium hover:bg-[#E25C24]/90 transition-colors"
            >
              Khám phá đấu giá
            </button>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 pb-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border-2 border-slate-200 text-slate-500 hover:border-[#E25C24] hover:text-[#E25C24] disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-lg border-2 font-bold transition-all ${page === p
                    ? "bg-[#E25C24] border-[#E25C24] text-white shadow-[2px_2px_0px_#E2B9A1]"
                    : "border-slate-200 text-slate-600 hover:border-[#E25C24] hover:text-[#E25C24]"
                  }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="p-2 rounded-lg border-2 border-slate-200 text-slate-500 hover:border-[#E25C24] hover:text-[#E25C24] disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Success Toast Notification - Top Right */}
        {deliverySuccess && (
          <div className="fixed top-6 right-6 z-[200] animate-slide-in-right">
            <div className="flex items-center gap-3 bg-white border-2 border-green-300 px-5 py-3.5 rounded-xl shadow-[4px_4px_0px_#86efac] min-w-[280px]">
              <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-green-600 text-lg">check</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">Thành công!</p>
                <p className="text-xs text-slate-500 mt-0.5">Xác nhận đã nhận hàng thành công</p>
              </div>
              <button onClick={() => setDeliverySuccess(false)} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {deliveryConfirmTarget && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
            onClick={() => setDeliveryConfirmTarget(null)}
          >
            <div 
              className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-slate-800 mb-2">Xác nhận đã nhận hàng</h3>
              <p className="text-sm text-slate-500 mb-6">
                Bạn xác nhận đã nhận được sản phẩm đúng như mô tả? Tiền sẽ được chuyển cho người bán và không thể hoàn lại sau khi xác nhận.
              </p>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => setDeliveryConfirmTarget(null)}
                  disabled={deliveryConfirmLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleReceive(deliveryConfirmTarget)}
                  disabled={deliveryConfirmLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors shadow-[2px_2px_0px_#2563eb] hover:shadow-[3px_3px_0px_#2563eb] disabled:opacity-50 disabled:shadow-none disabled:translate-y-0.5"
                >
                  {deliveryConfirmLoading ? "Đang xử lý..." : "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Success Toast Notification */}
        {reviewSuccess && (
          <div className="fixed top-24 right-6 z-[200] animate-slide-in-right">
            <div className="flex items-center gap-3 bg-white border-2 border-green-300 px-5 py-3.5 rounded-xl shadow-[4px_4px_0px_#86efac] min-w-[280px]">
              <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-green-600 text-lg">check</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">Thành công!</p>
                <p className="text-xs text-slate-500 mt-0.5">Cảm ơn bạn đã gửi đánh giá</p>
              </div>
              <button onClick={() => setReviewSuccess(false)} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Review Dialog */}
        {reviewTarget && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
            onClick={() => {
              setReviewTarget(null);
              setReviewRating(5);
              setReviewComment("");
            }}
          >
            <div 
              className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Đánh giá</h3>

              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">Chất lượng dịch vụ</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`p-1 transition-all hover:scale-110 ${reviewRating >= star ? "text-yellow-400" : "text-slate-200"}`}
                    >
                      <Star className="w-8 h-8 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Nhận xét chi tiết</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Người bán thân thiện, giao hàng nhanh chóng..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-200 focus:ring-0 outline-none transition-colors text-sm min-h-[100px] resize-none"
                />
              </div>

              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => {
                    setReviewTarget(null);
                    setReviewRating(5);
                    setReviewComment("");
                  }}
                  disabled={reviewLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleReview}
                  disabled={reviewLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-[#E25C24] hover:bg-[#c94d1b] rounded-lg transition-colors shadow-[2px_2px_0px_#E2B9A1] hover:shadow-[3px_3px_0px_#E2B9A1] disabled:opacity-50 disabled:shadow-none disabled:translate-y-0.5"
                >
                  {reviewLoading ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dispute Success Toast Notification */}
        {disputeSuccess && (
          <div className="fixed top-24 right-6 z-[200] animate-slide-in-right">
            <div className="flex items-center gap-3 bg-white border-2 border-green-300 px-5 py-3.5 rounded-xl shadow-[4px_4px_0px_#86efac] min-w-[280px]">
              <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-green-600 text-lg">check</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">Thành công!</p>
                <p className="text-xs text-slate-500 mt-0.5">Gửi yêu cầu khiếu nại thành công</p>
              </div>
              <button onClick={() => setDisputeSuccess(false)} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Dispute Dialog */}
        {disputeTarget && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
            onClick={() => {
              setDisputeTarget(null);
              setDisputeReason("");
            }}
          >
            <div 
              className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Gửi khiếu nại đơn hàng</h3>
              <p className="text-sm text-slate-500 mb-4">
                Vui lòng cung cấp lý do khiếu nại chi tiết (sản phẩm không đúng mô tả, hư hỏng hoặc không nhận được hàng). Ban quản trị sẽ xác minh để giải quyết tranh chấp.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Lý do khiếu nại <span className="text-red-500">*</span></label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Sản phẩm nhận được bị nứt vỡ ở mặt kính, không hoạt động..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-200 focus:ring-0 outline-none transition-colors text-sm min-h-[120px] resize-none"
                />
              </div>

              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => {
                    setDisputeTarget(null);
                    setDisputeReason("");
                  }}
                  disabled={disputeLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDispute}
                  disabled={disputeLoading || disputeReason.trim().length < 10}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-[2px_2px_0px_#fca5a5] hover:shadow-[3px_3px_0px_#fca5a5] disabled:opacity-50 disabled:shadow-none disabled:translate-y-0.5"
                >
                  {disputeLoading ? "Đang gửi..." : "Gửi khiếu nại"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WonAuctionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#E25C24] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <WonAuctionsContent />
    </Suspense>
  );
}

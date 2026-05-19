"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
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

import { userApi } from "@/lib/api";

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
  deliveryCountdown?: string;
}

const TABS: { key: OrderTab; label: string; icon: React.ReactNode }[] = [
  { key: "bidding", label: "Đang đấu giá", icon: <Gavel className="w-4 h-4" /> },
  { key: "won", label: "Đã thắng", icon: <Trophy className="w-4 h-4" /> },
  { key: "delivering", label: "Đang giao hàng", icon: <Truck className="w-4 h-4" /> },
  { key: "received", label: "Đã nhận", icon: <CheckCircle2 className="w-4 h-4" /> },
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

  const [receivedOrders, setReceivedOrders] = useState<string[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const endTimes = useMemo(() => (activeTab === "bidding" ? orders.map(o => o.date) : []), [orders, activeTab]);
  const timeLefts = useCountdown(endTimes);

  React.useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    userApi.getParticipatedAuctions(activeTab, page, 10)
      .then((res) => {
        if (isMounted && res?.data) {
          setOrders(res.data);
          setMeta(res.meta);
          setCounts(res.counts || {});
        }
      })
      .catch((err) => console.error("Error fetching auctions:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
      
    return () => {
      isMounted = false;
    };
  }, [activeTab, page]);
  
  const handleReceive = (id: string) => {
    setReceivedOrders(prev => [...prev, id]);
    // TODO: Call API to update status
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
              return (
                <div 
                  key={order.id} 
                  onClick={() => router.push(`/auction/${order.id}`)}
                  className="group flex flex-col sm:flex-row items-start gap-4 rounded-xl border-2 border-slate-200 bg-white p-4 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#E2B9A1] transition-all cursor-pointer relative"
                >
                  {/* Image */}
                  <div className="relative flex-shrink-0 w-full sm:w-28 aspect-square rounded-lg border-2 border-slate-100 overflow-hidden">
                    <Image src={order.image} alt={order.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 w-full flex flex-col justify-between h-full">
                    <div className="flex items-start justify-between gap-4 w-full">
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-slate-800 line-clamp-2">
                          {order.name}
                        </div>
                        <p className="text-xs font-medium text-slate-500 mt-1">Chủ đấu giá: {order.seller}</p>
                      </div>

                      {/* Action Buttons per status - moved to top right */}
                      {(order.status === "won" || order.status === "received") && (
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {order.status === "won" && (
                            order.isPaid ? (
                              <button 
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-600 border-2 border-emerald-100 cursor-default"
                              >
                                Đã thanh toán
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
                          {order.status === "received" && (
                            <>
                              {receivedOrders.includes(order.id) ? (
                                <span className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-600 border-2 border-emerald-100 cursor-default w-[150px]">
                                  Đã nhận sản phẩm
                                </span>
                              ) : (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReceive(order.id);
                                  }}
                                  className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg border-2 border-blue-500 bg-blue-500 text-white shadow-[2px_2px_0px_#2563eb] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#2563eb] transition-all w-[150px]"
                                >
                                  <Package className="w-3.5 h-3.5" /> Đã nhận
                                </button>
                              )}
                              <button 
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg border-2 border-[#E25C24] bg-[#E25C24] text-white shadow-[2px_2px_0px_#E2B9A1] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#E2B9A1] transition-all w-[150px]"
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> Đánh giá
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 mt-3">
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
                          Thời gian đơn hàng tới: {order.deliveryCountdown}
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
                className={`w-10 h-10 rounded-lg border-2 font-bold transition-all ${
                  page === p 
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

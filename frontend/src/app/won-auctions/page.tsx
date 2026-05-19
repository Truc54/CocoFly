"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Gavel,
  Clock,
  CreditCard,
  CheckCircle2,
  Package,
  Truck,
  MessageSquare,
} from "lucide-react";

// ─── Types & Config ──────────────────────────────────────────────────────────
type OrderTab = "bidding" | "won" | "delivering" | "received";

interface OrderItem {
  id: number;
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

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_ORDERS: OrderItem[] = [
  { id: 1, name: "iPhone 15 Pro Max 256GB", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&h=300&fit=crop", currentPrice: "28.500.000đ", seller: "Tech Store", date: "2024-03-25", status: "bidding", timeLeft: "2h 15m", myBid: "28.500.000đ" },
  { id: 2, name: "Samsung Galaxy S24 Ultra", image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&h=300&fit=crop", currentPrice: "22.000.000đ", seller: "Mobile World", date: "2024-03-24", status: "bidding", timeLeft: "5h 30m", myBid: "20.000.000đ" },
  { id: 3, name: "MacBook Air M3 2024", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop", currentPrice: "25.000.000đ", seller: "Apple Store VN", date: "2024-03-23", status: "won", isPaid: false },
  { id: 4, name: "AirPods Pro 2nd Gen", image: "https://images.unsplash.com/photo-1588423771073-b8903fba77ac?w=300&h=300&fit=crop", currentPrice: "4.200.000đ", seller: "Audio Zone", date: "2024-03-22", status: "won", isPaid: true },
  { id: 5, name: "Sony WH-1000XM5", image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=300&h=300&fit=crop", currentPrice: "6.500.000đ", seller: "Sound Pro", date: "2024-03-20", status: "delivering", deliveryCountdown: "2 ngày 5 giờ" },
  { id: 6, name: "Bàn phím cơ Keychron K8", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=300&fit=crop", currentPrice: "2.100.000đ", seller: "KeyboardVN", date: "2024-03-18", status: "received" },
];

// ═════════════════════════════════════════════════════════════════════════════
export default function WonAuctionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderTab>("bidding");
  const [receivedOrders, setReceivedOrders] = useState<number[]>([]);
  
  const handleReceive = (id: number) => {
    setReceivedOrders(prev => [...prev, id]);
  };
  
  const filtered = MOCK_ORDERS.filter(o => o.status === activeTab);
  const tabCounts = TABS.map(t => ({ ...t, count: MOCK_ORDERS.filter(o => o.status === t.key).length }));

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
              onClick={() => setActiveTab(tab.key)}
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
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(order => {
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
                      
                      {order.status === "delivering" ? (
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
      </div>
    </div>
  );
}

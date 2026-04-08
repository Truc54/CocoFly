"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  Gavel,
  Clock,
  CreditCard,
  CheckCircle2,
  XCircle,
  Package,
  ArrowRight,
  Truck,
  MessageSquare,
} from "lucide-react";

// ─── Types & Config ──────────────────────────────────────────────────────────
type OrderTab = "bidding" | "won" | "payment" | "completed" | "lost";

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
}

const TABS: { key: OrderTab; label: string; icon: React.ReactNode }[] = [
  { key: "bidding", label: "Đang đấu giá", icon: <Gavel className="w-4 h-4" /> },
  { key: "won", label: "Đã thắng", icon: <Trophy className="w-4 h-4" /> },
  { key: "payment", label: "Chờ thanh toán", icon: <CreditCard className="w-4 h-4" /> },
  { key: "completed", label: "Hoàn thành", icon: <CheckCircle2 className="w-4 h-4" /> },
  { key: "lost", label: "Đã thua", icon: <XCircle className="w-4 h-4" /> },
];

const STATUS_BADGES: Record<OrderTab, { label: string; className: string }> = {
  bidding: { label: "Đang đấu giá", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  won: { label: "Đã thắng", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  payment: { label: "Chờ thanh toán", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  completed: { label: "Hoàn thành", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  lost: { label: "Đã thua", className: "bg-muted text-muted-foreground border-border" },
};

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_ORDERS: OrderItem[] = [
  { id: 1, name: "iPhone 15 Pro Max 256GB", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&h=300&fit=crop", currentPrice: "28.500.000đ", seller: "Tech Store", date: "2024-03-25", status: "bidding", timeLeft: "2h 15m", myBid: "28.500.000đ" },
  { id: 2, name: "Samsung Galaxy S24 Ultra", image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&h=300&fit=crop", currentPrice: "22.000.000đ", seller: "Mobile World", date: "2024-03-24", status: "bidding", timeLeft: "5h 30m", myBid: "20.000.000đ" },
  { id: 3, name: "MacBook Air M3 2024", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop", currentPrice: "25.000.000đ", seller: "Apple Store VN", date: "2024-03-23", status: "won" },
  { id: 4, name: "AirPods Pro 2nd Gen", image: "https://images.unsplash.com/photo-1588423771073-b8903fba77ac?w=300&h=300&fit=crop", currentPrice: "4.200.000đ", seller: "Audio Zone", date: "2024-03-22", status: "payment" },
  { id: 5, name: "Sony WH-1000XM5", image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=300&h=300&fit=crop", currentPrice: "6.500.000đ", seller: "Sound Pro", date: "2024-03-20", status: "completed" },
  { id: 6, name: "Bàn phím cơ Keychron K8", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=300&fit=crop", currentPrice: "2.100.000đ", seller: "KeyboardVN", date: "2024-03-18", status: "completed" },
  { id: 7, name: "Nike Air Jordan 1 Retro", image: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=300&h=300&fit=crop", currentPrice: "8.200.000đ", seller: "Sneaker Hub", date: "2024-03-15", status: "lost", myBid: "7.500.000đ" },
  { id: 8, name: "Đồng hồ Casio G-Shock", image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=300&h=300&fit=crop", currentPrice: "3.400.000đ", seller: "Watch Store", date: "2024-03-10", status: "lost", myBid: "3.000.000đ" },
];

// ═════════════════════════════════════════════════════════════════════════════
export default function WonAuctionsPage() {
  const [activeTab, setActiveTab] = useState<OrderTab>("bidding");
  const filtered = MOCK_ORDERS.filter(o => o.status === activeTab);
  const tabCounts = TABS.map(t => ({ ...t, count: MOCK_ORDERS.filter(o => o.status === t.key).length }));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <h1 className="text-2xl font-bold text-foreground mb-6">Đơn mua của tôi</h1>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-6 border-b border-border">
          {tabCounts.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all
                ${activeTab === tab.key
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
                }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className={`min-w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5
                  ${activeTab === tab.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
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
              const badge = STATUS_BADGES[order.status];
              return (
                <div key={order.id} className="group flex flex-col sm:flex-row items-start gap-4 rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-shadow">
                  {/* Image */}
                  <Link href={`/auction/${order.id}`} className="relative flex-shrink-0 w-full sm:w-24 aspect-square rounded-xl overflow-hidden">
                    <Image src={order.image} alt={order.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/auction/${order.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
                          {order.name}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">Người bán: {order.seller}</p>
                      </div>
                      <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md border ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <p className="text-base font-bold text-primary">{order.currentPrice}</p>
                      {order.myBid && order.status !== "won" && (
                        <span className="text-xs text-muted-foreground">
                          Giá của bạn: <span className="font-medium text-foreground">{order.myBid}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {order.timeLeft || new Date(order.date).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    {/* Action Buttons per status */}
                    <div className="flex items-center gap-2 mt-3">
                      {order.status === "bidding" && (
                        <Link href={`/auction/${order.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                          <Gavel className="w-3 h-3" /> Xem phiên đấu giá
                        </Link>
                      )}
                      {order.status === "won" && (
                        <Link href={`/auction/${order.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors">
                          <Trophy className="w-3 h-3" /> Xem chi tiết
                        </Link>
                      )}
                      {order.status === "payment" && (
                        <Link href={`/checkout/${order.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors">
                          <CreditCard className="w-3 h-3" /> Thanh toán ngay
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                      {order.status === "completed" && (
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors">
                          <MessageSquare className="w-3 h-3" /> Đánh giá
                        </button>
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
              {activeTab === "payment" && "Không có đơn hàng nào chờ thanh toán."}
              {activeTab === "completed" && "Chưa có giao dịch hoàn thành."}
              {activeTab === "lost" && "Không có phiên đấu giá nào bạn đã thua."}
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

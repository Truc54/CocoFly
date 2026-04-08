"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Clock,
  AlertTriangle,
  TrendingUp,
  Trash2,
  Gavel,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── Types ───────────────────────────────────────────────────────────────────
type BidStatus = "leading" | "outbid" | "ended";

interface WatchlistItem {
  id: number;
  name: string;
  image: string;
  currentPrice: string;
  timeLeft: string;
  bidStatus: BidStatus;
  totalBids: number;
  myBid?: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_WATCHLIST: WatchlistItem[] = [
  { id: 1, name: "iPhone 15 Pro Max 256GB - Titan Xanh", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop", currentPrice: "28.500.000đ", timeLeft: "2h 15m", bidStatus: "leading", totalBids: 12, myBid: "28.500.000đ" },
  { id: 2, name: "MacBook Air M3 2024 - Midnight", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop", currentPrice: "25.000.000đ", timeLeft: "5h 30m", bidStatus: "outbid", totalBids: 8, myBid: "23.000.000đ" },
  { id: 3, name: "Sony WH-1000XM5 Headphones", image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop", currentPrice: "6.800.000đ", timeLeft: "1d 3h", bidStatus: "leading", totalBids: 5, myBid: "6.800.000đ" },
  { id: 4, name: "Nike Air Jordan 1 Retro High OG", image: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400&h=400&fit=crop", currentPrice: "8.200.000đ", timeLeft: "45m", bidStatus: "outbid", totalBids: 22, myBid: "7.500.000đ" },
  { id: 5, name: "Đồng hồ Casio G-Shock GA-2100", image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&h=400&fit=crop", currentPrice: "3.400.000đ", timeLeft: "Đã kết thúc", bidStatus: "ended", totalBids: 15 },
];

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<BidStatus, { label: string; className: string; icon: React.ReactNode }> = {
  leading: { label: "Đang dẫn đầu", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: <TrendingUp className="w-3 h-3" /> },
  outbid: { label: "Bị vượt giá", className: "bg-red-500/10 text-red-600 border-red-500/20 animate-pulse", icon: <AlertTriangle className="w-3 h-3" /> },
  ended: { label: "Đã kết thúc", className: "bg-muted text-muted-foreground border-border", icon: <Clock className="w-3 h-3" /> },
};

// ═════════════════════════════════════════════════════════════════════════════
export default function WatchlistPage() {
  const [items, setItems] = useState(MOCK_WATCHLIST);

  const handleRemove = (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              Watchlist
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {items.length} sản phẩm đang theo dõi
            </p>
          </div>
        </div>

        {/* Items Grid */}
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map(item => {
              const status = STATUS_CONFIG[item.bidStatus];
              const isOutbid = item.bidStatus === "outbid";
              const isEnded = item.bidStatus === "ended";

              return (
                <div
                  key={item.id}
                  className={`group flex flex-col sm:flex-row items-start gap-4 rounded-2xl border bg-card p-4 transition-all hover:shadow-md
                    ${isOutbid ? "border-red-500/30 bg-red-500/[0.02]" : "border-border"}`}
                >
                  {/* Image */}
                  <Link href={`/auction/${item.id}`} className="relative flex-shrink-0 w-full sm:w-28 aspect-square sm:aspect-square rounded-xl overflow-hidden">
                    <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                    {isEnded && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-xs font-bold text-white">ĐÃ KẾT THÚC</span></div>}
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/auction/${item.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2">
                        {item.name}
                      </Link>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Xóa khỏi watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <p className="text-lg font-bold text-primary">{item.currentPrice}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md border ${status.className}`}>
                        {status.icon} {status.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.timeLeft}
                      </span>
                      <span className="flex items-center gap-1">
                        <Gavel className="w-3 h-3" />
                        {item.totalBids} lượt đặt giá
                      </span>
                      {item.myBid && (
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          Giá của bạn: <span className="font-medium text-foreground">{item.myBid}</span>
                        </span>
                      )}
                    </div>

                    {/* CTA for outbid */}
                    {isOutbid && (
                      <Link
                        href={`/auction/${item.id}`}
                        className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        <Gavel className="w-3 h-3" />
                        Đặt giá lại ngay
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-muted-foreground/20 mx-auto" />
            <h3 className="text-lg font-semibold text-foreground mt-4">Chưa có sản phẩm nào</h3>
            <p className="text-sm text-muted-foreground mt-1">Hãy thêm sản phẩm vào watchlist để theo dõi biến động giá.</p>
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

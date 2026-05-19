"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Clock,
  Calendar,
  Gavel,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── Types ───────────────────────────────────────────────────────────────────
type BidStatus = "ongoing" | "upcoming" | "ended";

interface WatchlistItem {
  id: number;
  name: string;
  image: string;
  currentPrice: string;
  timeLeft: string;
  status: BidStatus;
  totalBids?: number;
  myBid?: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_WATCHLIST: WatchlistItem[] = [
  { id: 1, name: "iPhone 15 Pro Max 256GB - Titan Xanh", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&h=300&fit=crop", currentPrice: "28.500.000đ", timeLeft: "2h 15m", status: "ongoing", totalBids: 12, myBid: "28.500.000đ" },
  { id: 2, name: "MacBook Air M3 2024 - Midnight", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop", currentPrice: "25.000.000đ", timeLeft: "5h 30m", status: "ongoing", totalBids: 8, myBid: "23.000.000đ" },
  { id: 3, name: "Sony PlayStation 5 (PS5) Standard", image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300&h=300&fit=crop", currentPrice: "10.000.000đ", timeLeft: "Dự kiến: 2024-05-26 14:00", status: "upcoming" },
  { id: 4, name: "Sony WH-1000XM5 Headphones", image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=300&h=300&fit=crop", currentPrice: "6.800.000đ", timeLeft: "1d 3h", status: "ongoing", totalBids: 5, myBid: "6.800.000đ" },
  { id: 5, name: "Đồng hồ Casio G-Shock GA-2100", image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=300&h=300&fit=crop", currentPrice: "3.400.000đ", timeLeft: "Kết thúc: 2024-05-10", status: "ended", totalBids: 15 },
];

// ═════════════════════════════════════════════════════════════════════════════
export default function WatchlistPage() {
  const router = useRouter();
  const [items, setItems] = useState(MOCK_WATCHLIST);

  const [animatingId, setAnimatingId] = useState<number | null>(null);

  const handleRemove = (id: number) => {
    setAnimatingId(id);
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id));
      setAnimatingId(null);
    }, 300);
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
          </div>
        </div>

        {/* Items Grid */}
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map(item => {
              const isEnded = item.status === "ended";
              const isUpcoming = item.status === "upcoming";

              return (
                <div
                  key={item.id}
                  onClick={() => router.push(`/auction/${item.id}`)}
                  className={`group flex flex-col sm:flex-row items-start gap-4 rounded-xl border-2 border-slate-200 bg-white p-4 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#E2B9A1] transition-all cursor-pointer relative
                    ${animatingId === item.id ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
                >
                  {/* Image */}
                  <Link href={`/auction/${item.id}`} className="relative flex-shrink-0 w-full sm:w-28 aspect-square rounded-lg border-2 border-slate-100 overflow-hidden bg-slate-50">
                    <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                    {isEnded && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-xs font-bold text-white">ĐÃ KẾT THÚC</span></div>}
                    {isUpcoming && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-xs font-bold text-white">SẮP DIỄN RA</span></div>}
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0 w-full flex justify-between gap-4 sm:min-h-[88px]">
                    {/* Left Info */}
                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <Link href={`/auction/${item.id}`} className="text-base font-bold text-slate-800 line-clamp-2">
                          {item.name}
                        </Link>
                        {item.totalBids !== undefined && (
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                              <Gavel className="w-3.5 h-3.5" />
                              {item.totalBids} lượt đặt giá
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 mt-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-lg font-extrabold text-[#E25C24]">{item.currentPrice}</p>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                          {item.status === "ongoing" ? (
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="font-bold">Còn {item.timeLeft}</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {item.timeLeft}
                            </span>
                          )}
                          
                          {item.myBid && (
                            <span className="flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5" />
                              Giá của bạn: <span className="font-bold text-slate-700">{item.myBid}</span>
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
                        className="flex-shrink-0 p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors focus:outline-none"
                        title="Bỏ theo dõi"
                      >
                        <Heart className="w-5 h-5 fill-current" />
                      </button>
                    </div>
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

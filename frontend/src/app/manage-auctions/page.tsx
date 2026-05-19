"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  MessageSquare,
  Plus,
  Clock,
  Truck
} from "lucide-react";

// ─── Types & Config ──────────────────────────────────────────────────────────
type AuctionTab = "ongoing" | "upcoming" | "ended";

interface AuctionItem {
  id: number;
  name: string;
  image: string;
  currentPrice?: string;
  startPrice?: string;
  finalPrice?: string;
  date: string;
  status: AuctionTab;
  timeLeft?: string;
  bidsCount?: number;
  viewCount?: number;
  winner?: string;
}

const TABS: { key: AuctionTab; label: string; icon: React.ReactNode }[] = [
  { key: "ongoing", label: "Đang diễn ra", icon: <Activity className="w-4 h-4" /> },
  { key: "upcoming", label: "Sắp diễn ra", icon: <Calendar className="w-4 h-4" /> },
  { key: "ended", label: "Đã kết thúc", icon: <CheckCircle2 className="w-4 h-4" /> },
];

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_AUCTIONS: AuctionItem[] = [
  { 
    id: 1, 
    name: "iPhone 15 Pro Max 256GB - Titan Tự nhiên", 
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&h=300&fit=crop", 
    currentPrice: "28.500.000đ", 
    date: "Bắt đầu: 2024-05-18", 
    status: "ongoing", 
    timeLeft: "2h 15m", 
    bidsCount: 15,
    viewCount: 142
  },
  { 
    id: 2, 
    name: "Samsung Galaxy S24 Ultra", 
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&h=300&fit=crop", 
    currentPrice: "22.000.000đ", 
    date: "Bắt đầu: 2024-05-19", 
    status: "ongoing", 
    timeLeft: "5h 30m", 
    bidsCount: 8,
    viewCount: 89
  },
  { 
    id: 3, 
    name: "MacBook Air M3 2024 16GB/512GB", 
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop", 
    startPrice: "25.000.000đ", 
    date: "Dự kiến: 2024-05-25 10:00", 
    status: "upcoming", 
    viewCount: 45
  },
  { 
    id: 4, 
    name: "Sony PlayStation 5 (PS5) Standard", 
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300&h=300&fit=crop", 
    startPrice: "10.000.000đ", 
    date: "Dự kiến: 2024-05-26 14:00", 
    status: "upcoming", 
    viewCount: 12
  },
  { 
    id: 5, 
    name: "Tai nghe Sony WH-1000XM5", 
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=300&h=300&fit=crop", 
    finalPrice: "6.500.000đ", 
    date: "Kết thúc: 2024-05-10", 
    status: "ended", 
    bidsCount: 24,
    winner: "Nguyen Van A"
  },
  { 
    id: 6, 
    name: "Bàn phím cơ Keychron K8 Pro", 
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=300&fit=crop", 
    finalPrice: "2.100.000đ", 
    date: "Kết thúc: 2024-05-08", 
    status: "ended",
    bidsCount: 12,
    winner: "Tran Thi B"
  },
];

// ═════════════════════════════════════════════════════════════════════════════
export default function ManageAuctionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuctionTab>("ongoing");
  const [confirmedDeliveries, setConfirmedDeliveries] = useState<number[]>([]);
  
  const handleConfirmDelivery = (id: number) => {
    setConfirmedDeliveries(prev => [...prev, id]);
  };
  
  const filtered = MOCK_AUCTIONS.filter(o => o.status === activeTab);
  const tabCounts = TABS.map(t => ({ ...t, count: MOCK_AUCTIONS.filter(o => o.status === t.key).length }));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Quản lý đấu giá</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-6 border-b border-border scrollbar-hide">
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

        {/* List */}
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(auction => {
              return (
                <div 
                  key={auction.id} 
                  onClick={() => router.push(`/auction/${auction.id}`)}
                  className="group flex flex-col sm:flex-row items-start gap-4 rounded-xl border-2 border-slate-200 bg-white p-4 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#E2B9A1] transition-all cursor-pointer relative"
                >
                  {/* Image */}
                  <div className="relative flex-shrink-0 w-full sm:w-28 aspect-square rounded-lg border-2 border-slate-100 overflow-hidden bg-slate-50">
                    <Image 
                      src={auction.image} 
                      alt={auction.name} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-300" 
                      unoptimized 
                    />
                  </div>

                  <div className="flex-1 min-w-0 w-full flex justify-between gap-4 sm:min-h-[88px]">
                    
                    {/* Left: Info */}
                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <div className="text-base font-bold text-slate-800 line-clamp-2">
                          {auction.name}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {auction.status === "ongoing" && auction.bidsCount !== undefined && (
                            <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                              <Users className="w-3.5 h-3.5" />
                              {auction.bidsCount} lượt đặt giá
                            </span>
                          )}
                          {auction.status === "ongoing" && (
                            <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                              <Eye className="w-3.5 h-3.5" />
                              {auction.viewCount || 0} lượt xem
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 mt-2">
                        {auction.status === "ended" && auction.winner && (
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-bold text-slate-700">{auction.winner}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {auction.status === "ongoing" && (
                            <p className="text-lg font-extrabold text-[#E25C24]">{auction.currentPrice}</p>
                          )}
                          {auction.status === "upcoming" && (
                            <p className="text-lg font-extrabold text-[#E25C24]">{auction.startPrice}</p>
                          )}
                          {auction.status === "ended" && (
                            <p className="text-lg font-extrabold text-[#E25C24]">{auction.finalPrice}</p>
                          )}
                        </div>
                        
                        {auction.status === "ongoing" ? (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="font-bold">Còn {auction.timeLeft}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {auction.date}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {auction.status === "upcoming" && (
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
                              // Xử lý xóa
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg border-2 border-red-200 bg-red-50 text-red-600 shadow-[2px_2px_0px_#fecaca] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#fecaca] transition-all w-[110px] justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Xóa
                          </button>
                        </>
                      )}
                      {auction.status === "ended" && (
                        <>
                          {confirmedDeliveries.includes(auction.id) ? (
                            <span className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default whitespace-nowrap">
                              Đã xác nhận giao hàng
                            </span>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmDelivery(auction.id);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg border-2 border-[#E25C24] bg-[#E25C24] text-white shadow-[2px_2px_0px_#E2B9A1] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#E2B9A1] transition-all whitespace-nowrap"
                            >
                              <Truck className="w-3.5 h-3.5" /> Xác nhận giao hàng
                            </button>
                          )}
                        </>
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
      </div>
    </div>
  );
}

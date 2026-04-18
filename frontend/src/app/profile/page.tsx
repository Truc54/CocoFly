"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Calendar,
  ShieldCheck,
  Award,
  TrendingUp,
  MessageSquare,
  Clock,
  ThumbsUp,
  ThumbsDown,
  ArrowUpCircle,
  Settings,
  UserPlus,
  Store,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_USER = {
  fullName: "Trực Trần",
  email: "truc@gmail.com",
  role: "buyer" as string,
  avatarUrl: "/default-avatar.svg",
  rating: 4.9,
  totalReviews: 120,
  joinDate: "2024-01-15",
  phoneVerified: true,
  stats: {
    totalTransactions: 45,
    positiveRate: 96,
    avgResponseTime: "2 giờ",
  },
};

const MOCK_LISTINGS = [
  { id: 1, name: "iPhone 15 Pro Max 256GB", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&h=300&fit=crop", currentPrice: "28.500.000đ", timeLeft: "2h 15m", bids: 12 },
  { id: 2, name: "MacBook Air M3 2024", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop", currentPrice: "25.000.000đ", timeLeft: "5h 30m", bids: 8 },
  { id: 3, name: "AirPods Pro 2nd Gen", image: "https://images.unsplash.com/photo-1588423771073-b8903fba77ac?w=300&h=300&fit=crop", currentPrice: "4.200.000đ", timeLeft: "1d 3h", bids: 5 },
];

const MOCK_HISTORY = [
  { id: 1, name: "Đồng hồ Casio G-Shock", finalPrice: "3.200.000đ", date: "2024-03-15", status: "completed" },
  { id: 2, name: "Bàn phím cơ Keychron K8", finalPrice: "2.100.000đ", date: "2024-03-10", status: "completed" },
  { id: 3, name: "Tai nghe Sony WH-1000XM5", finalPrice: "6.500.000đ", date: "2024-02-28", status: "completed" },
];

const MOCK_REVIEWS = [
  { id: 1, author: "Nguyễn Văn A", rating: 5, comment: "Giao dịch nhanh chóng, sản phẩm đúng mô tả. Rất uy tín!", date: "2024-03-20", type: "positive" },
  { id: 2, author: "Trần Thị B", rating: 5, comment: "Đóng gói cẩn thận, giao hàng nhanh. Sẽ ủng hộ lần sau.", date: "2024-03-18", type: "positive" },
  { id: 3, author: "Lê Văn C", rating: 2, comment: "Sản phẩm có vết trầy nhỏ không được đề cập trong mô tả.", date: "2024-03-05", type: "negative" },
  { id: 4, author: "Phạm D", rating: 5, comment: "Người bán rất nhiệt tình, giải đáp thắc mắc nhanh.", date: "2024-02-25", type: "positive" },
];

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/50 dark:bg-muted/30 px-4 py-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Tab Button ──────────────────────────────────────────────────────────────
function TabButton({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2
        ${active
          ? "text-primary border-primary"
          : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
        }`}
    >
      {children}
      {count !== undefined && (
        <span className={`ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] font-bold
          ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"listings" | "history" | "reviews">("history");
  const [reviewFilter, setReviewFilter] = useState<"all" | "positive" | "negative">("all");
  const user = MOCK_USER;
  const isOwnProfile = true; // Toggle for own vs. other profile view
  const isSeller = user.role === "seller";

  const filteredReviews = reviewFilter === "all"
    ? MOCK_REVIEWS
    : MOCK_REVIEWS.filter(r => r.type === reviewFilter);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Profile Header ──────────────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden ring-2 ring-primary/20">
                <Image src={user.avatarUrl} alt={user.fullName} width={96} height={96} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-3 border-card flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{user.fullName}</h1>
                {isSeller && (
                  <Badge variant="default" className="text-xs">
                    SELLER
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-semibold">{user.rating}</span>
                  <span className="text-sm text-muted-foreground">({user.totalReviews} đánh giá)</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  Tham gia {new Date(user.joinDate).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                </div>
                {user.phoneVerified && (
                  <div className="flex items-center gap-1 text-sm text-emerald-600">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    SĐT đã xác thực
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-4">
                {isOwnProfile ? (
                  <Link
                    href="/settings"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Chỉnh sửa hồ sơ
                  </Link>
                ) : (
                  <>
                    <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                      <UserPlus className="w-4 h-4" />
                      Theo dõi
                    </button>
                    {isSeller && (
                      <Link
                        href="/shop/user-id"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        <Store className="w-4 h-4" />
                        Xem shop
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-border">
            <StatCard icon={<Package className="w-4 h-4" />} label="Tổng giao dịch" value={String(user.stats.totalTransactions)} />
            <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Tỷ lệ đánh giá tốt" value={`${user.stats.positiveRate}%`} />
            <StatCard icon={<Clock className="w-4 h-4" />} label="Phản hồi trung bình" value={user.stats.avgResponseTime} />
          </div>
        </div>

        {/* ── Upgrade Banner (only for buyer own profile) ──────────── */}
        {isOwnProfile && !isSeller && (
          <Link href="/upgrade" className="group mt-6 flex items-center gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 p-5 hover:border-primary/30 hover:shadow-sm transition-all">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Nâng cấp để bắt đầu bán hàng</p>
              <p className="text-xs text-muted-foreground mt-0.5">Xác thực SĐT qua Zalo để trở thành Seller và đăng sản phẩm đấu giá.</p>
            </div>
            <Award className="w-5 h-5 text-primary/50 group-hover:text-primary transition-colors" />
          </Link>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div className="mt-8">
          <div className="flex border-b border-border overflow-x-auto">
            {isSeller && (
              <TabButton active={activeTab === "listings"} onClick={() => setActiveTab("listings")} count={MOCK_LISTINGS.length}>
                Đang bán
              </TabButton>
            )}
            <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")} count={MOCK_HISTORY.length}>
              Lịch sử mua
            </TabButton>
            <TabButton active={activeTab === "reviews"} onClick={() => setActiveTab("reviews")} count={MOCK_REVIEWS.length}>
              Đánh giá nhận được
            </TabButton>
          </div>

          {/* Tab Content */}
          <div className="mt-6">

            {/* Listings Tab */}
            {activeTab === "listings" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {MOCK_LISTINGS.map(item => (
                  <div key={item.id} className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative aspect-square overflow-hidden">
                      <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-base font-bold text-primary mt-1">{item.currentPrice}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>⏱ {item.timeLeft}</span>
                        <span>{item.bids} lượt đặt giá</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="space-y-3">
                {MOCK_HISTORY.map(item => (
                  <div key={item.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString("vi-VN")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{item.finalPrice}</p>
                      <Badge variant="secondary" className="text-[10px] mt-1">Hoàn thành</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <>
                {/* Review Filter */}
                <div className="flex items-center gap-2 mb-4">
                  {(["all", "positive", "negative"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setReviewFilter(f)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors
                        ${reviewFilter === f
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {f === "all" ? "Tất cả" : f === "positive" ? "👍 Tích cực" : "👎 Tiêu cực"}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {filteredReviews.map(review => (
                    <div key={review.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {review.author.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{review.author}</p>
                            <p className="text-[11px] text-muted-foreground">{new Date(review.date).toLocaleDateString("vi-VN")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-foreground/80 mt-2.5">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Empty State */}
            {((activeTab === "listings" && MOCK_LISTINGS.length === 0) ||
              (activeTab === "history" && MOCK_HISTORY.length === 0) ||
              (activeTab === "reviews" && filteredReviews.length === 0)) && (
              <div className="text-center py-16">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground mt-3">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

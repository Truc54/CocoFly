"use client";

import React, { useState, useEffect, useCallback, useRef, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  Calendar,
  MessageSquare,
  Clock,
  Pin,
  Loader2,
} from "lucide-react";
import { userApi } from "@/lib/api";
import { authStorage } from "@/lib/auth-storage";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PublicProfileData {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  rating: number;
  totalReviews: number;
  role: string;
  joinDate: string;
  pinnedCount: number;
}

interface RelatedAuction {
  id: string;
  category: string;
  name: string;
  image: string | null;
  currentPrice: string;
  endDate: string;
  bids: number;
  role: string;
  isPinned: boolean;
  status: string;
}

interface ReviewItem {
  id: string;
  author: string;
  authorAvatar: string | null;
  rating: number;
  comment: string | null;
  date: string;
  type: "positive" | "negative" | "neutral";
  auctionTitle: string | null;
}

// ─── Tab Button ──────────────────────────────────────────────────────────────

function TabButton({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 text-sm font-bold transition-all duration-200 border-b-2
        ${active
          ? "text-primary border-primary"
          : "text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300"
        }`}
    >
      {children}
      {count !== undefined && (
        <span className={`ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] font-bold
          ${active ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-white dark:bg-slate-800/60 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-10 w-40 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          </div>
        </div>
        <div className="mt-6 pt-6 border-t-2 border-slate-100 dark:border-slate-700 space-y-2">
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-slate-800/60 overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1]">
      <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════

const ITEMS_PER_PAGE = 8;

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"relatedAuctions" | "reviews">("relatedAuctions");
  const [reviewFilter, setReviewFilter] = useState<"all" | "positive" | "neutral" | "negative">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);

  // API state
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [auctions, setAuctions] = useState<RelatedAuction[]>([]);
  const [auctionMeta, setAuctionMeta] = useState({ total: 0, totalPages: 1 });
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewMeta, setReviewMeta] = useState({ total: 0, totalPages: 1 });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAuctions, setLoadingAuctions] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Redirect if target ID is own user ID
  useEffect(() => {
    const user = authStorage.getUser();
    if (user && (user as { id: string }).id === id) {
      router.replace("/profile");
    }
  }, [id, router]);

  // ── Load Profile ───────────────────────────────────────────────────────────

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        const res = await userApi.getUserProfile(id);
        setProfile(res.data);
      } catch (err: any) {
        console.error("Failed to load user public profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [id]);

  // ── Load Related Auctions ─────────────────────────────────────────────────

  const loadAuctions = useCallback(async (page: number) => {
    try {
      setLoadingAuctions(true);
      const res = await userApi.getUserRelatedAuctions(id, page, ITEMS_PER_PAGE);
      setAuctions(prev => page === 1 ? res.data : [...prev, ...res.data]);
      setAuctionMeta(res.meta);
    } catch (err: any) {
      console.error("Failed to load auctions:", err);
    } finally {
      setLoadingAuctions(false);
    }
  }, [id]);

  useEffect(() => {
    loadAuctions(currentPage);
  }, [currentPage, loadAuctions]);

  // ── Load Reviews ──────────────────────────────────────────────────────────

  const loadReviews = useCallback(async (page: number) => {
    try {
      setLoadingReviews(true);
      const res = await userApi.getUserReviews(id, page, 10);
      setReviews(prev => page === 1 ? res.data : [...prev, ...res.data]);
      setReviewMeta(res.meta);
    } catch (err: any) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === "reviews") {
      loadReviews(reviewPage);
    }
  }, [activeTab, reviewPage, loadReviews]);

  // Infinite scroll observer
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (activeTab === "relatedAuctions" && currentPage < auctionMeta.totalPages && !loadingAuctions) {
            setCurrentPage((p) => p + 1);
          } else if (activeTab === "reviews" && reviewPage < reviewMeta.totalPages && !loadingReviews) {
            setReviewPage((p) => p + 1);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [activeTab, currentPage, reviewPage, auctionMeta, reviewMeta, loadingAuctions, loadingReviews]);

  // ── Sort auctions: pinned first ───────────────────────────────────────────

  const sortedAuctions = [...auctions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  // ── Filter reviews ────────────────────────────────────────────────────────

  const filteredReviews = reviewFilter === "all"
    ? reviews
    : reviews.filter(r => r.type === reviewFilter);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Profile Header ──────────────────────────────────────────── */}
        {loadingProfile ? (
          <ProfileSkeleton />
        ) : profile ? (
          <div className="bg-white dark:bg-slate-800/60 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-600 shadow-[3px_3px_0px_#E2B9A1]">
                  <Image
                    src={profile.avatarUrl || "/default-avatar.svg"}
                    alt={profile.fullName || "User"}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{profile.fullName}</h1>
                </div>

                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{profile.rating.toFixed(1)}</span>
                    <span className="text-sm text-slate-400">({profile.totalReviews} đánh giá)</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    Tham gia {new Date(profile.joinDate).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                  </div>
                </div>

                {/* Message Button (disabled for now) */}
                <div className="flex items-center gap-3 mt-4">
                  <button
                    disabled
                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl border-2 border-blue-600 bg-white text-blue-600 shadow-[2px_2px_0px_#bfdbfe] opacity-80 cursor-not-allowed transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Nhắn tin
                  </button>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="mt-6 pt-6 border-t-2 border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Giới thiệu</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-pre-line">
                {profile.bio || "Không có giới thiệu"}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-sm text-slate-400">Không thể tải thông tin hồ sơ</p>
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div className="mt-8">
          <div className="flex border-b-2 border-slate-200 dark:border-slate-700 overflow-x-auto">
            <TabButton active={activeTab === "relatedAuctions"} onClick={() => { setActiveTab("relatedAuctions"); setCurrentPage(1); }} count={auctionMeta.total}>
              Đấu giá liên quan
            </TabButton>
            <TabButton active={activeTab === "reviews"} onClick={() => { setActiveTab("reviews"); setReviewPage(1); }} count={profile?.totalReviews || reviewMeta.total}>
              Đánh giá
            </TabButton>
          </div>

          {/* Tab Content */}
          <div className="mt-6">

            {/* Related Auctions Tab */}
            {activeTab === "relatedAuctions" && (
              <div className="space-y-6">
                {loadingAuctions && currentPage === 1 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
                  </div>
                ) : sortedAuctions.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {sortedAuctions.map((item, idx) => (
                        <Link
                          key={item.id}
                          href={`/auction/${item.id}`}
                          className="group bg-white dark:bg-slate-800/60 rounded-none overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] transition-all duration-300 cursor-pointer block"
                          style={{ animationDelay: `${idx * 60}ms` }}
                        >
                          {/* Image */}
                          <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-700">
                            {item.image ? (
                              <Image
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                alt={item.name}
                                src={item.image}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-slate-400">image</span>
                              </div>
                            )}

                            {/* Pin Icon indicator (read-only for public profile) */}
                            {item.isPinned && (
                              <div className="absolute top-2 right-2 bg-primary text-white p-1.5 rounded-full shadow-sm" title="Đã ghim">
                                <Pin className="w-3.5 h-3.5 rotate-45" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-3 space-y-2">
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                                {item.category}
                              </span>
                              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
                                {item.name}
                              </h3>
                              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                {item.bids} lượt đấu giá
                              </p>
                            </div>

                            <div>
                              <p className="text-sm font-bold text-[#E25C24]">{item.currentPrice}</p>
                            </div>

                            <div className="space-y-1 pt-1">
                              <p className="text-xs text-slate-500 font-bold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {item.endDate}
                              </p>
                              <p className={`text-[11px] font-bold tracking-wide ${
                                item.role === "Người chiến thắng"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : item.role === "Chủ đấu giá"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-slate-500"
                              }`}>
                                {item.role}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-sm text-slate-400 mt-3">Chưa có đấu giá liên quan</p>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <>
                {/* Review Filter */}
                <div className="flex items-center gap-2 mb-4">
                  {(["all", "positive", "neutral", "negative"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setReviewFilter(f)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border-2 transition-all
                        ${reviewFilter === f
                          ? "bg-primary text-white border-primary shadow-[2px_2px_0px_#E2B9A1]"
                          : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-600 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_#E2B9A1]"
                        }`}
                    >
                      {f === "all" ? `Tất cả (${reviews.length})` : f === "positive" ? `👍 Tích cực (${reviews.filter(r => r.type === "positive").length})` : f === "neutral" ? `😐 Bình thường (${reviews.filter(r => r.type === "neutral").length})` : `👎 Tiêu cực (${reviews.filter(r => r.type === "negative").length})`}
                    </button>
                  ))}
                </div>

                {loadingReviews && reviewPage === 1 ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-4 shadow-[2px_2px_0px_#E2B9A1]">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                          <div className="space-y-1.5">
                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                          </div>
                        </div>
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mt-3" />
                      </div>
                    ))}
                  </div>
                ) : filteredReviews.length > 0 ? (
                  <div className="space-y-3">
                    {filteredReviews.map(review => (
                      <div key={review.id} className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-4 shadow-[2px_2px_0px_#E2B9A1]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                              {review.authorAvatar ? (
                                <Image src={review.authorAvatar} alt={review.author} width={32} height={32} className="w-full h-full object-cover" unoptimized />
                              ) : (
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                  {review.author.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{review.author}</p>
                              <p className="text-[11px] text-slate-400">{new Date(review.date).toLocaleDateString("vi-VN")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "text-amber-500 fill-amber-500" : "text-slate-300 dark:text-slate-600"}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2.5">{review.comment}</p>
                        )}
                        <div className="flex items-end justify-between mt-1.5">
                          {review.auctionTitle ? (
                            <p className="text-[11px] text-slate-400 italic mb-1">Đấu giá: {review.auctionTitle}</p>
                          ) : <div />}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-sm text-slate-400 mt-3">Chưa có đánh giá</p>
                  </div>
                )}
              </>
            )}

            {/* Infinite Scroll Sentinel */}
            <div ref={observerTarget} className="h-4 w-full" />
            {loadingAuctions && activeTab === "relatedAuctions" && currentPage > 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={`loading-${i}`} />)}
              </div>
            )}
            {loadingReviews && activeTab === "reviews" && reviewPage > 1 && (
              <div className="space-y-3 mt-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={`loading-${i}`} className="animate-pulse rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-4 shadow-[2px_2px_0px_#E2B9A1]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                      </div>
                    </div>
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mt-3" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

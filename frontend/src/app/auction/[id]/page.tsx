"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { auctionApi } from "@/lib/api";
import type { AuctionDetail, RelatedAuction, BidEntry } from "@/lib/types/auction";
import CountdownTimer from "@/components/auction/CountdownTimer";
import AuctionDetailSkeleton from "@/components/auction/AuctionDetailSkeleton";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatVND(n: number) {
  return n.toLocaleString("vi-VN");
}

function formatEndDate(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}, ${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff} giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [related, setRelated] = useState<RelatedAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [chatMessage, setChatMessage] = useState("");
  const [isLeading, setIsLeading] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await auctionApi.getById(id);
        if (cancelled) return;
        const data = res.data as AuctionDetail;
        setAuction(data);

        // Fetch related auctions by same category
        if (data.category?.id) {
          try {
            const relRes = await auctionApi.getLive({ categoryId: data.category.id, limit: 4 });
            if (!cancelled) {
              const items = (relRes.data?.auctions ?? []).filter((a: any) => a.id !== data.id);
              setRelated(items.slice(0, 4));
            }
          } catch { /* non-critical */ }
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Không thể tải dữ liệu");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <AuctionDetailSkeleton />;

  if (error || !auction) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">error</span>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy phiên đấu giá</h1>
        <p className="text-slate-500 mb-6">{error || "Phiên đấu giá không tồn tại hoặc đã bị xóa."}</p>
        <Link href="/live" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold border-2 border-primary shadow-[4px_4px_0px_#E2B9A1] hover:-translate-y-0.5 transition-all">
          ← Quay lại đấu giá
        </Link>
      </div>
    );
  }

  const suggestedPrice = auction.currentPrice + auction.bidIncrement;
  const images = auction.media.length > 0
    ? auction.media.map((m) => m.cdnUrl)
    : ["https://placehold.co/800x600/f1f5f9/94a3b8?text=No+Image"];

  const handleBid = () => {
    setIsLeading(true);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-medium">
        <Link href="/" className="hover:text-primary transition-colors cursor-pointer">Trang chủ</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link href="/live" className="hover:text-primary transition-colors cursor-pointer">{auction.category?.name ?? "Đấu giá"}</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-primary truncate max-w-xs">{auction.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ═══════ LEFT COLUMN ═══════ */}
        <div className="lg:col-span-7 space-y-6">

          {/* Photo Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] bg-white dark:bg-slate-800 rounded-none border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-[4px_4px_0px_#E2B9A1] group">
              <Image
                src={images[activeImageIdx]}
                alt={auction.title}
                fill
                className="object-contain p-4"
                unoptimized
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIdx((p) => (p > 0 ? p - 1 : images.length - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white border-2 border-slate-800 rounded-full flex items-center justify-center text-slate-800 shadow-[2px_2px_0px_#1e293b] opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button
                    onClick={() => setActiveImageIdx((p) => (p < images.length - 1 ? p + 1 : 0))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white border-2 border-slate-800 rounded-full flex items-center justify-center text-slate-800 shadow-[2px_2px_0px_#1e293b] opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </>
              )}
              <div className="absolute bottom-3 right-3 bg-white border-2 border-slate-800 text-slate-800 text-xs font-bold px-2 py-1 rounded-none shadow-[2px_2px_0px_#1e293b]">
                {activeImageIdx + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 pt-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-[72px] h-[72px] shrink-0 rounded-none border-2 transition-all cursor-pointer ${
                      activeImageIdx === idx
                        ? "border-primary shadow-[3px_3px_0px_#8f5c38] scale-100"
                        : "border-slate-200 opacity-80 hover:opacity-100 hover:shadow-[3px_3px_0px_#cbd5e1] scale-95 hover:scale-100"
                    }`}
                  >
                    <Image src={img} alt={`Thumb ${idx}`} fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Seller Info */}
          {auction.seller && (
            <div className="flex items-center gap-4 p-4 border-2 border-slate-200 shadow-[4px_4px_0px_#cbd5e1] bg-white dark:bg-slate-800 dark:border-slate-700">
              <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-slate-800 flex items-center justify-center text-xl font-bold shrink-0 text-slate-800 overflow-hidden">
                {auction.seller.avatarUrl ? (
                  <Image src={auction.seller.avatarUrl} alt={auction.seller.fullName} width={48} height={48} className="object-cover w-full h-full" unoptimized />
                ) : (
                  auction.seller.fullName.charAt(0)
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 dark:text-white">{auction.seller.fullName}</h3>
                <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                  <span className="material-symbols-outlined text-yellow-500 text-[16px]">star</span>
                  <span className="font-bold">{auction.seller.rating.toFixed(1)}</span>
                </div>
              </div>
              <button className="px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 font-bold flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#bfdbfe] hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">chat</span>
                Nhắn tin
              </button>
            </div>
          )}

          {/* Product Details Accordion */}
          <div className="space-y-4 pt-4">
            <details open className="bg-white dark:bg-slate-800 rounded-none border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#cbd5e1] group">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none outline-none select-none">
                <span className="flex items-center gap-2 font-bold text-slate-800 dark:text-white uppercase tracking-wide text-sm">
                  <span className="material-symbols-outlined text-primary">info</span>
                  Mô tả sản phẩm
                </span>
                <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t-2 border-slate-100 dark:border-slate-700 pt-4">
                {auction.description}
              </div>
            </details>

            <details className="bg-white dark:bg-slate-800 rounded-none border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#cbd5e1] group">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none outline-none select-none">
                <span className="flex items-center gap-2 font-bold text-slate-800 dark:text-white uppercase tracking-wide text-sm">
                  <span className="material-symbols-outlined text-primary">verified</span>
                  Tình trạng
                </span>
                <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t-2 border-slate-100 dark:border-slate-700 pt-4">
                {auction.condition}
              </div>
            </details>
          </div>
        </div>

        {/* ═══════ RIGHT COLUMN ═══════ */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* Title */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-tight">{auction.title}</h1>
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">visibility</span>
                <span className="text-base">{auction.totalWatchers}</span>
              </span>
            </div>
          </div>

          {/* Bidding Engine Box */}
          <div className="bg-white dark:bg-slate-800 rounded-none border-2 border-slate-200 dark:border-slate-700 p-6 shadow-[4px_4px_0px_#E2B9A1]">
            <div className="mb-6">
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tabular-nums">
                {formatVND(auction.currentPrice)} <span className="text-lg sm:text-xl text-slate-500 font-bold">VNĐ</span>
              </p>
              {auction.buyoutPrice && (
                <p className="text-xs text-slate-400 mt-1">
                  Mua ngay: <span className="font-bold text-orange-600">{formatVND(auction.buyoutPrice)} VNĐ</span>
                </p>
              )}
              <div className="mt-4 flex items-center justify-between border-t-2 border-slate-100 dark:border-slate-700 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  Kết thúc lúc {formatEndDate(auction.endTime)}
                </p>
                <CountdownTimer endTime={auction.endTime} />
              </div>
            </div>

            {/* Bid Input */}
            <div className="relative mb-5">
              <input
                type="text"
                placeholder={`Nhập giá (Tối thiểu ${formatVND(suggestedPrice)} VNĐ)`}
                className="w-full pl-4 pr-12 py-3 bg-white border-2 border-slate-300 rounded-none text-base font-bold text-slate-800 focus:border-slate-400 focus:ring-0 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal shadow-[inset_2px_2px_0px_#f1f5f9]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">VNĐ</span>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <button
                onClick={handleBid}
                disabled={auction.status !== "active"}
                className="w-full py-3 bg-[#0066FF] text-white font-bold text-base rounded-full border-2 border-[#0066FF] shadow-[4px_4px_0px_#bfdbfe] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#bfdbfe] active:translate-y-0 active:shadow-[2px_2px_0px_#bfdbfe] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {auction.status === "active" ? "ĐẶT GIÁ NGAY" : auction.status === "scheduled" ? "CHƯA BẮT ĐẦU" : "ĐÃ KẾT THÚC"}
              </button>
              <button className="w-full py-3 bg-white text-slate-700 font-bold text-base rounded-full border-2 border-slate-200 shadow-[3px_3px_0px_#cbd5e1] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#cbd5e1] active:translate-y-0 active:shadow-[1px_1px_0px_#cbd5e1] transition-all flex items-center justify-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">favorite</span>
                Thêm vào yêu thích
              </button>
            </div>

            {/* Status Feedback */}
            {isLeading === true && (
              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 border-2 border-green-200 py-3 rounded-none font-bold shadow-[3px_3px_0px_#86efac]">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                Bạn đang dẫn đầu phiên đấu giá!
              </div>
            )}
            {isLeading === false && (
              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-red-700 bg-red-50 border-2 border-red-200 py-3 rounded-none font-bold shadow-[3px_3px_0px_#fca5a5]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                Bạn vừa bị vượt giá! Đặt lại ngay.
              </div>
            )}
          </div>

          {/* Bid History + Chat Box */}
          <div className="bg-white dark:bg-slate-800 rounded-none border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] flex flex-col h-[550px]">
            <div className="p-4 border-b-2 border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-800">
              <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white uppercase tracking-wide text-sm">
                <span className="material-symbols-outlined text-primary">forum</span>
                Live Chat & Lịch sử
              </h3>
              <div className="flex items-center gap-1.5 bg-white text-green-600 text-[10px] font-bold px-2 py-1 border-2 border-green-200 shadow-[2px_2px_0px_#bbf7d0]">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                LIVE
              </div>
            </div>

            {/* Bid History List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-white dark:bg-slate-800">
              {auction.recentBids.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2">gavel</span>
                  <p className="text-sm font-medium">Chưa có lượt đặt giá nào</p>
                </div>
              ) : (
                auction.recentBids.map((bid: BidEntry) => (
                  <div key={bid.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 bg-orange-50 border-orange-200 text-orange-600 shadow-[2px_2px_0px_#fed7aa]">
                      <span className="material-symbols-outlined text-sm">gavel</span>
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-slate-800 dark:text-white">{bid.bidder.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{timeAgo(bid.createdAt)}</span>
                      </div>
                      <div className="inline-block bg-white border-2 border-orange-200 text-orange-700 font-bold text-xs px-3 py-1.5 rounded-none shadow-[2px_2px_0px_#fed7aa]">
                        Đã đặt {formatVND(bid.amount)} VNĐ
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input (placeholder for Phase 3) */}
            <div className="p-3 border-t-2 border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nhắn tin..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 h-10 px-3 bg-white border-2 border-slate-300 rounded-none text-sm outline-none focus:border-slate-400 transition-all placeholder:text-slate-400 shadow-[inset_2px_2px_0px_#f1f5f9]"
                />
                <button className="w-10 h-10 flex items-center justify-center bg-transparent text-primary hover:bg-slate-200/50 rounded-full transition-all cursor-pointer shrink-0">
                  <span className="material-symbols-outlined text-[20px] leading-none">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Auctions */}
      {related.length > 0 && (
        <section className="mt-10 pt-8 border-t-2 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-wide">Đấu giá tương tự</h2>
            <Link
              href="/live"
              className="group inline-flex items-center gap-1.5 rounded-none border-2 border-primary bg-white px-3 py-1.5 text-xs font-bold text-primary shadow-[3px_3px_0px_#E2B9A1] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#E2B9A1] dark:bg-slate-900 cursor-pointer"
            >
              Xem tất cả
              <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/auction/${item.id}`}
                className="group bg-white dark:bg-slate-800/60 rounded-none overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-700 border-b-2 border-slate-200">
                  <Image
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={item.title}
                    src={item.thumbnailUrl || "https://placehold.co/400x300/f1f5f9/94a3b8?text=No+Image"}
                    fill
                    unoptimized
                  />
                  <span className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm px-2 py-0.5 rounded-none border border-red-600 text-[10px] font-bold text-white flex items-center gap-1 shadow-[2px_2px_0px_#991b1b]">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </span>
                </div>
                <div className="p-3 space-y-1.5 flex-1 flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {item.category?.name ?? "Đấu giá"}
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug flex-1">
                    {item.title}
                  </h3>
                  <div className="space-y-2 mt-2">
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 font-medium">Giá hiện tại</p>
                      <p className="text-sm font-bold text-primary">{formatVND(item.currentPrice)}đ</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

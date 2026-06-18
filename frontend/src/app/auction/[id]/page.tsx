"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, use } from "react";
import { auctionApi } from "@/lib/api";
import { authStorage } from "@/lib/auth-storage";
import type { AuctionDetail, RelatedAuction } from "@/lib/types/auction";
import { useAuctionSocket } from "@/lib/hooks/useAuctionSocket";
import AuctionDetailSkeleton from "@/components/auction/AuctionDetailSkeleton";
import BiddingPanel from "@/components/auction/BiddingPanel";
import LiveChatPanel from "@/components/auction/LiveChatPanel";
import AuctionEndedOverlay from "@/components/auction/AuctionEndedOverlay";
import UserHoverCard from "@/components/shared/UserHoverCard";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatVND(n: number) {
  return n.toLocaleString("vi-VN");
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [related, setRelated] = useState<RelatedAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [isWatching, setIsWatching] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const token = authStorage.getToken();
    setIsLoggedIn(!!token);
    if (token) {
      setCurrentUser(authStorage.getUser());
    }
  }, []);

  const isHost = !!(currentUser && auction?.seller && currentUser.id === auction.seller.id);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await auctionApi.getById(id);
        if (cancelled) return;
        const data = res.data as AuctionDetail;
        setAuction(data);

        // Fetch watch status if logged in
        if (authStorage.getToken()) {
          try {
            const watchRes = await auctionApi.getWatchStatus(id);
            if (!cancelled) setIsWatching(watchRes.data?.watching ?? false);
          } catch { /* non-critical */ }
        }

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

  const handleToggleWatch = useCallback(async () => {
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập để sử dụng tính năng này");
      return;
    }
    if (watchLoading) return;
    setWatchLoading(true);
    const prev = isWatching;
    setIsWatching(!prev); // optimistic
    try {
      await auctionApi.toggleWatch(id);
    } catch (err: any) {
      setIsWatching(prev); // rollback
      alert(err.message || "Không thể thực hiện thao tác này");
    } finally {
      setWatchLoading(false);
    }
  }, [id, isWatching, watchLoading, isLoggedIn]);

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

  return <AuctionDetailContent auction={auction} related={related} activeImageIdx={activeImageIdx} setActiveImageIdx={setActiveImageIdx} isLoggedIn={isLoggedIn} isWatching={isWatching} watchLoading={watchLoading} onToggleWatch={handleToggleWatch} isHost={isHost} />;
}

// ─── INNER COMPONENT (needs hooks after auction loads) ────────────────────────

function AuctionDetailContent({
  auction,
  related,
  activeImageIdx,
  setActiveImageIdx,
  isLoggedIn,
  isWatching,
  watchLoading,
  onToggleWatch,
  isHost,
}: {
  auction: AuctionDetail;
  related: RelatedAuction[];
  activeImageIdx: number;
  setActiveImageIdx: (i: number) => void;
  isLoggedIn: boolean;
  isWatching: boolean;
  watchLoading: boolean;
  onToggleWatch: () => void;
  isHost: boolean;
}) {
  const router = useRouter();
  const {
    currentPrice,
    totalBids,
    endTime,
    actualEndTime,
    isExtended,
    extendCount,
    auctionStatus,
    winnerId,
    winnerName: socketWinnerName,
    finalPrice,
    bids,
    isLeading,
    hasBid,
    proxyMessage,
    proxyMaxBid,
    error: bidError,
    connected,
    bidSuccess,
    viewerCount,
    placeBid,
    buyout,
    clearError,
    clearBidSuccess,
  } = useAuctionSocket(auction.id, {
    currentPrice: auction.currentPrice,
    totalBids: auction.totalBids,
    endTime: auction.endTime,
    actualEndTime: auction.actualEndTime,
    recentBids: auction.recentBids,
    status: auction.status,
    winnerId: auction.winnerId,
    winnerName: auction.winnerName,
    finalPrice: auction.finalPrice,
    buyoutPrice: auction.buyoutPrice,
  });

  // Auto-dismiss success toast
  useEffect(() => {
    if (bidSuccess) {
      const timer = setTimeout(clearBidSuccess, 4000);
      return () => clearTimeout(timer);
    }
  }, [bidSuccess, clearBidSuccess]);



  const images = auction.media.length > 0
    ? auction.media.map((m) => m.cdnUrl)
    : ["https://placehold.co/800x600/f1f5f9/94a3b8?text=No+Image"];

  const isEnded = auctionStatus === "ended" || auctionStatus === "buyout";

  // Use socket winnerName first, then API winnerName, then try to find from bids
  const winnerName = socketWinnerName || auction.winnerName ||
                     bids.find(b => b.bidder.id === winnerId)?.bidder.fullName ||
                     null;

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-medium">
        <Link href="/" className="hover:text-primary transition-colors cursor-pointer">Trang chủ</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link href="/live" className="hover:text-primary transition-colors cursor-pointer">{(auction.category?.name ?? "Đấu giá").replace(/&/g, "-")}</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-primary truncate max-w-xs">{auction.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ═══════ LEFT COLUMN ═══════ */}
        <div className="lg:col-span-7 space-y-6">

          {/* Photo Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-[4px_4px_0px_#E2B9A1] group">
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
                    onClick={() => setActiveImageIdx(activeImageIdx > 0 ? activeImageIdx - 1 : images.length - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white border-2 border-slate-800 rounded-full flex items-center justify-center text-slate-800 shadow-[2px_2px_0px_#1e293b] opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button
                    onClick={() => setActiveImageIdx(activeImageIdx < images.length - 1 ? activeImageIdx + 1 : 0)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white border-2 border-slate-800 rounded-full flex items-center justify-center text-slate-800 shadow-[2px_2px_0px_#1e293b] opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </>
              )}
              <div className="absolute bottom-3 right-3 bg-white border-2 border-slate-800 text-slate-800 text-xs font-bold px-2 py-1 rounded-lg shadow-[2px_2px_0px_#1e293b]">
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
                    className={`relative w-[72px] h-[72px] shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
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
          {auction.seller && !isHost && (
            <div className="flex items-center gap-4 p-4 border-2 border-slate-200 shadow-[4px_4px_0px_#cbd5e1] bg-white dark:bg-slate-800 dark:border-slate-700 rounded-xl">
              <UserHoverCard userId={auction.seller.id}>
                <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-slate-800 flex items-center justify-center text-xl font-bold shrink-0 text-slate-800 overflow-hidden">
                  {auction.seller.avatarUrl ? (
                    <Image src={auction.seller.avatarUrl} alt={auction.seller.fullName} width={48} height={48} className="object-cover w-full h-full" unoptimized />
                  ) : (
                    auction.seller.fullName.charAt(0)
                  )}
                </div>
              </UserHoverCard>
              <div className="flex-1">
                <UserHoverCard userId={auction.seller.id}>
                  <h3 className="font-bold text-slate-800 dark:text-white">{auction.seller.fullName}</h3>
                </UserHoverCard>
                <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                  <span className="material-symbols-outlined text-yellow-500 text-[16px]">star</span>
                  <span className="font-bold">{auction.seller.rating.toFixed(1)}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isLoggedIn) {
                    router.push("/login");
                  } else {
                    window.dispatchEvent(new CustomEvent("open-dm", { detail: { targetUserId: auction.seller?.id } }));
                  }
                }}
                className="px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 font-bold flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#bfdbfe] hover:bg-blue-600 hover:text-white transition-all cursor-pointer rounded-xl"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
                Nhắn tin
              </button>
            </div>
          )}

          {/* Product Details Accordion */}
          <div className="space-y-4 pt-4">
            <details open className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#cbd5e1] group">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none outline-none select-none">
                <span className="flex items-center gap-2 font-bold text-slate-800 dark:text-white uppercase tracking-wide text-sm">
                  <span className="material-symbols-outlined text-primary">info</span>
                  Mô tả sản phẩm
                </span>
                <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t-2 border-slate-100 dark:border-slate-700 pt-4 whitespace-pre-wrap">
                {auction.description || <span className="italic text-slate-400">Sản phẩm hiện không có mô tả</span>}
              </div>
            </details>

            <details open className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#cbd5e1] group">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none outline-none select-none">
                <span className="flex items-center gap-2 font-bold text-slate-800 dark:text-white uppercase tracking-wide text-sm">
                  <span className="material-symbols-outlined text-primary">verified</span>
                  Tình trạng
                </span>
                <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t-2 border-slate-100 dark:border-slate-700 pt-4 whitespace-pre-wrap">
                {auction.condition || <span className="italic text-slate-400">Chưa cập nhật tình trạng</span>}
              </div>
            </details>
          </div>
        </div>

        {/* ═══════ RIGHT COLUMN ═══════ */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* Success Toast Notification - Top Right */}
          {bidSuccess && (
            <div className="fixed top-6 right-6 z-[200] animate-slide-in-right">
              <div className="flex items-center gap-3 bg-white border-2 border-green-300 px-5 py-3.5 rounded-xl shadow-[4px_4px_0px_#86efac] min-w-[280px] dark:bg-slate-800 dark:border-green-600">
                <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-green-600 text-lg">check</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Đặt giá thành công!</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Bạn đang dẫn đầu phiên đấu giá</p>
                </div>
                <button onClick={clearBidSuccess} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>
          )}



          {/* Title */}
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-tight">{auction.title}</h1>
              </div>
            </div>

          </div>

          {/* Bidding Panel or Ended Overlay */}
          {isEnded ? (
            <AuctionEndedOverlay
              winnerId={winnerId}
              winnerName={winnerName}
              finalPrice={finalPrice}
              isBuyout={auctionStatus === "buyout"}
              startTime={auction.scheduledStart}
              endTime={actualEndTime || auction.actualEndTime || endTime || auction.endTime}
              totalBids={totalBids}
            />
          ) : (
            <BiddingPanel
              auctionId={auction.id}
              currentPrice={currentPrice}
              bidIncrement={auction.bidIncrement}
              buyoutPrice={auction.buyoutPrice}
              endTime={endTime}
              status={auctionStatus}
              isLeading={isLeading}
              proxyMessage={proxyMessage}
              proxyMaxBid={proxyMaxBid}
              error={bidError}
              isExtended={isExtended}
              extendCount={extendCount}
              isLoggedIn={isLoggedIn}
              isWatching={isWatching}
              watchLoading={watchLoading}
              onPlaceBid={placeBid}
              onBuyout={buyout}
              onClearError={clearError}
              onToggleWatch={onToggleWatch}
              isHost={isHost}
              leaderName={winnerName}
              totalBids={totalBids}
              startTime={auction.scheduledStart}
            />
          )}

          {/* Live Chat Panel */}
          <LiveChatPanel
            auctionId={auction.id}
            chatRoomId={auction.chatRoomId}
            bids={bids}
            totalBids={totalBids}
            viewerCount={viewerCount}
            isLoggedIn={isLoggedIn}
            isEnded={auctionStatus === "ended" || auctionStatus === "buyout"}
            sellerId={auction.seller?.id}
          />
        </div>
      </div>

      {/* Related Auctions */}
      {related.length > 0 && (
        <section className="mt-10 pt-8 border-t-2 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-wide">Đấu giá tương tự</h2>
            <Link
              href="/live"
              className="group inline-flex items-center gap-1.5 rounded-xl border-2 border-primary bg-white px-3 py-1.5 text-xs font-bold text-primary shadow-[3px_3px_0px_#E2B9A1] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#E2B9A1] dark:bg-slate-900 cursor-pointer"
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
                className="group bg-white dark:bg-slate-800/60 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-700 border-b-2 border-slate-200">
                  <Image
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={item.title}
                    src={item.thumbnailUrl || "https://placehold.co/400x300/f1f5f9/94a3b8?text=No+Image"}
                    fill
                    unoptimized
                  />
                  <span className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm px-2 py-0.5 rounded-full border border-red-600 text-[10px] font-bold text-white flex items-center gap-1 shadow-[2px_2px_0px_#991b1b]">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Đang diễn ra
                  </span>
                </div>
                <div className="p-3 space-y-1.5 flex-1 flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {(item.category?.name ?? "Đấu giá").replace(/&/g, "-")}
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

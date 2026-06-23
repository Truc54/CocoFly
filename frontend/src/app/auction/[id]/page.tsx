"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, use, useMemo } from "react";
import { auctionApi } from "@/lib/api";
import { authStorage } from "@/lib/auth-storage";
import type { AuctionDetail, RelatedAuction } from "@/lib/types/auction";
import { useAuctionSocket } from "@/lib/hooks/useAuctionSocket";
import AuctionDetailSkeleton from "@/components/auction/AuctionDetailSkeleton";
import BiddingPanel from "@/components/auction/BiddingPanel";
import LiveChatPanel from "@/components/auction/LiveChatPanel";
import AuctionEndedOverlay from "@/components/auction/AuctionEndedOverlay";
import UserHoverCard from "@/components/shared/UserHoverCard";
import { AuctionCard } from "@/components/home/AuctionRow";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatVND(n: number) {
  return n.toLocaleString("vi-VN");
}

function useCountdown(endTimes: string[]) {
  const [timeLefts, setTimeLefts] = useState<string[]>([]);
  const endTimesKey = JSON.stringify(endTimes);

  useEffect(() => {
    const times: string[] = JSON.parse(endTimesKey);
    if (times.length === 0) { setTimeLefts([]); return; }

    function calc() {
      return times.map((endTime: string) => {
        const diff = new Date(endTime).getTime() - Date.now();
        if (diff <= 0) return "00:00:00";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = String(Math.floor((diff % (1000 * 60 * 60 * 24)) / 3600000)).padStart(2, "0");
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
        if (days > 0) {
          return `${days}d ${h}:${m}:${s}`;
        }
        return `${h}:${m}:${s}`;
      });
    }
    setTimeLefts(calc());
    const timer = setInterval(() => setTimeLefts(calc()), 1000);
    return () => clearInterval(timer);
  }, [endTimesKey]);

  return timeLefts;
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
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleReload = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
  }, []);

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
        // Only set skeleton loading on initial load, prevent flash on reloads
        if (reloadTrigger === 0) {
          setLoading(true);
        }
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
            const relRes = await auctionApi.getLive({ categoryId: data.category.id, limit: 50 });
            if (!cancelled) {
              const items = (relRes.data?.auctions ?? []).filter((a: any) => a.id !== data.id);
              setRelated(items);
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
  }, [id, reloadTrigger]);

  // Poll when scheduled auction is starting
  useEffect(() => {
    if (!auction || auction.status !== 'scheduled' || !auction.scheduledStart) {
      setIsTransitioning(false);
      return;
    }

    const startTime = new Date(auction.scheduledStart).getTime();
    let pollInterval: NodeJS.Timeout | null = null;
    let checkTimeout: NodeJS.Timeout | null = null;

    const checkAndPoll = () => {
      const now = Date.now();
      if (now >= startTime - 1000) {
        setIsTransitioning(true);
        pollInterval = setInterval(async () => {
          try {
            const res = await auctionApi.getById(id);
            const data = res.data as AuctionDetail;
            if (data.status === 'active') {
              if (pollInterval) clearInterval(pollInterval);
              setAuction(data);
              setIsTransitioning(false);
              handleReload();
            }
          } catch (err) {
            console.error("Polling error", err);
          }
        }, 2000);
      } else {
        const delay = startTime - now - 1000;
        checkTimeout = setTimeout(() => {
          checkAndPoll();
        }, Math.max(delay, 0));
      }
    };

    checkAndPoll();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (checkTimeout) clearTimeout(checkTimeout);
    };
  }, [auction?.id, auction?.status, auction?.scheduledStart, id, handleReload]);

  // Poll when active auction is ending
  useEffect(() => {
    if (!auction || auction.status !== 'active' || !auction.endTime) return;

    const endTimeMs = new Date(auction.endTime).getTime();
    let pollInterval: NodeJS.Timeout | null = null;
    let checkTimeout: NodeJS.Timeout | null = null;

    const checkAndPoll = () => {
      const now = Date.now();
      if (now >= endTimeMs - 1000) {
        pollInterval = setInterval(async () => {
          try {
            const res = await auctionApi.getById(id);
            const data = res.data as AuctionDetail;
            if (data.status === 'ended' || data.status === 'failed' || data.status === 'buyout') {
              if (pollInterval) clearInterval(pollInterval);
              setAuction(data);
              handleReload();
            }
          } catch (err) {
            console.error("Polling error", err);
          }
        }, 2000);
      } else {
        const delay = endTimeMs - now - 1000;
        checkTimeout = setTimeout(() => {
          checkAndPoll();
        }, Math.max(delay, 0));
      }
    };

    checkAndPoll();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (checkTimeout) clearTimeout(checkTimeout);
    };
  }, [auction?.id, auction?.status, auction?.endTime, id, handleReload]);

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

  return (
    <AuctionDetailContent
      key={`${auction.id}-${reloadTrigger}`}
      auction={auction}
      related={related}
      activeImageIdx={activeImageIdx}
      setActiveImageIdx={setActiveImageIdx}
      isLoggedIn={isLoggedIn}
      isWatching={isWatching}
      watchLoading={watchLoading}
      onToggleWatch={handleToggleWatch}
      isHost={isHost}
      onReload={handleReload}
      isTransitioning={isTransitioning}
    />
  );
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
  onReload,
  isTransitioning,
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
  onReload: () => void;
  isTransitioning: boolean;
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

  const endTimes = useMemo(() => related.map(r => r.endTime), [related]);
  const timeLefts = useCountdown(endTimes);

  const images = auction.media.length > 0
    ? auction.media.map((m) => m.cdnUrl)
    : ["https://placehold.co/800x600/f1f5f9/94a3b8?text=No+Image"];

  const activeMediaItem = auction.media.length > 0 ? auction.media[activeImageIdx] : null;
  const isVideo = activeMediaItem?.type === "video" || activeMediaItem?.cdnUrl?.includes("/video/upload") || activeMediaItem?.cdnUrl?.endsWith(".mp4");

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
              {isVideo && activeMediaItem ? (
                <video
                  src={activeMediaItem.cdnUrl}
                  controls
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <Image
                  src={images[activeImageIdx]}
                  alt={auction.title}
                  fill
                  className="object-contain p-4"
                  unoptimized
                />
              )}
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
                {images.map((img, idx) => {
                  const isThumbVideo = auction.media[idx]?.type === "video" || auction.media[idx]?.cdnUrl?.includes("/video/upload");
                  const thumbUrl = isThumbVideo ? auction.media[idx].cdnUrl.replace(/\.[^/.]+$/, ".jpg") : img;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative w-[72px] h-[72px] shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        activeImageIdx === idx
                          ? "border-primary shadow-[3px_3px_0px_#8f5c38] scale-100"
                          : "border-slate-200 opacity-80 hover:opacity-100 hover:shadow-[3px_3px_0px_#cbd5e1] scale-95 hover:scale-100"
                      }`}
                    >
                      <Image src={thumbUrl} alt={`Thumb ${idx}`} fill className="object-cover" unoptimized />
                      {isThumbVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                          <span className="material-symbols-outlined text-white text-xl">play_circle</span>
                        </div>
                      )}
                    </button>
                  );
                })}
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
                    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
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
              onEnd={onReload}
              isTransitioning={isTransitioning}
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
            {related.map((item, idx) => (
              <AuctionCard
                key={item.id}
                auction={item as any}
                variant="live"
                countdown={timeLefts[idx]}
                index={idx}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

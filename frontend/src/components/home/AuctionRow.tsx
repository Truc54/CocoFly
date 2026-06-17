"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { Clock, ArrowRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuctionItem {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  category?: { id: number; name: string } | null;
  currentPrice: number;
  startingPrice: number;
  endTime: string;
  scheduledStart?: string;
  totalBids: number;
  totalWatchers: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatVND(value: number): string {
  if (value === 0) return "Chưa có giá";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function formatScheduleTime(isoString?: string): string {
  if (!isoString) return "--:--";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "--:--";
  const formatted = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return formatted.replace(", ", " · ");
}

function useCountdown(endTimes: string[]) {
  const [timeLefts, setTimeLefts] = useState<string[]>([]);
  const endTimesKey = useMemo(() => JSON.stringify(endTimes), [endTimes]);

  useEffect(() => {
    const times: string[] = JSON.parse(endTimesKey);
    if (times.length === 0) { setTimeLefts([]); return; }

    function calc() {
      return times.map((endTime: string) => {
        const diff = new Date(endTime).getTime() - Date.now();
        if (diff <= 0) return "Kết thúc";
        const d = Math.floor(diff / 86400000);
        const h = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, "0");
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
        return d > 0 ? `${d}d ${h}:${m}:${s}` : `${h}:${m}:${s}`;
      });
    }
    setTimeLefts(calc());
    const timer = setInterval(() => setTimeLefts(calc()), 1000);
    return () => clearInterval(timer);
  }, [endTimesKey]);

  return timeLefts;
}

// ─── AuctionCard ──────────────────────────────────────────────────────────────

interface AuctionCardProps {
  auction: AuctionItem;
  variant: "live" | "upcoming";
  countdown?: string;
  index?: number;
}

export function AuctionCard({ auction, variant, countdown, index = 0 }: AuctionCardProps) {
  const isLive = variant === "live";
  const scheduleLabel = auction.scheduledStart || auction.endTime;

  return (
    <Link
      href={`/auction/${auction.id}`}
      className="group bg-white dark:bg-slate-800/60 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] transition-all duration-300"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-700">
        {auction.thumbnailUrl ? (
          <Image
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            alt={auction.title}
            src={auction.thumbnailUrl}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-slate-400">image</span>
          </div>
        )}

        {/* Badge */}
        {isLive ? (
          <span className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Đang diễn ra
          </span>
        ) : (
          <span className="absolute top-2 right-2 bg-blue-500/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-white">
            Sắp diễn ra
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {/* Category */}
        {auction.category && (
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {auction.category.name.replace(/&/g, "-")}
          </span>
        )}

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
          {auction.title}
        </h3>

        {/* Price */}
        <div className="space-y-2">
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 font-medium">
              {isLive ? "Giá hiện tại" : "Giá khởi điểm"}
            </p>
            <p className="text-sm font-bold text-primary">
              {formatVND(isLive ? auction.currentPrice : auction.startingPrice)}
            </p>
          </div>
          {!isLive && (
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-500 font-medium">Diễn ra</p>
              <p className="text-xs text-slate-600 font-semibold flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {formatScheduleTime(scheduleLabel)}
              </p>
            </div>
          )}
          {isLive && countdown && (
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-500 font-medium">Còn lại</p>
              <p className="text-xs text-red-500 font-bold flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {countdown}
              </p>
            </div>
          )}
        </div>

      </div>
    </Link>
  );
}


// ─── AuctionRow ───────────────────────────────────────────────────────────────

interface AuctionRowProps {
  title: string;
  auctions: AuctionItem[];
  badge?: { text: string; icon?: React.ReactNode; color: string };
  variant?: "live" | "upcoming";
  viewAllHref: string;
  showCountdown?: boolean;
  loading?: boolean;
}

export default function AuctionRow({
  title,
  auctions,
  badge,
  variant = "live",
  viewAllHref,
  showCountdown = false,
  loading = false,
}: AuctionRowProps) {
  const endTimes = useMemo(
    () => (showCountdown ? auctions.map((a) => a.endTime) : []),
    [auctions, showCountdown]
  );
  const timeLefts = useCountdown(endTimes);

  if (!loading && auctions.length === 0) return null;

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
          {badge && (
            <span
              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                badge.color === "red"
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  : badge.color === "blue"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {badge.text}
            </span>
          )}
        </div>
        <Link
          href={viewAllHref}
          className="group inline-flex items-center gap-1.5 rounded-xl border-2 border-primary-main bg-white px-3 py-1.5 text-xs font-bold text-primary-main shadow-[3px_3px_0px_#E2B9A1] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#E2B9A1] dark:bg-slate-900"
        >
          Xem tất cả
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] animate-pulse"
            >
              <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700" />
              <div className="p-3 space-y-2">
                <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {auctions.slice(0, 6).map((auction, idx) => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              variant={variant}
              countdown={showCountdown ? timeLefts[idx] : undefined}
              index={idx}
            />
          ))}
        </div>
      )}
    </section>
  );
}

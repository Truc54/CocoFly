"use client";

import { useState } from "react";
import { auctionApi } from "@/lib/api";
import type { BidEntry } from "@/lib/types/auction";

function formatVND(n: number) {
  return n.toLocaleString("vi-VN");
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff} giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

interface BidHistoryListProps {
  auctionId: string;
  bids: BidEntry[];
  totalBids: number;
}

export default function BidHistoryList({ auctionId, bids, totalBids }: BidHistoryListProps) {
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [olderBids, setOlderBids] = useState<BidEntry[]>([]);
  const [hasMore, setHasMore] = useState(bids.length < totalBids);

  const displayBids = (() => {
    const existingIds = new Set(bids.map((b) => b.id));
    const uniqueOlder = olderBids.filter((b) => !existingIds.has(b.id));
    return [...bids, ...uniqueOlder];
  })();

  const reversedBids = [...displayBids].reverse();

  const loadMore = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await auctionApi.getBidHistory(auctionId, nextPage, 20);
      const newBids = res.data.bids as BidEntry[];

      setOlderBids((prev) => {
        const existingIds = new Set(prev.map((b) => b.id));
        const unique = newBids.filter((b: BidEntry) => !existingIds.has(b.id));
        return [...prev, ...unique];
      });
      setPage(nextPage);
      setHasMore(nextPage < res.data.pagination.totalPages);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar flex flex-col bg-white dark:bg-slate-800">
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="text-xs text-primary font-bold text-center w-full py-2 hover:underline disabled:opacity-50 mx-auto"
        >
          {loading ? "Đang tải..." : "Tải thêm lịch sử cũ"}
        </button>
      )}

      {reversedBids.map((bid) => {
        const isAuto = (bid as any).isAutoBid;
        return (
          <div key={bid.id} className="flex items-start gap-3 animate-fade-in">
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 overflow-hidden ${isAuto ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-orange-100 text-orange-600 border-orange-200'}`}>
              {bid.bidder.avatarUrl ? (
                <img src={bid.bidder.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">{isAuto ? 'smart_toy' : 'gavel'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  {bid.bidder.fullName || "Người dùng ẩn danh"}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">{timeAgo(bid.createdAt as any)}</span>
                {isAuto && (
                  <span className="text-[8px] leading-tight bg-blue-100 text-blue-700 px-1.5 py-0 font-bold rounded-full border border-blue-200">
                    AUTO
                  </span>
                )}
              </div>
              <div className="inline-block bg-white border-2 border-orange-200 text-red-600 font-bold text-xs px-3 py-1.5 rounded-none shadow-[2px_2px_0px_#fed7aa] mt-1">
                Đã đặt {formatVND(bid.amount)} VNĐ
              </div>
            </div>
          </div>
        );
      })}
      {reversedBids.length === 0 && (
        <div className="text-center text-sm text-slate-500 my-auto">Chưa có lượt đặt giá nào.</div>
      )}
    </div>
  );
}

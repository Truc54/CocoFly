"use client";

import { useState } from "react";
import { paymentApi } from "@/lib/api";
import { authStorage } from "@/lib/auth-storage";

function formatVND(n: number) {
  return n.toLocaleString("vi-VN");
}

interface AuctionEndedOverlayProps {
  winnerId: string | null;
  finalPrice: number | null;
  isBuyout: boolean;
}

export default function AuctionEndedOverlay({ winnerId, finalPrice, isBuyout }: AuctionEndedOverlayProps) {
  const [declining, setDeclining] = useState(false);
  const user = authStorage.getUser() as { id?: string } | null;
  const isWinner = user?.id && winnerId && user.id === winnerId;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-none border-2 border-slate-800 dark:border-slate-600 p-6 shadow-[6px_6px_0px_#1e293b]">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 border-2 border-slate-800 flex items-center justify-center shadow-[3px_3px_0px_#1e293b]">
          <span className="material-symbols-outlined text-3xl text-slate-800">
            {winnerId ? "emoji_events" : "cancel"}
          </span>
        </div>
        <h3 className="text-lg font-extrabold text-slate-800 dark:text-white uppercase tracking-wide">
          {isBuyout ? "ĐÃ MUA NGAY" : winnerId ? "ĐẤU GIÁ KẾT THÚC" : "KHÔNG CÓ NGƯỜI THẮNG"}
        </h3>
      </div>

      {/* Result */}
      {finalPrice && (
        <div className="text-center mb-6 p-4 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-none">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Giá cuối</p>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white tabular-nums">
            {formatVND(finalPrice)} <span className="text-base text-slate-500">VNĐ</span>
          </p>
        </div>
      )}

      {/* Winner Actions */}
      {isWinner && (
        <div className="space-y-3">
          <div className="text-center p-3 bg-green-50 border-2 border-green-200 rounded-none">
            <p className="text-sm font-bold text-green-700 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-lg">celebration</span>
              Chúc mừng! Bạn đã thắng!
            </p>
          </div>

          <button className="w-full py-3 bg-[#0066FF] text-white font-bold text-base rounded-full border-2 border-[#0066FF] shadow-[4px_4px_0px_#bfdbfe] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#bfdbfe] transition-all flex items-center justify-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">payment</span>
            Thanh toán ngay
          </button>

          <button
            onClick={async () => {
              if (declining) return;
              // TODO: Need paymentId — for now this is a placeholder
              setDeclining(true);
            }}
            disabled={declining}
            className="w-full py-2.5 bg-white text-slate-500 font-medium text-sm rounded-full border-2 border-slate-200 hover:border-red-300 hover:text-red-600 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
            Từ chối mua
          </button>
        </div>
      )}

      {/* Non-winner view */}
      {!isWinner && winnerId && (
        <div className="text-center text-sm text-slate-500">
          <p>Phiên đấu giá đã kết thúc thành công.</p>
        </div>
      )}

      {!winnerId && (
        <div className="text-center text-sm text-slate-500">
          <p>Không có lượt đặt giá nào. Sản phẩm đã được mở khóa.</p>
        </div>
      )}
    </div>
  );
}

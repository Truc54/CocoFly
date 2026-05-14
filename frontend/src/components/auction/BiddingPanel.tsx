"use client";

import { useState, useEffect } from "react";
import CountdownTimer from "./CountdownTimer";

function formatVND(n: number) {
  return n.toLocaleString("vi-VN");
}

function formatEndDate(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}, ${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

interface BiddingPanelProps {
  currentPrice: number;
  bidIncrement: number;
  buyoutPrice: number | null;
  endTime: string;
  status: string;
  isLeading: boolean | null;
  hasBid?: boolean;
  proxyMessage: string | null;
  proxyMaxBid: number | null;
  error: string | null;
  isExtended: boolean;
  extendCount: number;
  isLoggedIn: boolean;
  onPlaceBid: (amount: number, maxAutoBid?: number) => void;
  onBuyout: () => void;
  onClearError: () => void;
}

export default function BiddingPanel({
  currentPrice,
  bidIncrement,
  buyoutPrice,
  endTime,
  status,
  isLeading,
  hasBid,
  proxyMessage,
  proxyMaxBid,
  error,
  isExtended,
  extendCount,
  isLoggedIn,
  onPlaceBid,
  onBuyout,
  onClearError,
}: BiddingPanelProps) {
  const suggestedPrice = currentPrice + bidIncrement;
  const [bidAmount, setBidAmount] = useState<string>("");
  const [isProxy, setIsProxy] = useState(false);
  const [confirmBuyout, setConfirmBuyout] = useState(false);
  const [showBidConfirm, setShowBidConfirm] = useState(false);
  const [pendingBid, setPendingBid] = useState<{ amount: number; maxAutoBid?: number } | null>(null);

  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => setConfirmBuyout(false), [currentPrice]);

  const handleBidClick = () => {
    onClearError();
    setLocalError(null);

    const raw = bidAmount.replace(/\D/g, "");
    
    // If empty and proxy is ON, we must require an input
    if (!raw && isProxy) {
      setLocalError("Vui lòng nhập giá tối đa cho tự động đặt giá");
      return;
    }

    // Default to suggested price if empty (only when proxy is OFF)
    const inputVal = raw ? parseInt(raw, 10) : suggestedPrice;
    
    if (inputVal < suggestedPrice) {
      setLocalError(`Giá phải lớn hơn hoặc bằng ${formatVND(suggestedPrice)} VNĐ`);
      return;
    }

    setPendingBid({
      amount: isProxy ? suggestedPrice : inputVal,
      maxAutoBid: isProxy ? inputVal : undefined
    });
    setShowBidConfirm(true);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirmBid = () => {
    if (isSubmitting || !pendingBid) return;
    setIsSubmitting(true);
    onPlaceBid(pendingBid.amount, pendingBid.maxAutoBid);
    setShowBidConfirm(false);
    setPendingBid(null);
    setBidAmount("");
    // Reset after a short delay to allow next bid
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  const cancelBid = () => {
    setShowBidConfirm(false);
    setPendingBid(null);
  };

  const handleBuyout = () => {
    if (!confirmBuyout) {
      setConfirmBuyout(true);
      return;
    }
    onBuyout();
    setConfirmBuyout(false);
  };

  const handleInputChange = (value: string, setter: (v: string) => void) => {
    setLocalError(null);
    onClearError();
    const raw = value.replace(/\D/g, "");
    if (raw === "") {
      setter("");
      return;
    }
    setter(parseInt(raw, 10).toLocaleString("vi-VN"));
  };

  const isActive = status === "active";
  const isBidDisabled = isLeading === true;

  const displayError = error || localError;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-none border-2 border-slate-200 dark:border-slate-700 p-6 shadow-[4px_4px_0px_#E2B9A1] relative">
      {/* Full-screen Bid Confirmation Modal */}
      {showBidConfirm && pendingBid && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md border-2 border-slate-200 dark:border-slate-700 shadow-[8px_8px_0px_#E2B9A1] rounded-2xl overflow-hidden animate-slide-up">
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 mt-2">Xác nhận đặt giá</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Bạn có chắc chắn muốn {isProxy ? "kích hoạt tự động đặt giá với giới hạn" : "đặt giá"} <br/>
                <strong className="text-2xl text-orange-600 dark:text-orange-500 mt-2 block">{formatVND(isProxy ? pendingBid.maxAutoBid! : pendingBid.amount)} VNĐ</strong>
              </p>
              <div className="flex gap-3">
                <button onClick={cancelBid} className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 transition-all cursor-pointer rounded-xl">
                  Hủy bỏ
                </button>
                <button onClick={confirmBid} className="flex-1 py-3 font-bold text-white bg-[#0066FF] border-2 border-[#0066FF] hover:bg-blue-600 shadow-[4px_4px_0px_#bfdbfe] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#bfdbfe] active:translate-y-0 active:shadow-[2px_2px_0px_#bfdbfe] transition-all cursor-pointer rounded-xl">
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Price */}
      <div className="mb-6">
        <p className="text-2xl sm:text-3xl font-extrabold text-orange-600 dark:text-orange-500 tabular-nums">
          {formatVND(currentPrice)} <span className="text-lg sm:text-xl font-bold">VNĐ</span>
        </p>
        {buyoutPrice && (
          <p className="text-xs text-slate-400 mt-1">
            Mua ngay: <span className="font-bold text-orange-600">{formatVND(buyoutPrice)} VNĐ</span>
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t-2 border-slate-100 dark:border-slate-700 pt-4">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              Kết thúc lúc {formatEndDate(endTime)}
            </p>
            {isExtended && (
              <p className="text-[10px] text-orange-600 font-bold mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">update</span>
                Đã gia hạn {extendCount} lần
              </p>
            )}
          </div>
          <CountdownTimer endTime={endTime} />
        </div>
      </div>

      {/* Bid Input */}
      {isActive && isLoggedIn && (
        <div className="mb-4">
          {/* Error displayed ABOVE the input */}
          {displayError && (
            <div className="mb-2 flex items-center gap-2 text-sm text-red-700 bg-red-50 border-2 border-red-200 py-2.5 px-3 rounded-none font-bold shadow-[3px_3px_0px_#fca5a5]">
              <span className="material-symbols-outlined text-lg">error</span>
              {displayError}
            </div>
          )}

          <div className="relative mb-3">
            <input
              type="text"
              value={bidAmount}
              onChange={(e) => handleInputChange(e.target.value, setBidAmount)}
              placeholder={isProxy ? `Giá tối đa (Tối thiểu ${formatVND(suggestedPrice)})` : `Nhập giá (Tối thiểu ${formatVND(suggestedPrice)})`}
              onKeyDown={(e) => e.key === "Enter" && !isBidDisabled && handleBidClick()}
              disabled={isBidDisabled}
              className="w-full pl-4 pr-12 py-3 bg-white border-2 border-slate-300 rounded-none text-base font-bold text-slate-800 focus:border-slate-400 focus:ring-0 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal shadow-[inset_2px_2px_0px_#f1f5f9] disabled:opacity-50 disabled:bg-slate-50"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">VNĐ</span>
          </div>

          {/* Simple Toggle & Info */}
          <div className="flex items-center gap-1.5">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none w-fit">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={isProxy}
                  onChange={() => setIsProxy(!isProxy)} 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0066FF]"></div>
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Sử dụng tự động đặt giá
              </span>
            </label>
            <div className="relative group flex items-center">
              <span className="material-symbols-outlined text-[16px] text-slate-400 hover:text-[#0066FF] cursor-pointer transition-colors">info</span>
              {/* Tooltip */}
              <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-800 text-white text-xs leading-relaxed font-medium rounded-none shadow-[4px_4px_0px_#cbd5e1] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 pointer-events-none">
                Hệ thống sẽ tự động đặt giá thay bạn từng bước một, vừa đủ để dẫn đầu, cho đến khi đạt mức giá tối đa bạn nhập vào. Không ai khác biết giới hạn thật của bạn.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="space-y-3">
        {isActive && isLoggedIn ? (
          <>
            <button
              onClick={handleBidClick}
              disabled={isBidDisabled}
              className="w-full py-3 bg-[#0066FF] text-white font-bold text-base rounded-full border-2 border-[#0066FF] shadow-[4px_4px_0px_#bfdbfe] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#bfdbfe] active:translate-y-0 active:shadow-[2px_2px_0px_#bfdbfe] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#bfdbfe]"
            >
              <span className="material-symbols-outlined text-[20px]">{isBidDisabled ? "lock" : "gavel"}</span>
              {isBidDisabled 
                ? proxyMaxBid 
                  ? `ĐANG DẪN ĐẦU (PROXY MAX: ${formatVND(proxyMaxBid)})`
                  : "BẠN ĐANG DẪN ĐẦU" 
                : isProxy ? "KÍCH HOẠT PROXY BIDDING" : "ĐẶT GIÁ NGAY"}
            </button>

            {/* Proxy max bid info when leading via proxy */}
            {isBidDisabled && proxyMaxBid && (
              <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border-2 border-blue-200 py-2.5 px-3 rounded-none font-bold shadow-[2px_2px_0px_#bfdbfe]">
                <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                <span>Giới hạn tự động của bạn: <span className="text-blue-900">{formatVND(proxyMaxBid)} VNĐ</span></span>
              </div>
            )}

            {/* Proxy message */}
            {isBidDisabled && proxyMessage && !proxyMaxBid && (
              <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border-2 border-blue-200 py-2.5 px-3 rounded-none font-bold shadow-[2px_2px_0px_#bfdbfe]">
                <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                <span>{proxyMessage}</span>
              </div>
            )}

            {buyoutPrice && (
              <button
                onClick={handleBuyout}
                className={`w-full py-3 font-bold text-base rounded-full border-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  confirmBuyout
                    ? "bg-red-600 text-white border-red-600 shadow-[4px_4px_0px_#fca5a5] animate-pulse"
                    : "bg-orange-500 text-white border-orange-500 shadow-[4px_4px_0px_#fed7aa] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#fed7aa]"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                {confirmBuyout ? `XÁC NHẬN MUA ${formatVND(buyoutPrice)} VNĐ?` : `MUA NGAY — ${formatVND(buyoutPrice)} VNĐ`}
              </button>
            )}
          </>
        ) : (
          <button
            disabled
            className="w-full py-3 bg-slate-200 text-slate-500 font-bold text-base rounded-full border-2 border-slate-200 cursor-not-allowed flex items-center justify-center gap-2"
          >
            {!isLoggedIn ? "ĐĂNG NHẬP ĐỂ ĐẤU GIÁ" : status === "scheduled" ? "CHƯA BẮT ĐẦU" : "ĐÃ KẾT THÚC"}
          </button>
        )}

        <button className="w-full py-3 bg-white text-slate-700 font-bold text-base rounded-full border-2 border-slate-200 shadow-[3px_3px_0px_#cbd5e1] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#cbd5e1] active:translate-y-0 active:shadow-[1px_1px_0px_#cbd5e1] transition-all flex items-center justify-center gap-2 cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">favorite</span>
          Thêm vào yêu thích
        </button>
      </div>

      {/* Status: Outbid warning (only show when NOT leading, HAS bid before, and no error) */}
      {!displayError && isLeading === false && hasBid && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-red-700 bg-red-50 border-2 border-red-200 py-3 rounded-none font-bold shadow-[3px_3px_0px_#fca5a5]">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
          Bạn vừa bị vượt giá! Đặt lại ngay.
        </div>
      )}
    </div>
  );
}

"use client";

function formatVND(n: number) {
  return n.toLocaleString("vi-VN");
}

function formatDate(dateString: string) {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(d);
  } catch {
    return dateString;
  }
}

interface AuctionEndedOverlayProps {
  winnerId: string | null;
  winnerName: string | null;
  finalPrice: number | null;
  isBuyout: boolean;
  startTime: string;
  endTime: string;
  totalBids: number;
}

export default function AuctionEndedOverlay({
  winnerId,
  winnerName,
  finalPrice,
  isBuyout,
  startTime,
  endTime,
  totalBids,
}: AuctionEndedOverlayProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-none border-2 border-[#8f5c38] p-8 shadow-[6px_6px_0px_#E2B9A1] relative">
      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <div className="mb-4">
          <span className="material-symbols-outlined text-[48px] text-[#8f5c38]">
            {winnerId ? "workspace_premium" : "cancel"}
          </span>
        </div>
        <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-widest">
          {isBuyout ? "ĐÃ MUA NGAY" : winnerId ? "ĐẤU GIÁ KẾT THÚC" : "KHÔNG CÓ NGƯỜI THẮNG"}
        </h3>
      </div>

      <hr className="border-t-2 border-slate-200 dark:border-slate-700 border-dashed mb-6" />

      {/* Info List */}
      <div className="space-y-4 px-2 sm:px-6">
        <div className="flex justify-between items-baseline">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">Bắt đầu lúc</span>
          <span className="text-base font-bold text-slate-800 dark:text-slate-200">{formatDate(startTime)}</span>
        </div>
        
        <div className="flex justify-between items-baseline">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">Kết thúc lúc</span>
          <span className="text-base font-bold text-slate-800 dark:text-slate-200">{formatDate(endTime)}</span>
        </div>

        <div className="flex justify-between items-baseline">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">Số lượt đặt</span>
          <span className="text-base font-bold text-slate-800 dark:text-slate-200">{totalBids}</span>
        </div>

        {winnerId && (
          <div className="flex justify-between items-baseline pt-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">Người chiến thắng</span>
            <span className="text-lg font-black text-[#E25C24] uppercase tracking-wide">{winnerName || "Ẩn danh"}</span>
          </div>
        )}

        {finalPrice !== null && finalPrice > 0 && (
          <>
            <hr className="border-t border-slate-100 dark:border-slate-700 my-2" />
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">Giá chốt cuối cùng</span>
              <span className="text-xl font-black text-[#E25C24]">{formatVND(finalPrice)} VNĐ</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


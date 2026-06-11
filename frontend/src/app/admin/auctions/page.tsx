"use client";

import { useEffect, useState, startTransition } from "react";
import Link from "next/link";
import {
  Search,
  Gavel,
  Ban,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PowerOff,
  Eye,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";

interface Auction {
  id: string;
  startingPrice: string | number;
  currentPrice: string | number;
  buyoutPrice: string | number | null;
  auctionType: "english" | "dutch" | "sealed";
  status: "scheduled" | "active" | "ended" | "cancelled" | "failed";
  endTime: string;
  totalBids: number;
  createdAt: string;
  seller: {
    id: string;
    fullName: string | null;
    email: string;
  };
  item: {
    title: string;
    media: { cdnUrl: string }[];
  };
}

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [status, setStatus] = useState("");

  // Custom Dropdown Open State
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);

  // Action states
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [actionType, setActionType] = useState<"force-end" | "cancel" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const res = await adminApi.auctions.list({
        page,
        limit: 10,
        status: status || undefined,
        search,
      });
      if (res && res.success) {
        setAuctions(res.data.auctions);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch auctions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, [page, search, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInputValue);
  };

  const executeAction = async () => {
    if (!selectedAuction || !actionType) return;
    try {
      setSubmitting(true);
      if (actionType === "force-end") {
        await adminApi.auctions.forceEnd(selectedAuction.id);
      } else if (actionType === "cancel") {
        await adminApi.auctions.cancel(selectedAuction.id);
      }

      await fetchAuctions();
      closeActionDialog();
    } catch (error: any) {
      alert(error?.message || "Đã xảy ra lỗi khi thực hiện thao tác");
    } finally {
      setSubmitting(false);
    }
  };

  const openActionDialog = (auction: Auction, type: "force-end" | "cancel") => {
    setSelectedAuction(auction);
    setActionType(type);
    setActiveMenuId(null);
  };

  const closeActionDialog = () => {
    setSelectedAuction(null);
    setActionType(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center gap-1 w-max">Đang diễn ra</span>;
      case "ended":
        return <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-600 rounded-full border border-blue-100 flex items-center gap-1 w-max">Đã kết thúc</span>;
      case "scheduled":
        return <span className="px-2.5 py-1 text-xs font-bold bg-slate-50 text-slate-500 rounded-full border border-slate-200 flex items-center gap-1 w-max">Đang lên lịch</span>;
      case "cancelled":
        return <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-600 rounded-full border border-amber-100 flex items-center gap-1 w-max">Đã hủy</span>;
      case "failed":
      default:
        return <span className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-600 rounded-full border border-red-100 flex items-center gap-1 w-max">Thất bại</span>;
    }
  };

  const getStatusFilterLabel = (val: string) => {
    if (val === "scheduled") return "Đang lên lịch";
    if (val === "active") return "Đang diễn ra";
    if (val === "ended") return "Đã kết thúc";
    if (val === "cancelled") return "Đã hủy";
    if (val === "failed") return "Thất bại";
    return "Tất cả";
  };

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between z-10 relative">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 w-full lg:w-96 transition-all focus-within:bg-white focus-within:border-slate-200">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề sản phẩm..."
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
          />
          <button type="submit" className="hidden" />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Custom Rounded Dropdown for Status */}
          <div className="flex items-center gap-2 relative">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái:</span>
            <button
              type="button"
              onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
              className="bg-slate-50 border border-slate-100 hover:border-slate-200 text-sm text-slate-700 rounded-xl px-4 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer min-w-[140px] font-semibold"
            >
              <span>{getStatusFilterLabel(status)}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            {isStatusFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsStatusFilterOpen(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 w-44 z-20 text-left overflow-hidden">
                  {[
                    { val: "", label: "Tất cả" },
                    { val: "scheduled", label: "Đang lên lịch" },
                    { val: "active", label: "Đang diễn ra" },
                    { val: "ended", label: "Đã kết thúc" },
                    { val: "cancelled", label: "Đã hủy" },
                    { val: "failed", label: "Thất bại" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => {
                        setStatus(opt.val);
                        setIsStatusFilterOpen(false);
                        setPage(1);
                      }}
                      className={`w-full px-4 py-2 text-xs font-bold text-left block transition-colors cursor-pointer ${
                        status === opt.val
                          ? "bg-[#8f5c38]/5 text-[#8f5c38]"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Auctions Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[320px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Phiên đấu giá</th>
                <th className="px-6 py-4">Người bán</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Giá hiện tại</th>
                <th className="px-6 py-4 text-center">Kết thúc</th>
                <th className="px-6 py-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0" />
                      <div className="space-y-2">
                        <div className="h-4 w-48 bg-slate-100 rounded-md" />
                        <div className="h-3 w-24 bg-slate-100 rounded-md" />
                      </div>
                    </td>
                    <td className="px-6 py-5"><div className="h-4 w-24 bg-slate-100 rounded-md" /></td>
                    <td className="px-6 py-5"><div className="h-6 w-20 bg-slate-100 rounded-full" /></td>
                    <td className="px-6 py-5"><div className="h-4 w-20 bg-slate-100 rounded-md ml-auto" /></td>
                    <td className="px-6 py-5"><div className="h-4 w-16 bg-slate-100 rounded-md mx-auto" /></td>
                    <td className="px-6 py-5"><div className="h-8 w-8 bg-slate-100 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : auctions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-medium">
                    Không tìm thấy phiên đấu giá nào.
                  </td>
                </tr>
              ) : (
                auctions.map((auction, index) => {
                  const isLowerRow = index >= 4 || index >= auctions.length - 2;

                  return (
                    <tr key={auction.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0">
                            {auction.item.media && auction.item.media[0] ? (
                              <img src={auction.item.media[0].cdnUrl} alt={auction.item.title} className="w-full h-full object-cover" />
                            ) : (
                              <Gavel className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900 leading-snug line-clamp-1">{auction.item.title}</p>
                            <p className="text-[10px] font-mono text-slate-400 leading-snug">{auction.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900 leading-none">{auction.seller.fullName || "Chưa đặt tên"}</p>
                          <p className="text-xs text-slate-400 leading-none mt-1">{auction.seller.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(auction.status)}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                        {Number(auction.currentPrice).toLocaleString()}₫
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-slate-500 font-medium">
                        {new Date(auction.endTime).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-block relative">
                          <button
                            onClick={() => startTransition(() => {
                              setActiveMenuId(activeMenuId === auction.id ? null : auction.id);
                            })}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4.5 h-4.5" />
                          </button>
                          
                          {activeMenuId === auction.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => startTransition(() => setActiveMenuId(null))}
                              />
                              <div
                                className={`absolute right-0 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 w-44 z-20 text-left overflow-hidden ${
                                  isLowerRow ? "bottom-full mb-1.5" : "top-full mt-1.5"
                                }`}
                              >
                                <Link
                                  href={`/admin/auctions/${auction.id}`}
                                  className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Xem chi tiết
                                </Link>
                                
                                {auction.status === "active" && (
                                  <button
                                    onClick={() => openActionDialog(auction, "force-end")}
                                    className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors border-t border-slate-50"
                                  >
                                    <PowerOff className="w-3.5 h-3.5" /> Kết thúc sớm
                                  </button>
                                )}
                                
                                {(auction.status === "active" || auction.status === "scheduled") && (
                                  <button
                                    onClick={() => openActionDialog(auction, "cancel")}
                                    className={`w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors ${
                                      auction.status !== "active" ? "border-t border-slate-50" : ""
                                    }`}
                                  >
                                    <Ban className="w-3.5 h-3.5" /> Hủy phiên đấu giá
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1 || loading}
                className="p-2 border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-xs disabled:cursor-not-allowed bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-slate-700 px-3 py-1 bg-white border border-slate-200 rounded-xl shadow-xs">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages || loading}
                className="p-2 border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-xs disabled:cursor-not-allowed bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Dialogs */}
      {selectedAuction && actionType === "force-end" && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={closeActionDialog}
          onConfirm={executeAction}
          isLoading={submitting}
          variant="warning"
          title="Buộc kết thúc sớm phiên đấu giá"
          description={`Bạn đang chuẩn bị kết thúc sớm phiên đấu giá "${selectedAuction.item.title}". Người trả giá cao nhất tại thời điểm này sẽ được chọn làm người thắng cuộc.`}
          confirmText="Xác nhận Kết thúc"
        />
      )}

      {selectedAuction && actionType === "cancel" && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={closeActionDialog}
          onConfirm={executeAction}
          isLoading={submitting}
          variant="danger"
          title="Hủy phiên đấu giá"
          description={`Bạn có chắc chắn muốn hủy phiên đấu giá "${selectedAuction.item.title}"? Tất cả lượt đặt giá (nếu có) sẽ bị hủy và sản phẩm sẽ được mở khóa lại.`}
          confirmText="Xác nhận Hủy"
        />
      )}
    </div>
  );
}

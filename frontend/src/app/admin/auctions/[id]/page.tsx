"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Gavel,
  Calendar,
  Clock,
  DollarSign,
  AlertTriangle,
  User,
  Info,
  Mail,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";

interface Bid {
  id: string;
  amount: string | number;
  createdAt: string;
  isAutoBid: boolean;
  ipAddress: string | null;
  bidder: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl?: string | null;
  };
}

interface AuctionDetail {
  id: string;
  startingPrice: string | number;
  currentPrice: string | number;
  buyoutPrice: string | number | null;
  bidIncrement: string | number;
  auctionType: "english" | "dutch" | "sealed";
  status: "scheduled" | "active" | "ended" | "cancelled" | "failed";
  scheduledStart: string;
  endTime: string;
  actualEndTime: string | null;
  totalBids: number;
  totalWatchers: number;
  viewCount: number;
  seller: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl?: string | null;
  };
  item: {
    title: string;
    description: string | null;
    condition: string;
    brand: string | null;
    location: string | null;
    category: { name: string };
    media: { id: string; cdnUrl: string; type: string }[];
  };
  bids: Bid[];
  winner: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl?: string | null;
  } | null;
}

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const auctionId = resolvedParams.id;

  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>("");

  // Action states
  const [actionType, setActionType] = useState<"force-end" | "cancel" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAuctionDetail = async () => {
    try {
      setLoading(true);
      const res = await adminApi.auctions.getById(auctionId);
      if (res && res.success) {
        setAuction(res.data);
        if (res.data.item.media && res.data.item.media.length > 0) {
          setActiveImage(res.data.item.media[0].cdnUrl);
        }
      } else {
        router.push("/admin/auctions");
      }
    } catch (error) {
      console.error("Failed to fetch auction details:", error);
      router.push("/admin/auctions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctionDetail();
  }, [auctionId]);

  const handleAction = async () => {
    if (!auction || !actionType) return;
    try {
      setSubmitting(true);
      if (actionType === "force-end") {
        await adminApi.auctions.forceEnd(auction.id);
      } else if (actionType === "cancel") {
        await adminApi.auctions.cancel(auction.id);
      }
      await fetchAuctionDetail();
      setActionType(null);
    } catch (error: any) {
      alert(error?.message || "Đã xảy ra lỗi khi thực hiện thao tác");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 uppercase">Đang diễn ra</span>;
      case "ended":
        return <span className="px-2.5 py-1 text-xs font-bold bg-slate-50 text-slate-500 rounded-full border border-slate-200 uppercase">Đã kết thúc</span>;
      case "cancelled":
        return <span className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-600 rounded-full border border-red-100 uppercase">Đã hủy</span>;
      case "failed":
        return <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-600 rounded-full border border-amber-100 uppercase">Thất bại</span>;
      case "scheduled":
      default:
        return <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-600 rounded-full border border-blue-100 uppercase">Lên lịch</span>;
    }
  };

  const getShillBiddingAlerts = () => {
    if (!auction || !auction.bids) return [];
    // Group bidders by IP
    const ipMap: Record<string, Set<string>> = {};
    auction.bids.forEach((bid) => {
      if (bid.ipAddress) {
        if (!ipMap[bid.ipAddress]) ipMap[bid.ipAddress] = new Set();
        ipMap[bid.ipAddress].add(bid.bidder.id);
      }
    });

    const alerts: { ip: string; count: number }[] = [];
    Object.keys(ipMap).forEach((ip) => {
      if (ipMap[ip].size > 1) {
        alerts.push({ ip, count: ipMap[ip].size });
      }
    });
    return alerts;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-[#8f5c38]/20 border-t-[#8f5c38] rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Đang tải chi tiết phiên đấu giá...</p>
      </div>
    );
  }

  if (!auction) return null;

  const shillAlerts = getShillBiddingAlerts();

  return (
    <div className="space-y-6">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/auctions"
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-xs font-bold text-[#8f5c38] tracking-wider uppercase">Quản lý đấu giá</p>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Chi tiết phiên #{auction.id.substring(0, 8)}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(auction.status)}
        </div>
      </div>

      {/* Shill Bidding Warning Banner */}
      {shillAlerts.length > 0 && auction.status === "active" && (
        <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-4 flex gap-3 text-red-800">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">Cảnh báo Shill Bidding!</h4>
            <p className="text-[11px] font-medium leading-relaxed text-red-700 mt-1">
              Phát hiện {shillAlerts.length} địa chỉ IP dùng chung bởi nhiều tài khoản đặt thầu khác nhau:
            </p>
            <ul className="list-disc pl-4 mt-1 text-[10px] font-mono font-bold text-red-600 space-y-0.5">
              {shillAlerts.map((alert, i) => (
                <li key={i}>IP {alert.ip}: {alert.count} tài khoản trùng IP.</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Columns: Media & Auction Bids */}
        <div className="lg:col-span-2 space-y-6">
          {/* Item Detail Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row gap-6">
            {/* Image Gallery */}
            <div className="w-full md:w-64 space-y-3 flex-shrink-0">
              <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                {activeImage ? (
                  <img src={activeImage} alt="Product" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Gavel className="w-12 h-12" />
                  </div>
                )}
              </div>
              {auction.item.media && auction.item.media.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {auction.item.media.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(img.cdnUrl)}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 cursor-pointer ${
                        activeImage === img.cdnUrl ? "border-[#8f5c38]" : "border-slate-100"
                      }`}
                    >
                      <img src={img.cdnUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Information */}
            <div className="flex-1 space-y-4">
              <div>
                <span className="text-[10px] font-extrabold bg-[#8f5c38]/10 text-[#8f5c38] px-2 py-0.5 rounded-md uppercase tracking-wider">{auction.item.category.name}</span>
                <h3 className="text-lg font-bold text-slate-900 leading-snug mt-1.5">{auction.item.title}</h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">Tình trạng: <span className="text-slate-700 capitalize">{auction.item.condition}</span> · Thương hiệu: <span className="text-slate-700">{auction.item.brand || "—"}</span></p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Mô tả chi tiết:</p>
                <p className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 leading-relaxed max-h-36 overflow-y-auto font-sans">{auction.item.description || "Không có mô tả sản phẩm."}</p>
              </div>
            </div>
          </div>

          {/* Bids History Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <Clock className="w-4 h-4 text-[#8f5c38]" /> Lịch sử đặt thầu ({auction.bids.length} lượt)
            </h4>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3">Người đặt thầu</th>
                    <th className="px-6 py-3 text-right">Mức giá</th>
                    <th className="px-6 py-3 text-center">Thời gian</th>
                    <th className="px-6 py-3 text-center">Hình thức</th>
                    <th className="px-6 py-3 text-center">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {auction.bids.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                        Chưa có lượt đặt giá nào.
                      </td>
                    </tr>
                  ) : (
                    auction.bids.map((bid) => {
                      // Check if IP is shared (shill bid danger)
                      const isSharedIP = shillAlerts.some(alert => alert.ip === bid.ipAddress);
                      
                      return (
                        <tr key={bid.id} className={`hover:bg-slate-50/50 transition-colors ${isSharedIP ? "bg-red-50/20" : ""}`}>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                {bid.bidder.avatarUrl ? (
                                  <img src={bid.bidder.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                                    {(bid.bidder.fullName || bid.bidder.email).substring(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <p className="font-bold text-slate-900 leading-none truncate">{bid.bidder.fullName || "Khách"}</p>
                                <p className="text-xs text-slate-400 leading-none mt-1 truncate">{bid.bidder.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-900">
                            {Number(bid.amount).toLocaleString()}₫
                          </td>
                          <td className="px-6 py-3.5 text-center text-xs text-slate-500 font-medium">
                            {new Date(bid.createdAt).toLocaleString("vi-VN")}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            {bid.isAutoBid ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-50 text-purple-600 rounded-full border border-purple-100">Auto</span>
                            ) : (
                              <span className="text-slate-300 font-medium">—</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <span className={`font-mono text-xs px-2 py-0.5 rounded-md ${
                              isSharedIP ? "bg-red-50 text-red-600 border border-red-100 font-bold" : "text-slate-400"
                            }`}>
                              {bid.ipAddress || "Không rõ"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Columns: Seller & Configuration */}
        <div className="space-y-6">
          {/* Seller Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4" /> Người bán
            </h4>
            <div className="flex items-center gap-3">
              {auction.seller.avatarUrl ? (
                <img src={auction.seller.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center font-mono font-bold text-slate-400">
                  {(auction.seller.fullName || auction.seller.email).substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="space-y-0.5">
                <Link
                  href={`/admin/users/${auction.seller.id}`}
                  className="font-bold text-slate-900 hover:text-[#8f5c38] transition-colors leading-none block"
                >
                  {auction.seller.fullName || "Chưa đặt tên"}
                </Link>
                <p className="text-xs text-slate-400 leading-none mt-1">{auction.seller.email}</p>
              </div>
            </div>
          </div>

          {/* Configuration Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4" /> Cấu hình đấu giá
            </h4>

            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-slate-400" /> Khởi điểm:</span>
                <span className="font-bold text-orange-600 font-mono">{Number(auction.startingPrice).toLocaleString()}₫</span>
              </div>

              {/* Conditional pricing & winner based on status */}
              {auction.status === "active" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-slate-400" /> Hiện tại:</span>
                    <span className="font-extrabold text-orange-600 font-mono text-base">{Number(auction.currentPrice).toLocaleString()}₫</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> Kết thúc lúc:</span>
                    <span className="font-bold text-slate-700">{new Date(auction.endTime).toLocaleTimeString("vi-VN")} {new Date(auction.endTime).toLocaleDateString("vi-VN")}</span>
                  </div>
                </>
              )}

              {auction.status === "ended" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-slate-400" /> Giá thắng cuộc:</span>
                    <span className="font-extrabold text-green-600 font-mono text-base">{Number(auction.currentPrice).toLocaleString()}₫</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" /> Người thắng:</span>
                    <span className="font-bold text-slate-800">
                      {auction.winner ? (
                        <Link href={`/admin/users/${auction.winner.id}`} className="text-[#8f5c38]">
                          {auction.winner.fullName || auction.winner.email}
                        </Link>
                      ) : (
                        "Chưa có"
                      )}
                    </span>
                  </div>
                </>
              )}

              {auction.status === "cancelled" && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold leading-relaxed">
                  Phiên đấu giá này đã bị hủy bỏ bởi ban quản trị và không có giao dịch được thực hiện.
                </div>
              )}
            </div>

            {/* Action Buttons for Admin */}
            {auction.status === "active" && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setActionType("force-end")}
                  disabled={submitting}
                  className="w-full py-2.5 bg-[#8f5c38]/10 hover:bg-[#8f5c38]/20 text-[#8f5c38] font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  Buộc kết thúc sớm
                </button>
                <button
                  onClick={() => setActionType("cancel")}
                  disabled={submitting}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  Hủy phiên đấu giá
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      {actionType === "force-end" && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setActionType(null)}
          onConfirm={handleAction}
          isLoading={submitting}
          variant="warning"
          title="Buộc kết thúc phiên đấu giá"
          description="Hành động này sẽ buộc phiên đấu giá kết thúc ngay lập tức. Người đặt giá cao nhất hợp lệ (nếu có) sẽ thắng phiên đấu giá này. Bạn có chắc chắn muốn thực hiện?"
          confirmText="Xác nhận kết thúc"
        />
      )}

      {actionType === "cancel" && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setActionType(null)}
          onConfirm={handleAction}
          isLoading={submitting}
          variant="danger"
          title="Hủy phiên đấu giá"
          description="Hành động này sẽ hủy hoàn toàn phiên đấu giá đang diễn ra. Tất cả các lượt đặt giá sẽ bị hủy bỏ và phiên đấu giá sẽ đóng lại. Bạn có chắc chắn muốn thực hiện?"
          confirmText="Xác nhận hủy"
        />
      )}
    </div>
  );
}

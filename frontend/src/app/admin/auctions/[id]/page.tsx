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

  const executeAction = async () => {
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
      alert(error?.message || "Đã xảy ra lỗi");
    } finally {
      setSubmitting(false);
    }
  };

  // Shill Bidding Analysis: Flag IPs that have bids from multiple distinct bidder accounts
  const getShillBiddingAlerts = () => {
    if (!auction || !auction.bids) return [];
    
    const ipToBidders: Record<string, Set<string>> = {};
    auction.bids.forEach((bid) => {
      if (bid.ipAddress) {
        if (!ipToBidders[bid.ipAddress]) {
          ipToBidders[bid.ipAddress] = new Set();
        }
        ipToBidders[bid.ipAddress].add(bid.bidder.id);
      }
    });

    const flaggedIPs: { ip: string; count: number }[] = [];
    Object.keys(ipToBidders).forEach((ip) => {
      if (ipToBidders[ip].size > 1) {
        flaggedIPs.push({ ip, count: ipToBidders[ip].size });
      }
    });

    return flaggedIPs;
  };

  const shillAlerts = getShillBiddingAlerts();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 uppercase">Đang diễn ra</span>;
      case "ended":
        return <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-600 rounded-full border border-blue-100 uppercase">Đã kết thúc</span>;
      case "scheduled":
        return <span className="px-2.5 py-1 text-xs font-bold bg-slate-50 text-slate-500 rounded-full border border-slate-200 uppercase">Đang lên lịch</span>;
      case "cancelled":
        return <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-600 rounded-full border border-amber-100 uppercase">Đã hủy</span>;
      case "failed":
      default:
        return <span className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-600 rounded-full border border-red-100 uppercase">Thất bại</span>;
    }
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
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Chi tiết phiên</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(auction.status)}
        </div>
      </div>

      {/* Shill Bidding Warning Alert */}
      {shillAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3.5 text-red-700">
          <AlertTriangle className="w-5.5 h-5.5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-red-950">Phát hiện nghi vấn Shill Bidding!</h4>
            <p className="text-xs leading-relaxed text-red-700">
              Có <strong>{shillAlerts.length}</strong> địa chỉ IP được chia sẻ bởi nhiều tài khoản đặt giá khác nhau:
            </p>
            <ul className="list-disc list-inside text-xs mt-1.5 space-y-1.5">
              {shillAlerts.map((alert, idx) => (
                <li key={idx} className="font-mono">
                  IP: <span className="font-bold">{alert.ip}</span> được dùng bởi <span className="font-bold">{alert.count} tài khoản khác nhau</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Columns: Item Info & Configs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Item Info Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Media Gallery */}
              <div className="space-y-3">
                <div className="w-full aspect-square rounded-xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center">
                  {activeImage ? (
                    <img src={activeImage} alt={auction.item.title} className="w-full h-full object-cover" />
                  ) : (
                    <Gavel className="w-12 h-12 text-slate-300" />
                  )}
                </div>
                {auction.item.media && auction.item.media.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {auction.item.media.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImage(img.cdnUrl)}
                        className={`w-12 h-12 rounded-lg overflow-hidden border flex-shrink-0 cursor-pointer transition-all ${
                          activeImage === img.cdnUrl ? "border-[#8f5c38] ring-2 ring-[#8f5c38]/10" : "border-slate-200"
                        }`}
                      >
                        <img src={img.cdnUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title & Desc */}
              <div className="md:col-span-2 space-y-4">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#8f5c38]/10 text-[#8f5c38] rounded-full border border-[#8f5c38]/20 uppercase">
                    {auction.item.category.name}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{auction.item.title}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-slate-400 font-bold uppercase tracking-wider">Tình trạng</p>
                    <p className="font-semibold text-slate-800 mt-0.5 capitalize">{auction.item.condition}</p>
                  </div>
                  <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-slate-400 font-bold uppercase tracking-wider">Thương hiệu</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{auction.item.brand || "—"}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mô tả sản phẩm:</span>
                  <p className="text-sm text-slate-500 leading-relaxed max-h-40 overflow-y-auto pr-2">
                    {auction.item.description || "Không có mô tả sản phẩm."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bid History Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Gavel className="w-4 h-4" /> Lịch sử đặt giá ({auction.bids.length} lượt)
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/20 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-3">Người đặt</th>
                    <th className="px-6 py-3 text-right">Giá đặt</th>
                    <th className="px-6 py-3 text-center">Thời gian</th>
                    <th className="px-6 py-3 text-center">Auto Bid</th>
                    <th className="px-6 py-3 text-center">Địa chỉ IP</th>
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
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-900 leading-none">{bid.bidder.fullName || "Khách"}</p>
                              <p className="text-xs text-slate-400 leading-none mt-1">{bid.bidder.email}</p>
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
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center font-mono font-bold text-slate-400">
                {(auction.seller.fullName || auction.seller.email).substring(0, 2).toUpperCase()}
              </div>
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
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-slate-400" /> Giá mua đứt:</span>
                    <span className={`font-bold font-mono ${auction.buyoutPrice ? "text-orange-600" : "text-slate-500"}`}>
                      {auction.buyoutPrice ? `${Number(auction.buyoutPrice).toLocaleString()}₫` : "Không có"}
                    </span>
                  </div>
                </>
              )}

              {(auction.status === "scheduled" || auction.status === "failed" || auction.status === "cancelled") && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-slate-400" /> Giá mua đứt:</span>
                  <span className={`font-bold font-mono ${auction.buyoutPrice ? "text-orange-600" : "text-slate-500"}`}>
                    {auction.buyoutPrice ? `${Number(auction.buyoutPrice).toLocaleString()}₫` : "Không có"}
                  </span>
                </div>
              )}

              {auction.status === "ended" && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-slate-400" /> Giá chốt cuối cùng:</span>
                    <span className="font-extrabold text-orange-600 font-mono text-base">{Number(auction.currentPrice).toLocaleString()}₫</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5"><User className="w-4 h-4 text-sky-500" /> Người thắng cuộc:</span>
                    {auction.winner ? (
                      <Link href={`/admin/users/${auction.winner.id}`} className="font-bold text-[#8f5c38] block leading-tight">
                        {auction.winner.fullName || "Chưa đặt tên"}
                      </Link>
                    ) : (
                      <span className="font-semibold text-slate-400">Không có</span>
                    )}
                  </div>
                  {auction.winner && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" /> Email:</span>
                      <span className="font-semibold text-slate-800">{auction.winner.email}</span>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Bắt đầu:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(auction.scheduledStart).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "numeric", year: "numeric" })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5"><Clock className="w-4 h-4" /> Kết thúc:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(auction.endTime).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Dialogs */}
      {actionType === "force-end" && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setActionType(null)}
          onConfirm={executeAction}
          isLoading={submitting}
          variant="warning"
          title="Buộc kết thúc sớm phiên đấu giá"
          description={`Bạn đang chuẩn bị kết thúc sớm phiên đấu giá này. Người đặt giá cao nhất tại thời điểm hiện tại (${
            auction.bids[0] ? `${Number(auction.bids[0].amount).toLocaleString()}₫ bởi ${auction.bids[0].bidder.fullName}` : "chưa có ai đặt"
          }) sẽ thắng phiên.`}
          confirmText="Xác nhận Kết thúc"
        />
      )}

      {actionType === "cancel" && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setActionType(null)}
          onConfirm={executeAction}
          isLoading={submitting}
          variant="danger"
          title="Hủy phiên đấu giá"
          description="Bạn có chắc chắn muốn hủy phiên đấu giá này? Sản phẩm liên quan sẽ được đưa về trạng thái hoạt động để đăng lại."
          confirmText="Xác nhận Hủy"
        />
      )}
    </div>
  );
}

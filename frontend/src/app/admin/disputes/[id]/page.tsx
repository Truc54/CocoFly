"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Scale,
  DollarSign,
  AlertTriangle,
  User,
  Info,
  Clock,
  CheckCircle,
  ShieldAlert,
  MessageSquare,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";

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

interface DisputeDetail {
  id: string;
  paymentId: string;
  openedById: string;
  reason: string;
  sellerResponse: string | null;
  status: "pending" | "resolved";
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string | null;
  openedBy: {
    id: string;
    fullName: string | null;
    email: string;
    rating: string | number;
    createdAt: string;
    nonPaymentStrikes: number;
    avatarUrl?: string | null;
  };
  resolvedBy: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl?: string | null;
  } | null;
  payment: {
    id: string;
    amount: string | number;
    platformFee: string | number;
    sellerAmount: string | number;
    paymentMethod: string;
    status: string;
    shippingStatus: string;
    createdAt: string;
    buyer: { id: string; fullName: string | null; email: string; rating: string | number; avatarUrl?: string | null };
    seller: { id: string; fullName: string | null; email: string; rating: string | number; nonPaymentStrikes: number; avatarUrl?: string | null };
    auction: {
      id: string;
      startingPrice: string | number;
      currentPrice: string | number;
      buyoutPrice: string | number | null;
      scheduledStart: string;
      endTime: string;
      item: {
        title: string;
        description: string | null;
        condition: string;
        brand: string | null;
        media: { id: string; cdnUrl: string; type: string }[];
      };
      bids: Bid[];
      seller: { id: string; fullName: string | null; email: string; rating: string | number; avatarUrl?: string | null };
    };
  };
}

export default function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const disputeId = resolvedParams.id;

  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Resolution modal states
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [refundBuyer, setRefundBuyer] = useState(false);
  const [strikeSeller, setStrikeSeller] = useState(false);
  const [strikeBuyer, setStrikeBuyer] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");

  const fetchDisputeDetail = async () => {
    try {
      setLoading(true);
      const res = await adminApi.disputes.getById(disputeId);
      if (res && res.success) {
        setDispute(res.data);
      } else {
        router.push("/admin/disputes");
      }
    } catch (error) {
      console.error("Failed to fetch dispute details:", error);
      router.push("/admin/disputes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputeDetail();
  }, [disputeId]);

  const handleResolve = async () => {
    if (!dispute || !resolutionNote.trim()) return;
    try {
      setSubmitting(true);
      await adminApi.disputes.resolve(dispute.id, {
        refundBuyer,
        strikeSeller,
        strikeBuyer,
        note: resolutionNote,
      });
      setShowResolveModal(false);
      await fetchDisputeDetail();
    } catch (error: any) {
      alert(error?.message || "Đã xảy ra lỗi khi phân xử tranh chấp");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 uppercase">Đã xử lý</span>;
      case "pending":
      default:
        return <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-600 rounded-full border border-amber-100 uppercase animate-pulse">Chờ xử lý</span>;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ thanh toán";
      case "paid":
        return "Đã thanh toán";
      case "escrow_released":
        return "Đã hoàn thành";
      case "refunded":
        return "Đã hoàn tiền";
      case "failed":
        return "Thất bại";
      default:
        return status;
    }
  };

  // Shill Bidding Checker: flagging shared IPs
  const getFlaggedIPs = () => {
    if (!dispute || !dispute.payment.auction.bids) return [];
    const ipToBidders: Record<string, Set<string>> = {};
    dispute.payment.auction.bids.forEach((bid) => {
      if (bid.ipAddress) {
        if (!ipToBidders[bid.ipAddress]) ipToBidders[bid.ipAddress] = new Set();
        ipToBidders[bid.ipAddress].add(bid.bidder.id);
      }
    });

    const flagged: string[] = [];
    Object.keys(ipToBidders).forEach((ip) => {
      if (ipToBidders[ip].size > 1) flagged.push(ip);
    });
    return flagged;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-[#8f5c38]/20 border-t-[#8f5c38] rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Đang tải chi tiết khiếu nại...</p>
      </div>
    );
  }

  if (!dispute) return null;

  const shillIPs = getFlaggedIPs();

  return (
    <div className="space-y-6">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/disputes"
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-xs font-bold text-[#8f5c38] tracking-wider uppercase">Giải quyết khiếu nại</p>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Chi tiết tranh chấp #{dispute.id.substring(0, 8)}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(dispute.status)}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Dispute Details & Auction Bids */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Dispute Description Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <Scale className="w-4 h-4 text-red-500" /> Lý do mở khiếu nại (Người mua)
            </h4>
            
            <div className="space-y-3">
              <div className="bg-red-50/20 p-4 rounded-xl border border-red-100/30">
                <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">{dispute.reason}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                <span>Người mở: {dispute.openedBy.fullName || dispute.openedBy.email}</span>
                <span>Ngày gửi: {new Date(dispute.createdAt).toLocaleString("vi-VN")}</span>
              </div>
            </div>
          </div>

          {/* Seller Response Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <MessageSquare className="w-4 h-4 text-blue-500" /> Phản hồi từ người tạo đấu giá (Người bán)
            </h4>
            
            {dispute.sellerResponse ? (
              <div className="space-y-3">
                <div className="bg-blue-50/20 p-4 rounded-xl border border-blue-100/30">
                  <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">{dispute.sellerResponse}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                  <span>Người phản hồi: {dispute.payment.seller.fullName || dispute.payment.seller.email}</span>
                  <span>Ngày gửi: {dispute.updatedAt ? new Date(dispute.updatedAt).toLocaleString("vi-VN") : new Date(dispute.createdAt).toLocaleString("vi-VN")}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center py-8">
                <p className="text-sm font-bold text-slate-400">Người bán chưa gửi phản hồi kháng cáo cho khiếu nại này.</p>
              </div>
            )}
          </div>

          {/* Resolution Note if resolved */}
          {dispute.status === "resolved" && dispute.resolutionNote && (
            <div className="bg-emerald-50/20 p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-3">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-emerald-100 pb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Kết quả phân xử từ Ban quản trị
              </p>
              <div className="bg-white p-4 rounded-xl border border-emerald-100 space-y-2">
                <p className="text-sm text-slate-700 leading-relaxed font-semibold italic">
                  "{dispute.resolutionNote}"
                </p>
                {dispute.resolvedBy && (
                  <p className="text-[10px] text-slate-400 font-bold">
                    Xử lý bởi: {dispute.resolvedBy.fullName || dispute.resolvedBy.email}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Auction detail card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <Info className="w-4 h-4 text-[#8f5c38]" /> Thông tin phiên đấu giá liên quan
            </h4>

            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0 flex items-center justify-center">
                {dispute.payment.auction.item.media && dispute.payment.auction.item.media[0] ? (
                  <img src={dispute.payment.auction.item.media[0].cdnUrl} alt="Product" className="w-full h-full object-cover" />
                ) : (
                  <Scale className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div className="space-y-1">
                <Link href={`/admin/auctions/${dispute.payment.auction.id}`} className="text-base font-bold text-slate-900 hover:text-[#8f5c38] transition-colors leading-snug">
                  {dispute.payment.auction.item.title}
                </Link>
                <p className="text-xs text-slate-400">
                  Tình trạng: <span className="font-semibold text-slate-700 capitalize">{dispute.payment.auction.item.condition}</span> · Thương hiệu: <span className="font-semibold text-slate-700">{dispute.payment.auction.item.brand || "—"}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <p className="text-slate-400 font-bold uppercase tracking-wider">Khởi điểm</p>
                <p className="font-bold text-slate-800 font-mono mt-0.5">{Number(dispute.payment.auction.startingPrice).toLocaleString()}₫</p>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <p className="text-slate-400 font-bold uppercase tracking-wider">Giá cuối cùng</p>
                <p className="font-bold text-orange-600 font-mono mt-0.5">{Number(dispute.payment.auction.currentPrice).toLocaleString()}₫</p>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <p className="text-slate-400 font-bold uppercase tracking-wider">Thời gian bắt đầu</p>
                <p className="font-semibold text-slate-800 mt-0.5">{new Date(dispute.payment.auction.scheduledStart).toLocaleDateString("vi-VN")}</p>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <p className="text-slate-400 font-bold uppercase tracking-wider">Thời gian kết thúc</p>
                <p className="font-semibold text-slate-800 mt-0.5">{new Date(dispute.payment.auction.endTime).toLocaleDateString("vi-VN")}</p>
              </div>
            </div>

            {/* Bids History with IP */}
            <div className="space-y-3 pt-2">
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Lịch sử đặt giá (kiểm tra địa chỉ IP)</h5>
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-bold uppercase">
                      <th className="px-4 py-2.5">Người đặt</th>
                      <th className="px-4 py-2.5 text-right">Giá thầu</th>
                      <th className="px-4 py-2.5 text-center">Thời gian</th>
                      <th className="px-4 py-2.5 text-center">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {dispute.payment.auction.bids.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400">Không có lịch sử đặt thầu nào.</td>
                      </tr>
                    ) : (
                      dispute.payment.auction.bids.map((bid) => {
                        const isShared = shillIPs.includes(bid.ipAddress || "");
                        return (
                          <tr key={bid.id} className={`hover:bg-slate-50/50 transition-colors ${isShared ? "bg-red-50/20" : ""}`}>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                  {bid.bidder.avatarUrl ? (
                                    <img src={bid.bidder.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[8px] font-bold text-slate-400 font-mono">
                                      {(bid.bidder.fullName || bid.bidder.email).substring(0, 2).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 leading-none">{bid.bidder.fullName || "Khách"}</p>
                                  <p className="text-[9px] text-slate-400 leading-none mt-0.5">{bid.bidder.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono font-bold text-orange-600">
                              {Number(bid.amount).toLocaleString()}₫
                            </td>
                            <td className="px-4 py-2.5 text-center text-slate-500">
                              {new Date(bid.createdAt).toLocaleString("vi-VN")}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`font-mono px-2 py-0.5 rounded-md ${
                                isShared ? "bg-red-50 text-red-600 border border-red-100 font-bold" : "text-slate-400"
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
        </div>

        {/* Right Side: details, Profiles & Action controls */}
        <div className="space-y-6">
          
          {/* Action Console Control panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <ShieldAlert className="w-4 h-4 text-[#8f5c38]" /> Bảng điều khiển phân xử
            </h4>

            {dispute.status === "pending" && (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-xs text-amber-800 leading-relaxed font-semibold">
                  Tranh chấp chưa được phân xử. Vui lòng xem xét kỹ lưỡng bằng chứng bên trái trước khi đưa ra quyết định phân xử.
                </div>
                <button
                  onClick={() => setShowResolveModal(true)}
                  disabled={submitting}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  Đưa ra phán quyết
                </button>
              </div>
            )}

            {dispute.status === "resolved" && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-800">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold uppercase tracking-wider">Đã giải quyết xong</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">Tranh chấp này đã đóng</p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Thông tin giao dịch
            </h4>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Tổng giao dịch:</span>
                <span className="font-bold text-orange-600 font-mono text-sm">{Number(dispute.payment.amount).toLocaleString()}₫</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Phí sàn bảo chứng:</span>
                <span className="font-semibold text-slate-800 font-mono">{Number(dispute.payment.platformFee).toLocaleString()}₫</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Thực nhận người bán:</span>
                <span className="font-semibold text-slate-800 font-mono">{Number(dispute.payment.sellerAmount).toLocaleString()}₫</span>
              </div>
              <div className="flex justify-between border-t border-slate-50 pt-2">
                <span className="text-slate-400 font-semibold">Cổng thanh toán:</span>
                <span className="font-bold text-slate-800 uppercase">{dispute.payment.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Trạng thái thanh toán:</span>
                <span className="font-bold text-slate-800">{getPaymentStatusLabel(dispute.payment.status)}</span>
              </div>
            </div>
          </div>

          {/* Buyer Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <User className="w-4 h-4 text-[#8f5c38]" /> Bên khiếu nại (Người mua)
            </h4>
            
            <div className="flex items-center gap-3">
              {dispute.openedBy.avatarUrl ? (
                <img src={dispute.openedBy.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-slate-100 flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs flex-shrink-0">
                  {(dispute.openedBy.fullName || dispute.openedBy.email).substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="space-y-0.5 text-xs">
                <Link href={`/admin/users/${dispute.openedBy.id}`} className="font-bold text-slate-900 hover:text-[#8f5c38] transition-colors leading-none block">
                  {dispute.openedBy.fullName || "Buyer Name"}
                </Link>
                <p className="text-[10px] text-slate-400 mt-1 leading-none">{dispute.openedBy.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-50 pt-3">
              <div>
                <p className="text-slate-400 font-bold uppercase">Strikes vi phạm</p>
                <p className={`font-bold mt-0.5 ${dispute.openedBy.nonPaymentStrikes > 0 ? "text-red-500" : "text-slate-500"}`}>
                  {dispute.openedBy.nonPaymentStrikes}/3
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Rating uy tín</p>
                <p className="font-bold text-amber-500 mt-0.5">★ {Number(dispute.openedBy.rating).toFixed(1)}</p>
              </div>
            </div>
          </div>

          {/* Seller Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <User className="w-4 h-4 text-sky-600" /> Người bán liên quan
            </h4>

            <div className="flex items-center gap-3">
              {dispute.payment.seller.avatarUrl ? (
                <img src={dispute.payment.seller.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-slate-100 flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs flex-shrink-0">
                  {(dispute.payment.seller.fullName || dispute.payment.seller.email).substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="space-y-0.5 text-xs">
                <Link href={`/admin/users/${dispute.payment.seller.id}`} className="font-bold text-slate-900 hover:text-[#8f5c38] transition-colors leading-none block">
                  {dispute.payment.seller.fullName || "Seller Name"}
                </Link>
                <p className="text-[10px] text-slate-400 mt-1 leading-none">{dispute.payment.seller.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-50 pt-3">
              <div>
                <p className="text-slate-400 font-bold uppercase">Strikes vi phạm</p>
                <p className={`font-bold mt-0.5 ${(dispute.payment.seller.nonPaymentStrikes ?? 0) > 0 ? "text-red-500" : "text-slate-500"}`}>
                  {dispute.payment.seller.nonPaymentStrikes ?? 0}/3
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Rating uy tín</p>
                <p className="font-bold text-amber-500 mt-0.5">★ {Number(dispute.payment.seller.rating ?? 0).toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resolve Dispute Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowResolveModal(false)} />
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden z-10 p-6 space-y-4">
            <div className="flex gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl flex-shrink-0 flex items-center justify-center w-12 h-12">
                <Scale className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-950 font-sans tracking-tight">Phân xử khiếu nại tranh chấp</h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  Đưa ra quyết định cuối cùng cho giao dịch sản phẩm <strong>{dispute.payment.auction.item.title}</strong>.
                </p>
              </div>
            </div>

            {/* Selection Options (Checkboxes) */}
            <div className="space-y-3">
              <label
                className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${
                  refundBuyer ? "border-emerald-500 bg-emerald-500/5" : "border-slate-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={refundBuyer}
                  onChange={(e) => setRefundBuyer(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4"
                />
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-snug">Hoàn tiền cho người mua</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                    Trừ số dư tài khoản của người bán và cộng lại tiền cho người mua (<strong className="text-orange-600 font-mono">{Number(dispute.payment.amount).toLocaleString()}₫</strong>).
                  </p>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${
                  strikeSeller ? "border-emerald-500 bg-emerald-500/5" : "border-slate-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={strikeSeller}
                  onChange={(e) => setStrikeSeller(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4"
                />
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-snug">Đánh gậy người tạo đấu giá</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                    Tăng số gậy vi phạm của người bán thêm 1. Tài khoản bị tạm khóa nếu đủ 3 gậy.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${
                  strikeBuyer ? "border-emerald-500 bg-emerald-500/5" : "border-slate-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={strikeBuyer}
                  onChange={(e) => setStrikeBuyer(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4"
                />
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-snug">Đánh gậy người khiếu nại</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                    Tăng số gậy vi phạm của người mua thêm 1. Tài khoản bị tạm khóa nếu đủ 3 gậy.
                  </p>
                </div>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lý do phân xử chi tiết:</label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Nhập lý do chi tiết để gửi thông báo cho cả hai bên..."
                rows={3}
                className="w-full border border-slate-200 focus:border-[#8f5c38] outline-none rounded-xl p-3 text-sm transition-colors"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResolveModal(false)}
                disabled={submitting}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleResolve}
                disabled={submitting || !resolutionNote.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Scale,
  Clock,
  CheckCircle2,
  MessageSquare,
  Package,
  User,
  Send,
  Info,
  AlertTriangle,
  FileText,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import { paymentApi } from "@/lib/api";
import { authStorage } from "@/lib/auth-storage";

interface DisputeDetail {
  id: string;
  paymentId: string;
  openedById: string;
  reason: string;
  sellerResponse: string | null;
  status: "opened" | "under_review" | "resolved_buyer" | "resolved_seller";
  resolutionNote: string | null;
  createdAt: string;
  payment: {
    amount: string | number;
    paymentMethod: string;
    status: string;
    buyer: { id: string; fullName: string | null; email: string; rating: string | number };
    seller: { id: string; fullName: string | null; email: string; rating: string | number };
    auction: {
      id: string;
      item: {
        title: string;
        media: { id: string; cdnUrl: string; type: string }[];
      };
    };
  };
}

export default function UserDisputePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const disputeId = resolvedParams.id;

  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(authStorage.getUser());
  }, []);

  const fetchDisputeDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await paymentApi.getDispute(disputeId);
      if (res && res.success) {
        setDispute(res.data);
      } else {
        setError("Không thể tải chi tiết khiếu nại.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi khi tải thông tin khiếu nại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputeDetail();
  }, [disputeId]);

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim()) return;
    if (responseText.trim().length < 10) {
      alert("Nội dung phản hồi phải dài ít nhất 10 ký tự.");
      return;
    }

    try {
      setSubmitting(true);
      await paymentApi.respondDispute(disputeId, responseText);
      setSuccess(true);
      setResponseText("");
      await fetchDisputeDetail();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi gửi phản hồi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-[#E25C24] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-semibold">Đang tải chi tiết khiếu nại...</p>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Đã xảy ra lỗi</h2>
        <p className="text-slate-500 text-sm text-center max-w-md mb-6">
          {error || "Không tìm thấy thông tin khiếu nại này hoặc bạn không có quyền truy cập."}
        </p>
        <button
          onClick={() => router.push("/notifications")}
          className="px-6 py-2.5 rounded-lg bg-[#E25C24] text-white text-sm font-bold shadow-[2px_2px_0px_#E2B9A1] hover:-translate-y-0.5 transition-all"
        >
          Quay lại thông báo
        </button>
      </div>
    );
  }

  const isSeller = currentUser && currentUser.id === dispute.payment.seller.id;
  const isBuyer = currentUser && currentUser.id === dispute.payment.buyer.id;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "opened":
        return { label: "Đang khiếu nại", color: "bg-amber-50 border-amber-200 text-amber-600" };
      case "under_review":
        return { label: "Đang xem xét", color: "bg-amber-100 border-amber-300 text-amber-700" };
      case "resolved_buyer":
        return { label: "Khiếu nại thành công (Người mua thắng)", color: "bg-emerald-50 border-emerald-200 text-emerald-600" };
      case "resolved_seller":
        return { label: "Khiếu nại thất bại (Người bán thắng)", color: "bg-slate-100 border-slate-300 text-slate-600" };
      default:
        return { label: status, color: "bg-slate-50 border-slate-200 text-slate-500" };
    }
  };

  const statusInfo = getStatusLabel(dispute.status);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        


        {/* Dispute Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Main info (2 columns on tablet/desktop) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Buyer Dispute Reason Card */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b-2 border-slate-100 pb-3">
                <Scale className="w-5 h-5 text-red-500" /> Lý do khiếu nại từ người mua
              </h3>
              <div className="bg-red-50/30 p-4 rounded-xl border-2 border-red-100/50">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                  {dispute.reason}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold px-1 justify-between">
                <span>Khởi tạo bởi: {dispute.payment.buyer.fullName || "Người mua"}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(dispute.createdAt).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>

            {/* Seller Appeal Response Card */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b-2 border-slate-100 pb-3">
                <MessageSquare className="w-5 h-5 text-blue-500" /> Phản hồi từ người bán
              </h3>

              {dispute.sellerResponse ? (
                <div className="bg-blue-50/30 p-4 rounded-xl border-2 border-blue-100/50 space-y-2">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                    {dispute.sellerResponse}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {isSeller && (dispute.status === "opened" || dispute.status === "under_review") ? (
                    <form onSubmit={handleSubmitResponse} className="space-y-4">
                      <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                        Bạn chưa gửi phản hồi kháng cáo. Hãy cung cấp lập luận và bằng chứng phản bác (như hình ảnh giao hàng, biên lai bưu điện) để Admin xem xét phán quyết.
                      </p>
                      <div>
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Nhập nội dung phản hồi của bạn tại đây (tối thiểu 10 ký tự)..."
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#E25C24] focus:ring-0 outline-none transition-colors text-sm min-h-[120px] resize-none"
                          required
                          disabled={submitting}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting || !responseText.trim()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-[#E25C24] bg-[#E25C24] text-white text-sm font-bold shadow-[2px_2px_0px_#E2B9A1] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#E2B9A1] active:translate-y-0 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 transition-all cursor-pointer"
                      >
                        {submitting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Gửi phản hồi kháng cáo
                      </button>
                    </form>
                  ) : (
                    <div className="bg-slate-50 p-6 rounded-xl border-2 border-slate-100 text-center py-8">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
                      <p className="text-sm font-bold text-slate-400">Đang chờ phản hồi kháng cáo từ người bán</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Admin Resolution Card */}
            {(dispute.status === "resolved_buyer" || dispute.status === "resolved_seller") && (
              <div className="bg-emerald-50/20 rounded-2xl border-2 border-emerald-200 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2 border-b-2 border-emerald-100 pb-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> Kết quả phân xử từ ban quản trị
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-emerald-100">
                    <span className="font-bold text-slate-500">Bên thắng cuộc:</span>
                    <span className="font-extrabold uppercase text-emerald-700">
                      {dispute.status === "resolved_buyer" ? "Người mua (Hoàn tiền)" : "Người bán (Chuyển tiền)"}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-emerald-100">
                    <p className="font-bold text-slate-500 mb-1">Giải trình phán quyết:</p>
                    <p className="text-slate-700 leading-relaxed italic font-medium">
                      {dispute.resolutionNote || "Hệ thống đã tự động đóng khiếu nại dựa trên phân tích bằng chứng."}
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Sidebar product card & transaction details */}
          <div className="space-y-6">

            {/* Product Card */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b-2 border-slate-100 pb-3">
                <Package className="w-4 h-4 text-[#E25C24]" /> Sản phẩm đấu giá
              </h3>
              
              <div className="flex gap-4">
                <div className="relative flex-shrink-0 w-16 h-16 rounded-xl border-2 border-slate-100 overflow-hidden bg-slate-50">
                  {dispute.payment.auction.item.media?.[0]?.cdnUrl ? (
                    <Image
                      src={dispute.payment.auction.item.media[0].cdnUrl}
                      alt={dispute.payment.auction.item.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <h4 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 hover:text-[#E25C24] transition-colors">
                    {dispute.payment.auction.item.title}
                  </h4>
                </div>
              </div>

              <div className="space-y-2.5 text-xs border-t-2 border-slate-50 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Số tiền giao dịch:</span>
                  <span className="font-extrabold text-orange-600 font-mono text-sm">
                    {Number(dispute.payment.amount).toLocaleString()}₫
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Thanh toán:</span>
                  <span className="font-bold text-slate-700 uppercase">
                    {dispute.payment.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">Trạng thái thanh toán:</span>
                  <span className="font-bold text-slate-700">
                    {dispute.payment.status === "paid"
                      ? "Đang giữ bảo chứng"
                      : dispute.payment.status === "escrow_released"
                      ? "Đã chuyển tiền"
                      : dispute.payment.status === "refunded"
                      ? "Đã hoàn tiền"
                      : dispute.payment.status}
                  </span>
                </div>
              </div>
            </div>



            {/* Info Notice Card */}
            <div className="bg-amber-50/35 border-2 border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wide">Quy trình xử lý</h4>
                <p className="text-[11px] font-medium leading-relaxed text-amber-700">
                  Admin sẽ dựa trên lý do khiếu nại, phản hồi của người bán, và lịch sử giao dịch để đưa ra quyết định tối ưu. Giao dịch sẽ được bảo giữ cho đến khi vụ việc được giải quyết xong.
                </p>
              </div>
            </div>

          </div>
          
        </div>

        {/* Success Toast Notification */}
        {success && (
          <div className="fixed top-6 right-6 z-[200] animate-slide-in-right">
            <div className="flex items-center gap-3 bg-white border-2 border-green-300 px-5 py-3.5 rounded-xl shadow-[4px_4px_0px_#86efac] min-w-[280px]">
              <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">Thành công!</p>
                <p className="text-xs text-slate-500 mt-0.5">Gửi phản hồi kháng cáo thành công</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

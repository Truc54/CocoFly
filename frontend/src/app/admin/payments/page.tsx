"use client";

import { useEffect, useState, startTransition } from "react";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  MoreVertical,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";

interface Payment {
  id: string;
  auctionId: string;
  buyerId: string;
  sellerId: string;
  amount: string | number;
  platformFee: string | number;
  sellerAmount: string | number;
  paymentMethod: "vnpay" | "momo" | "banking";
  status: "pending" | "processing" | "paid" | "refunded" | "failed" | "escrow_released";
  shippingStatus: "pending" | "shipped" | "delivered" | "returned";
  transactionId: string | null;
  createdAt: string;
  buyer: { fullName: string | null; email: string };
  seller: { fullName: string | null; email: string };
  auction: {
    item: { title: string };
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Dropdown states
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isMethodFilterOpen, setIsMethodFilterOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Action states
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await adminApi.payments.list({
        page,
        limit: 10,
        status: status || undefined,
        method: method || undefined,
        search: search || undefined,
      });
      if (res && res.success) {
        setPayments(res.data.payments);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
        setTotalRevenue(res.data.totalRevenue);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, search, status, method]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInputValue);
  };

  const handleRefund = async () => {
    if (!selectedPayment) return;
    try {
      setSubmitting(true);
      await adminApi.payments.refund(selectedPayment.id, refundReason);
      await fetchPayments();
      closeRefundDialog();
    } catch (error: any) {
      alert(error?.message || "Đã xảy ra lỗi khi thực hiện hoàn tiền");
    } finally {
      setSubmitting(false);
    }
  };

  const openRefundDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setRefundReason("");
  };

  const closeRefundDialog = () => {
    setSelectedPayment(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "escrow_released":
        return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 inline-flex items-center gap-1">Đã hoàn thành</span>;
      case "paid":
        return <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-600 rounded-full border border-blue-100 inline-flex items-center gap-1">Đã thanh toán</span>;
      case "refunded":
        return <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-600 rounded-full border border-amber-100 inline-flex items-center gap-1">Đã hoàn tiền</span>;
      case "pending":
        return <span className="px-2.5 py-1 text-xs font-bold bg-slate-50 text-slate-500 rounded-full border border-slate-200 inline-flex items-center gap-1">Chờ thanh toán</span>;
      case "failed":
        return <span className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-600 rounded-full border border-red-100 inline-flex items-center gap-1">Thất bại</span>;
      case "processing":
      default:
        return <span className="px-2.5 py-1 text-xs font-bold bg-purple-50 text-purple-600 rounded-full border border-purple-100 inline-flex items-center gap-1">Đang xử lý</span>;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "vnpay":
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-50 text-sky-600 rounded-md border border-sky-100 uppercase">VNPay</span>;
      case "momo":
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-pink-50 text-pink-600 rounded-md border border-pink-100 uppercase">MoMo</span>;
      case "banking":
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-50 text-slate-600 rounded-md border border-slate-200 uppercase">Chuyển khoản</span>;
    }
  };

  const getStatusFilterLabel = (val: string) => {
    if (val === "pending") return "Chờ thanh toán";
    if (val === "paid") return "Đã thanh toán";
    if (val === "processing") return "Đang xử lý";
    if (val === "escrow_released") return "Đã hoàn thành";
    if (val === "refunded") return "Đã hoàn tiền";
    if (val === "failed") return "Thất bại";
    return "Tất cả";
  };

  const getMethodFilterLabel = (val: string) => {
    if (val === "vnpay") return "VNPay";
    if (val === "momo") return "MoMo";
    if (val === "banking") return "Chuyển khoản";
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
            placeholder="Tìm theo sản phẩm, tên người mua/bán..."
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
          />
          <button type="submit" className="hidden" />
        </form>

        <div className="flex flex-wrap items-center gap-6">
          {/* Custom Status Dropdown */}
          <div className="flex items-center gap-2 relative">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái:</span>
            <button
              type="button"
              onClick={() => {
                setIsStatusFilterOpen(!isStatusFilterOpen);
                setIsMethodFilterOpen(false);
              }}
              className="bg-slate-50 border border-slate-100 hover:border-slate-200 text-sm text-slate-700 rounded-xl px-4 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer min-w-[150px] font-semibold"
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
                    { val: "pending", label: "Chờ thanh toán" },
                    { val: "paid", label: "Đã thanh toán" },
                    { val: "processing", label: "Đang xử lý" },
                    { val: "escrow_released", label: "Đã hoàn thành" },
                    { val: "refunded", label: "Đã hoàn tiền" },
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

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[320px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">Người mua</th>
                <th className="px-6 py-4">Người bán</th>
                <th className="px-6 py-4 text-right">Tổng tiền</th>
                <th className="px-6 py-4 text-right">Phí sàn</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5">
                      <div className="h-4 w-44 bg-slate-100 rounded-md" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-28 bg-slate-100 rounded-md" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-28 bg-slate-100 rounded-md" />
                    </td>
                    <td className="px-6 py-5"><div className="h-4 w-20 bg-slate-100 rounded-md ml-auto" /></td>
                    <td className="px-6 py-5"><div className="h-4 w-16 bg-slate-100 rounded-md ml-auto" /></td>
                    <td className="px-6 py-5"><div className="h-6 w-20 bg-slate-100 rounded-full mx-auto" /></td>
                    <td className="px-6 py-5"><div className="h-8 w-8 bg-slate-100 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400 font-medium">
                    Không tìm thấy lịch sử giao dịch nào.
                  </td>
                </tr>
              ) : (
                payments.map((payment, index) => {
                  const isLowerRow = index >= 4 || index >= payments.length - 2;
                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-[200px]">
                          <p className="font-bold text-slate-900 truncate leading-snug">{payment.auction.item.title}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/users/${payment.buyerId}`} className="font-semibold text-slate-900 hover:text-[#8f5c38] transition-colors whitespace-nowrap">
                          {payment.buyer.fullName || "Buyer"}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/users/${payment.sellerId}`} className="font-semibold text-slate-900 hover:text-[#8f5c38] transition-colors whitespace-nowrap">
                          {payment.seller.fullName || "Seller"}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-orange-600 whitespace-nowrap">
                        {Number(payment.amount).toLocaleString()}₫
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-slate-500 whitespace-nowrap">
                        {Number(payment.platformFee).toLocaleString()}₫
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">{getStatusBadge(payment.status)}</td>
                      <td className="px-6 py-4 text-center whitespace-nowrap relative">
                        <div className="inline-block relative">
                          <button
                            onClick={() => startTransition(() => {
                              setActiveMenuId(activeMenuId === payment.id ? null : payment.id);
                            })}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4.5 h-4.5" />
                          </button>
                          
                          {activeMenuId === payment.id && (
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
                                  href={`/admin/auctions/${payment.auctionId}`}
                                  className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" /> Xem phiên đấu giá
                                </Link>
                                
                                {payment.status === "paid" && (
                                  <button
                                    onClick={() => {
                                      openRefundDialog(payment);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-2 cursor-pointer transition-colors border-t border-slate-50"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" /> Hoàn tiền
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
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Hiển thị {payments.length} trên {total} giao dịch
            </p>
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

      {/* Refund dialog */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={closeRefundDialog} />
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden z-10 p-6 space-y-4">
            <div className="flex gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl flex-shrink-0 flex items-center justify-center w-12 h-12">
                <RefreshCw className="w-6 h-6 animate-spin-reverse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-950 font-sans tracking-tight">Yêu cầu hoàn trả tiền gốc</h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  Bạn đang chuẩn bị hoàn tiền gốc trị giá <strong className="text-orange-600 font-mono">{Number(selectedPayment.amount).toLocaleString()}₫</strong> cho giao dịch liên quan đến sản phẩm <strong>{selectedPayment.auction.item.title}</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lý do hoàn tiền:</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Nhập lý do chi tiết..."
                rows={3}
                className="w-full border border-slate-200 focus:border-amber-500 outline-none rounded-xl p-3 text-sm transition-colors"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={closeRefundDialog}
                disabled={submitting}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleRefund}
                disabled={submitting || !refundReason.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Xác nhận hoàn tiền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

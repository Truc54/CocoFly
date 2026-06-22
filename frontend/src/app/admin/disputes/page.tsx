"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  MoreVertical,
  ExternalLink,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";

interface Dispute {
  id: string;
  paymentId: string;
  openedById: string;
  reason: string;
  status: "pending" | "resolved";
  createdAt: string;
  openedBy: { fullName: string | null; email: string; avatarUrl?: string | null };
  payment: {
    amount: string | number;
    auction: {
      item: { title: string };
    };
  };
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Dropdown states
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await adminApi.disputes.list({
        page,
        limit: 10,
        status: status || undefined,
        search: search || undefined,
      });
      if (res && res.success) {
        setDisputes(res.data.disputes);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch disputes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [page, status, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInputValue);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 inline-flex items-center gap-1">Đã xử lý</span>;
      case "pending":
      default:
        return <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-600 rounded-full border border-amber-100 inline-flex items-center gap-1">Chờ xử lý</span>;
    }
  };

  const getStatusFilterLabel = (val: string) => {
    if (val === "pending") return "Chờ xử lý";
    if (val === "resolved") return "Đã xử lý";
    return "Tất cả";
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between z-10 relative">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 w-full lg:w-96 transition-all focus-within:bg-white focus-within:border-slate-200">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Tìm theo đấu giá hoặc người khiếu nại..."
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400 font-medium"
          />
          <button type="submit" className="hidden" />
        </form>

        <div className="flex items-center gap-6">
          {/* Custom Status Dropdown */}
          <div className="flex items-center gap-2 relative">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái:</span>
            <button
              type="button"
              onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
              className="bg-slate-50 border border-slate-100 hover:border-slate-200 text-sm text-slate-700 rounded-xl px-4 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer min-w-[160px] font-semibold"
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
                    { val: "pending", label: "Chờ xử lý" },
                    { val: "resolved", label: "Đã xử lý" },
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

      {/* Disputes Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[320px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">Lý do tranh chấp</th>
                <th className="px-6 py-4">Người mở khiếu nại</th>
                <th className="px-6 py-4 text-right">Giá trị GD</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-center">Ngày tạo</th>
                <th className="px-6 py-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5">
                      <div className="h-4 w-40 bg-slate-100 rounded-md" />
                    </td>
                    <td className="px-6 py-5"><div className="h-4 w-48 bg-slate-100 rounded-md" /></td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-28 bg-slate-100 rounded-md" />
                    </td>
                    <td className="px-6 py-5"><div className="h-4 w-20 bg-slate-100 rounded-md ml-auto" /></td>
                    <td className="px-6 py-5"><div className="h-6 w-20 bg-slate-100 rounded-full mx-auto" /></td>
                    <td className="px-6 py-5"><div className="h-4 w-20 bg-slate-100 rounded-md mx-auto" /></td>
                    <td className="px-6 py-5"><div className="h-8 w-8 bg-slate-100 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : disputes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400 font-medium">
                    Không tìm thấy khiếu nại tranh chấp nào.
                  </td>
                </tr>
              ) : (
                disputes.map((dispute, index) => {
                  const isLowerRow = index >= disputes.length - 2 && disputes.length > 2;
                  return (
                    <tr key={dispute.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-[200px]">
                          <p className="font-bold text-slate-900 truncate leading-snug">{dispute.payment.auction.item.title}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-600 line-clamp-1 max-w-[240px]" title={dispute.reason}>
                          {dispute.reason}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                            {dispute.openedBy.avatarUrl ? (
                              <img src={dispute.openedBy.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 font-mono">
                                {(dispute.openedBy.fullName || dispute.openedBy.email).substring(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <Link href={`/admin/users/${dispute.openedById}`} className="font-semibold text-slate-900 hover:text-[#8f5c38] transition-colors leading-none truncate block">
                              {dispute.openedBy.fullName || "User"}
                            </Link>
                            <p className="text-[10px] text-slate-400 leading-none truncate">{dispute.openedBy.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-orange-600">
                        {Number(dispute.payment.amount).toLocaleString()}₫
                      </td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(dispute.status)}</td>
                      <td className="px-6 py-4 text-center text-xs text-slate-500 font-medium">
                        {new Date(dispute.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 text-center relative">
                        <div className="inline-block relative">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === dispute.id ? null : dispute.id)}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4.5 h-4.5" />
                          </button>
                          
                          {activeMenuId === dispute.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div
                                className={`absolute right-0 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 w-44 z-20 text-left overflow-hidden ${
                                  isLowerRow ? "bottom-full mb-1.5" : "top-full mt-1.5"
                                }`}
                              >
                                <Link
                                  href={`/admin/disputes/${dispute.id}`}
                                  className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" /> Xem chi tiết
                                </Link>
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
              Hiển thị {disputes.length} trên {total} khiếu nại
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
    </div>
  );
}

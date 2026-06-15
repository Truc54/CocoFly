"use client";

// aria-label placeholder <label
import { useEffect, useState, useCallback } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";

interface AuditActor {
  id: string;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
}

interface AuditLog {
  id: string;
  actionType: string;
  actorId: string;
  targetId: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: AuditActor;
}

interface AdminUser {
  id: string;
  fullName: string | null;
  email: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [actionType, setActionType] = useState("");
  const [actorId, setActorId] = useState("");
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  // Filter dropdown states
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);

  // Copy state helper
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const actionTypes = [
    { value: "", label: "Tất cả hành động" },
    { value: "BAN_USER", label: "Khóa tài khoản" },
    { value: "UNBAN_USER", label: "Mở khóa tài khoản" },
    { value: "CHANGE_ROLE", label: "Thay đổi vai trò" },
    { value: "RESET_STRIKES", label: "Reset gậy vi phạm" },
    { value: "FORCE_END_AUCTION", label: "Buộc kết thúc đấu giá" },
    { value: "CANCEL_AUCTION", label: "Hủy phiên đấu giá" },
    { value: "REFUND_PAYMENT", label: "Hoàn tiền giao dịch" },
    { value: "RESOLVE_DISPUTE", label: "Phân xử tranh chấp" },
    { value: "CREATE_CATEGORY", label: "Tạo danh mục" },
    { value: "UPDATE_CATEGORY", label: "Cập nhật danh mục" },
    { value: "DELETE_CATEGORY", label: "Xóa danh mục" },
    { value: "UPDATE_CONFIG", label: "Cập nhật cấu hình" },
  ];

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await adminApi.users.list({ role: "admin", limit: 100 });
      if (res && res.success) {
        setAdmins(res.data.users || []);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách admin:", error);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.auditLogs.list({
        page,
        limit: 15,
        actionType: actionType || undefined,
        actorId: actorId || undefined,
      });

      if (res && res.success) {
        setLogs(res.data.logs);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (error) {
      console.error("Lỗi khi tải nhật ký hoạt động:", error);
    } finally {
      setLoading(false);
    }
  }, [page, actionType, actorId]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getActionBadge = (type: string) => {
    let text = type;
    let colorClass = "bg-slate-50 text-slate-600 border-slate-200";

    switch (type) {
      case "BAN_USER":
        text = "Khóa tài khoản";
        colorClass = "bg-red-50 text-red-600 border-red-100";
        break;
      case "UNBAN_USER":
        text = "Mở khóa tài khoản";
        colorClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
        break;
      case "CHANGE_ROLE":
        text = "Thay đổi vai trò";
        colorClass = "bg-amber-50 text-amber-600 border-amber-100";
        break;
      case "RESET_STRIKES":
        text = "Reset vi phạm";
        colorClass = "bg-blue-50 text-blue-600 border-blue-100";
        break;
      case "FORCE_END_AUCTION":
        text = "Kết thúc đấu giá";
        colorClass = "bg-sky-50 text-sky-600 border-sky-100";
        break;
      case "CANCEL_AUCTION":
        text = "Hủy đấu giá";
        colorClass = "bg-rose-50 text-rose-600 border-rose-100";
        break;
      case "REFUND_PAYMENT":
        text = "Hoàn tiền";
        colorClass = "bg-teal-50 text-teal-600 border-teal-100";
        break;
      case "RESOLVE_DISPUTE":
        text = "Phân xử tranh chấp";
        colorClass = "bg-orange-50 text-orange-600 border-orange-100";
        break;
      case "CREATE_CATEGORY":
        text = "Tạo danh mục";
        colorClass = "bg-indigo-50 text-indigo-600 border-indigo-100";
        break;
      case "UPDATE_CATEGORY":
        text = "Sửa danh mục";
        colorClass = "bg-cyan-50 text-cyan-600 border-cyan-100";
        break;
      case "DELETE_CATEGORY":
        text = "Xóa danh mục";
        colorClass = "bg-pink-50 text-pink-600 border-pink-100";
        break;
      case "UPDATE_CONFIG":
        text = "Sửa cấu hình";
        colorClass = "bg-[#8f5c38]/10 text-[#8f5c38] border-[#8f5c38]/20";
        break;
    }

    return (
      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${colorClass} inline-block whitespace-nowrap`}>
        {text}
      </span>
    );
  };

  const getActionLabel = (val: string) => {
    const matched = actionTypes.find((a) => a.value === val);
    return matched ? matched.label : "Tất cả hành động";
  };

  const getAdminLabel = (val: string) => {
    if (!val) return "Tất cả admin";
    const matched = admins.find((a) => a.id === val);
    return matched ? (matched.fullName || matched.email) : "Đang tải...";
  };

  return (
    <div className="space-y-6">


      {/* Filter Headers */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center gap-4 z-20 relative">
        {/* Action Type Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto relative">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Hành động:</span>
          <button
            type="button"
            onClick={() => {
              setIsActionDropdownOpen(!isActionDropdownOpen);
              setIsAdminDropdownOpen(false);
            }}
            className="bg-slate-50 border border-slate-100 hover:border-slate-200 text-sm text-slate-700 rounded-xl px-4 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer w-full sm:min-w-[180px] font-semibold"
          >
            <span className="truncate">{getActionLabel(actionType)}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </button>
          {isActionDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsActionDropdownOpen(false)} />
              <div className="absolute left-0 sm:left-auto right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 w-60 max-h-80 overflow-y-auto z-20 text-left">
                {actionTypes.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setActionType(opt.value);
                      setIsActionDropdownOpen(false);
                      setPage(1);
                    }}
                    className={`w-full px-4 py-2 text-xs font-bold text-left block transition-colors cursor-pointer ${
                      actionType === opt.value
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

        {/* Actor Admin Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto relative">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Điều hành viên:</span>
          <button
            type="button"
            onClick={() => {
              setIsAdminDropdownOpen(!isAdminDropdownOpen);
              setIsActionDropdownOpen(false);
            }}
            className="bg-slate-50 border border-slate-100 hover:border-slate-200 text-sm text-slate-700 rounded-xl px-4 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer w-full sm:min-w-[200px] font-semibold"
          >
            <span className="truncate">{getAdminLabel(actorId)}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </button>
          {isAdminDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsAdminDropdownOpen(false)} />
              <div className="absolute left-0 sm:left-auto right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 w-64 max-h-80 overflow-y-auto z-20 text-left">
                <button
                  onClick={() => {
                    setActorId("");
                    setIsAdminDropdownOpen(false);
                    setPage(1);
                  }}
                  className={`w-full px-4 py-2 text-xs font-bold text-left block transition-colors cursor-pointer ${
                    actorId === "" ? "bg-[#8f5c38]/5 text-[#8f5c38]" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Tất cả admin
                </button>
                {admins.map((adm) => (
                  <button
                    key={adm.id}
                    onClick={() => {
                      setActorId(adm.id);
                      setIsAdminDropdownOpen(false);
                      setPage(1);
                    }}
                    className={`w-full px-4 py-2 text-xs font-bold text-left block transition-colors cursor-pointer ${
                      actorId === adm.id
                        ? "bg-[#8f5c38]/5 text-[#8f5c38]"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-bold">{adm.fullName || "Admin"}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{adm.email}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Audit Logs Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden z-10 relative">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Hành động</th>
                <th className="px-6 py-4">Người thực hiện</th>
                <th className="px-6 py-4">Đối tượng đích</th>
                <th className="px-6 py-4">Lý do / Mô tả</th>
                <th className="px-6 py-4">Ngày thực hiện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5">
                      <div className="h-6 w-28 bg-slate-100 rounded-full" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100" />
                        <div className="space-y-1">
                          <div className="h-3.5 w-24 bg-slate-100 rounded-md" />
                          <div className="h-3 w-32 bg-slate-100 rounded-md" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-6 w-36 bg-slate-100 rounded-md" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-48 bg-slate-100 rounded-md" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-28 bg-slate-100 rounded-md" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">
                    Không có hoạt động nào được ghi nhận phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      {getActionBadge(log.actionType)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200/60 bg-slate-50 flex items-center justify-center text-slate-400 font-mono text-xs flex-shrink-0">
                          {log.actor.avatarUrl ? (
                            <img src={log.actor.avatarUrl} alt={log.actor.fullName || "Admin"} className="w-full h-full object-cover" />
                          ) : (
                            (log.actor.fullName || log.actor.email).substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 leading-none">{log.actor.fullName || "Admin"}</p>
                          <p className="text-[10px] text-slate-400 font-mono leading-none">{log.actor.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {log.targetId ? (
                        <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 w-max group/copy">
                          <span className="truncate max-w-[140px] select-all">{log.targetId}</span>
                          <button
                            onClick={() => copyToClipboard(log.targetId!)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                            title="Sao chép ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {copiedId === log.targetId && (
                            <span className="absolute bg-slate-800 text-white text-[9px] px-1 py-0.5 rounded-sm -top-6 animate-[fadeIn_0.15s_ease-out]">
                              Đã chép
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 italic">Không có</span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs md:max-w-md">
                      <div className="space-y-1 font-sans text-xs">
                        <p className="text-slate-600 font-medium">{log.reason || <span className="italic text-slate-300">Không có lý do được ghi</span>}</p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 max-h-24 overflow-y-auto font-mono text-[10px] text-slate-500">
                            {JSON.stringify(log.metadata, null, 2)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(log.createdAt).toLocaleDateString("vi-VN")} -{" "}
                          {new Date(log.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-sans">
              Hiển thị <strong className="text-slate-700">{logs.length}</strong> trên <strong className="text-slate-700">{total}</strong> bản ghi nhật ký.
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="text-xs font-bold text-slate-700 px-3 py-1 bg-white border border-slate-200 rounded-lg font-mono">
                Trang {page} / {totalPages}
              </span>

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

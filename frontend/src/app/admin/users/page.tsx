"use client";

import { useEffect, useState, startTransition } from "react";
import Link from "next/link";
import {
  Search,
  Shield,
  Ban,
  UserCheck,
  MoreVertical,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCcw,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";

interface User {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: "buyer" | "seller" | "admin";
  accountStatus: "unverified" | "active" | "suspended" | "banned";
  nonPaymentStrikes: number;
  rating: string | number;
  balance: string | number;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  // Custom Dropdown Open States
  const [isRoleFilterOpen, setIsRoleFilterOpen] = useState(false);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);

  // Actions states
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"ban" | "unban" | "role" | "reset-strikes" | null>(null);
  const [banReason, setBanReason] = useState("");
  const [selectedRole, setSelectedRole] = useState<"buyer" | "seller" | "admin">("buyer");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.users.list({
        page,
        limit: 10,
        search,
        role: role || undefined,
        status: status || undefined,
      });
      if (res && res.success) {
        setUsers(res.data.users);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, role, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInputValue);
  };

  const executeAction = async () => {
    if (!selectedUser || !actionType) return;
    try {
      setSubmitting(true);
      if (actionType === "ban") {
        await adminApi.users.ban(selectedUser.id, banReason);
      } else if (actionType === "unban") {
        await adminApi.users.unban(selectedUser.id);
      } else if (actionType === "role") {
        await adminApi.users.changeRole(selectedUser.id, selectedRole);
      } else if (actionType === "reset-strikes") {
        await adminApi.users.resetStrikes(selectedUser.id);
      }

      await fetchUsers();
      closeActionDialog();
    } catch (error: any) {
      alert(error?.message || "Đã xảy ra lỗi khi thực hiện thao tác");
    } finally {
      setSubmitting(false);
    }
  };

  const openActionDialog = (user: User, type: "ban" | "unban" | "role" | "reset-strikes") => {
    setSelectedUser(user);
    setActionType(type);
    setBanReason("");
    setSelectedRole(user.role);
    setActiveMenuId(null);
  };

  const closeActionDialog = () => {
    setSelectedUser(null);
    setActionType(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center gap-1 w-max">Hoạt động</span>;
      case "banned":
        return <span className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-600 rounded-full border border-red-100 flex items-center gap-1 w-max">Đã khóa</span>;
      case "suspended":
        return <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-600 rounded-full border border-amber-100 flex items-center gap-1 w-max">Tạm ngưng</span>;
      case "unverified":
      default:
        return <span className="px-2.5 py-1 text-xs font-bold bg-slate-50 text-slate-500 rounded-full border border-slate-200 flex items-center gap-1 w-max">Chưa xác minh</span>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <span className="px-2.5 py-1 text-xs font-bold bg-[#8f5c38]/10 text-[#8f5c38] rounded-full border border-[#8f5c38]/20">Admin</span>;
      case "seller":
        return <span className="px-2.5 py-1 text-xs font-bold bg-sky-50 text-sky-600 rounded-full border border-sky-100">Người bán</span>;
      case "buyer":
      default:
        return <span className="px-2.5 py-1 text-xs font-bold bg-purple-50 text-purple-600 rounded-full border border-purple-100">Người mua</span>;
    }
  };

  const getRoleFilterLabel = (val: string) => {
    if (val === "buyer") return "Người mua";
    if (val === "seller") return "Người bán";
    if (val === "admin") return "Admin";
    return "Tất cả";
  };

  const getStatusFilterLabel = (val: string) => {
    if (val === "active") return "Hoạt động";
    if (val === "unverified") return "Chưa xác minh";
    if (val === "suspended") return "Tạm ngưng";
    if (val === "banned") return "Đã khóa";
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
            placeholder="Tìm theo tên hoặc email..."
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
          />
          <button type="submit" className="hidden" />
        </form>

        <div className="flex flex-wrap items-center gap-6">
          {/* Custom Rounded Dropdown for Role */}
          <div className="flex items-center gap-2 relative">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vai trò:</span>
            <button
              type="button"
              onClick={() => {
                setIsRoleFilterOpen(!isRoleFilterOpen);
                setIsStatusFilterOpen(false);
              }}
              className="bg-slate-50 border border-slate-100 hover:border-slate-200 text-sm text-slate-700 rounded-xl px-4 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer min-w-[130px] font-semibold"
            >
              <span>{getRoleFilterLabel(role)}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            {isRoleFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsRoleFilterOpen(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 w-40 z-20 text-left overflow-hidden">
                  {[
                    { val: "", label: "Tất cả" },
                    { val: "buyer", label: "Người mua" },
                    { val: "seller", label: "Người bán" },
                    { val: "admin", label: "Admin" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => {
                        setRole(opt.val);
                        setIsRoleFilterOpen(false);
                        setPage(1);
                      }}
                      className={`w-full px-4 py-2 text-xs font-bold text-left block transition-colors cursor-pointer ${
                        role === opt.val
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

          {/* Custom Rounded Dropdown for Status */}
          <div className="flex items-center gap-2 relative">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái:</span>
            <button
              type="button"
              onClick={() => {
                setIsStatusFilterOpen(!isStatusFilterOpen);
                setIsRoleFilterOpen(false);
              }}
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
                    { val: "active", label: "Hoạt động" },
                    { val: "unverified", label: "Chưa xác minh" },
                    { val: "suspended", label: "Tạm ngưng" },
                    { val: "banned", label: "Đã khóa" },
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

      {/* Users Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[320px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Người dùng</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-center">Gậy vi phạm</th>
                <th className="px-6 py-4 text-center">Đánh giá</th>
                <th className="px-6 py-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-slate-100 rounded-md" />
                        <div className="h-3 w-40 bg-slate-100 rounded-md" />
                      </div>
                    </td>
                    <td className="px-6 py-5"><div className="h-6 w-16 bg-slate-100 rounded-full" /></td>
                    <td className="px-6 py-5"><div className="h-6 w-20 bg-slate-100 rounded-full" /></td>
                    <td className="px-6 py-5"><div className="h-4 w-10 bg-slate-100 rounded-md mx-auto" /></td>
                    <td className="px-6 py-5"><div className="h-4 w-12 bg-slate-100 rounded-md mx-auto" /></td>
                    <td className="px-6 py-5"><div className="h-8 w-8 bg-slate-100 rounded-lg mx-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-medium">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((user, index) => {
                  const isLowerRow = index >= 4 || index >= users.length - 2;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 font-mono text-sm flex-shrink-0">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.fullName || "User"} className="w-full h-full object-cover" />
                            ) : (
                              (user.fullName || user.email).substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900 leading-snug">{user.fullName || "Chưa cập nhật"}</p>
                            <p className="text-xs text-slate-400 leading-snug">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4">{getStatusBadge(user.accountStatus)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-mono font-bold ${user.nonPaymentStrikes > 0 ? "text-red-500" : "text-slate-400"}`}>
                          {user.nonPaymentStrikes}/3
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-amber-500">
                        ★ {Number(user.rating).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-center relative">
                        <div className="inline-block relative">
                          <button
                            onClick={() => startTransition(() => {
                              setActiveMenuId(activeMenuId === user.id ? null : user.id);
                            })}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4.5 h-4.5" />
                          </button>
                          
                          {activeMenuId === user.id && (
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
                                  href={`/admin/users/${user.id}`}
                                  className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" /> Xem chi tiết
                                </Link>
                                
                                <button
                                  onClick={() => openActionDialog(user, "role")}
                                  className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors border-t border-slate-50"
                                >
                                  <Shield className="w-3.5 h-3.5" /> Thay đổi vai trò
                                </button>
                                
                                {user.nonPaymentStrikes > 0 && (
                                  <button
                                    onClick={() => openActionDialog(user, "reset-strikes")}
                                    className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <RefreshCcw className="w-3.5 h-3.5" /> Reset gậy vi phạm
                                  </button>
                                )}
                                
                                {user.accountStatus === "banned" ? (
                                  <button
                                    onClick={() => openActionDialog(user, "unban")}
                                    className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" /> Mở khóa tài khoản
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openActionDialog(user, "ban")}
                                    className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <Ban className="w-3.5 h-3.5" /> Khóa tài khoản
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

      {/* Actions Dialogs */}
      {selectedUser && actionType === "ban" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={closeActionDialog} />
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden z-10 p-6 space-y-4">
            <div className="flex gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl flex-shrink-0 flex items-center justify-center w-12 h-12">
                <Ban className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-950 font-sans tracking-tight">Khóa tài khoản người dùng</h3>
                <p className="text-sm text-slate-500 font-sans">
                  Bạn đang chuẩn bị khóa tài khoản của <strong>{selectedUser.fullName || selectedUser.email}</strong>. Người dùng này sẽ không thể đăng nhập vào hệ thống.
                </p>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lý do khóa tài khoản:</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Nhập lý do chi tiết..."
                rows={3}
                className="w-full border border-slate-200 focus:border-red-500 outline-none rounded-xl p-3 text-sm transition-colors"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={closeActionDialog}
                disabled={submitting}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={executeAction}
                disabled={submitting || !banReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Khóa tài khoản
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && actionType === "role" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={closeActionDialog} />
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden z-10 p-6 space-y-4">
            <div className="flex gap-4">
              <div className="p-3 bg-[#8f5c38]/10 text-[#8f5c38] rounded-xl flex-shrink-0 flex items-center justify-center w-12 h-12">
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-950 font-sans tracking-tight">Thay đổi vai trò người dùng</h3>
                <p className="text-sm text-slate-500 font-sans">
                  Chọn vai trò mới cho tài khoản <strong>{selectedUser.fullName || selectedUser.email}</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {(["buyer", "seller", "admin"] as const).map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${
                    selectedRole === r ? "border-[#8f5c38] bg-[#8f5c38]/5" : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="newRole"
                    checked={selectedRole === r}
                    onChange={() => setSelectedRole(r)}
                    className="accent-[#8f5c38]"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900 capitalize">
                      {r === "buyer" ? "Người mua" : r === "seller" ? "Người bán" : "Quản trị viên"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {r === "buyer"
                        ? "Có quyền đặt giá và mua các sản phẩm."
                        : r === "seller"
                        ? "Có quyền đăng sản phẩm và tạo phiên đấu giá."
                        : "Toàn quyền quản trị hệ thống, truy cập panel admin."}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={closeActionDialog}
                disabled={submitting}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={executeAction}
                disabled={submitting}
                className="px-4 py-2 bg-[#8f5c38] hover:bg-[#8f5c38]/90 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-2"
              >
                {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && actionType === "unban" && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={closeActionDialog}
          onConfirm={executeAction}
          isLoading={submitting}
          variant="info"
          title="Kích hoạt lại tài khoản"
          description={`Bạn có chắc chắn muốn mở khóa tài khoản của ${selectedUser.fullName || selectedUser.email}?`}
          confirmText="Mở khóa"
        />
      )}

      {selectedUser && actionType === "reset-strikes" && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={closeActionDialog}
          onConfirm={executeAction}
          isLoading={submitting}
          variant="warning"
          title="Reset gậy vi phạm thanh toán"
          description={`Hành động này sẽ reset số gậy vi phạm thanh toán của người dùng ${selectedUser.fullName || selectedUser.email} về 0. Bạn có chắc chắn muốn thực hiện?`}
          confirmText="Xác nhận Reset"
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, use, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Ban,
  UserCheck,
  RefreshCcw,
  Calendar,
  CreditCard,
  Gavel,
  Star,
  TrendingUp,
  Award,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";

interface RelatedAuction {
  id: string;
  item: { title: string };
  startingPrice: string | number;
  currentPrice: string | number;
  status: string;
  createdAt: string;
}

interface RelatedBid {
  id: string;
  amount: string | number;
  createdAt: string;
  auction: {
    id: string;
    item: { title: string };
  };
}

interface RelatedPayment {
  id: string;
  amount: string | number;
  status: string;
  createdAt: string;
  auction: {
    id: string;
    item: { title: string };
  };
}

interface RelatedReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: {
    fullName: string | null;
  };
}

interface UserDetail {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: "buyer" | "seller" | "admin";
  accountStatus: "unverified" | "active" | "suspended" | "banned";
  nonPaymentStrikes: number;
  rating: string | number;
  balance: string | number;
  createdAt: string;
  sellerAuctions: RelatedAuction[];
  wonAuctions: RelatedAuction[];
  bids: RelatedBid[];
  buyerPayments: RelatedPayment[];
  sellerPayments: RelatedPayment[];
  reviewsReceived: RelatedReview[];
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const userId = resolvedParams.id;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"auctions" | "bids" | "payments" | "reviews">("auctions");

  // Actions states
  const [actionType, setActionType] = useState<"ban" | "unban" | "role" | "reset-strikes" | null>(null);
  const [banReason, setBanReason] = useState("");
  const [selectedRole, setSelectedRole] = useState<"buyer" | "seller" | "admin">("buyer");
  const [submitting, setSubmitting] = useState(false);

  const openActionDialog = (type: "ban" | "unban" | "role" | "reset-strikes") => {
    setActionType(type);
    setBanReason("");
    setSelectedRole(user?.role || "buyer");
  };

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const res = await adminApi.users.getById(userId);
      if (res && res.success) {
        setUser(res.data);
        setSelectedRole(res.data.role);
      } else {
        router.push("/admin/users");
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      router.push("/admin/users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  const executeAction = async () => {
    if (!user || !actionType) return;
    try {
      setSubmitting(true);
      if (actionType === "ban") {
        await adminApi.users.ban(user.id, banReason);
      } else if (actionType === "unban") {
        await adminApi.users.unban(user.id);
      } else if (actionType === "role") {
        await adminApi.users.changeRole(user.id, selectedRole);
      } else if (actionType === "reset-strikes") {
        await adminApi.users.resetStrikes(user.id);
      }

      await fetchUserDetail();
      setActionType(null);
    } catch (error: any) {
      alert(error?.message || "Đã xảy ra lỗi");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">Hoạt động</span>;
      case "banned":
        return <span className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-600 rounded-full border border-red-100">Đã khóa</span>;
      case "suspended":
        return <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-600 rounded-full border border-amber-100">Tạm ngưng</span>;
      case "unverified":
      default:
        return <span className="px-2.5 py-1 text-xs font-bold bg-slate-50 text-slate-500 rounded-full border border-slate-200">Chưa xác minh</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-[#8f5c38]/20 border-t-[#8f5c38] rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Đang tải thông tin chi tiết người dùng...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Back Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/users"
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 rounded-xl transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="text-xs font-bold text-[#8f5c38] tracking-wider uppercase">Quản lý người dùng</p>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Chi tiết tài khoản</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Profile Card & Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 font-mono text-2xl">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName || "User"} className="w-full h-full object-cover" />
              ) : (
                (user.fullName || user.email).substring(0, 2).toUpperCase()
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 font-sans tracking-tight">
                {user.fullName || "Chưa cập nhật tên"}
              </h3>
              <p className="text-sm text-slate-400 leading-snug">{user.email}</p>
              <p className="text-xs text-slate-400 leading-snug">{user.phone || "Chưa cập nhật SĐT"}</p>
            </div>

            <div className="flex gap-2">
              {getStatusBadge(user.accountStatus)}
              <span className="px-2.5 py-1 text-xs font-bold bg-[#8f5c38]/10 text-[#8f5c38] rounded-full border border-[#8f5c38]/20 capitalize">
                {user.role === "admin" ? "Admin" : user.role === "seller" ? "Người bán" : "Người mua"}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-4 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Tham gia:</span>
              <span className="font-semibold text-slate-800">{new Date(user.createdAt).toLocaleDateString("vi-VN")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-500" /> Đánh giá:</span>
              <span className="font-semibold text-amber-500 font-sans">★ {Number(user.rating).toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5"><Ban className="w-4 h-4 text-red-500" /> Gậy vi phạm:</span>
              <span className={`font-mono font-bold ${user.nonPaymentStrikes > 0 ? "text-red-500" : "text-slate-400"}`}>
                {user.nonPaymentStrikes}/3
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-2.5">
            <button
              onClick={() => openActionDialog("role")}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-100"
            >
              <Shield className="w-4 h-4" /> Đổi vai trò tài khoản
            </button>

            {user.nonPaymentStrikes > 0 && (
              <button
                onClick={() => openActionDialog("reset-strikes")}
                className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-100"
              >
                <RefreshCcw className="w-4 h-4" /> Reset gậy vi phạm
              </button>
            )}

            {user.accountStatus === "banned" ? (
              <button
                onClick={() => openActionDialog("unban")}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <UserCheck className="w-4 h-4" /> Mở khóa tài khoản
              </button>
            ) : (
              <button
                onClick={() => openActionDialog("ban")}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-red-100"
              >
                <Ban className="w-4 h-4" /> Khóa tài khoản
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Stats & Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600 flex-shrink-0 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lượt đặt giá</p>
                <p className="text-xl font-mono font-bold text-slate-900">{user.bids.length}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="p-3.5 bg-[#8f5c38]/10 rounded-xl text-[#8f5c38] flex-shrink-0 flex items-center justify-center">
                <Gavel className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đấu giá tạo</p>
                <p className="text-xl font-mono font-bold text-slate-900">{user.sellerAuctions.length}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="p-3.5 bg-blue-50 rounded-xl text-blue-600 flex-shrink-0 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đấu giá thắng</p>
                <p className="text-xl font-mono font-bold text-slate-900">{user.wonAuctions.length}</p>
              </div>
            </div>
          </div>

          {/* Details Tabs Section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-96">
            {/* Tab buttons */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              <button
                onClick={() => startTransition(() => setActiveTab("auctions"))}
                className={`px-5 py-4 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
                  activeTab === "auctions" ? "border-[#8f5c38] text-[#8f5c38]" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Các Phiên Đấu Giá
              </button>
              <button
                onClick={() => startTransition(() => setActiveTab("bids"))}
                className={`px-5 py-4 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
                  activeTab === "bids" ? "border-[#8f5c38] text-[#8f5c38]" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Lịch sử đặt giá
              </button>
              <button
                onClick={() => startTransition(() => setActiveTab("payments"))}
                className={`px-5 py-4 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
                  activeTab === "payments" ? "border-[#8f5c38] text-[#8f5c38]" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Thanh toán
              </button>
              <button
                onClick={() => startTransition(() => setActiveTab("reviews"))}
                className={`px-5 py-4 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
                  activeTab === "reviews" ? "border-[#8f5c38] text-[#8f5c38]" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Đánh giá nhận được
              </button>
            </div>

            {/* Tab content */}
            <div className="p-6 flex-1">
              {activeTab === "auctions" && (
                <div className="space-y-4">
                  {user.sellerAuctions.length === 0 && user.wonAuctions.length === 0 ? (
                    <p className="text-sm text-slate-400 font-medium text-center py-10">Người dùng này chưa có phiên đấu giá nào.</p>
                  ) : (
                    <div className="space-y-6">
                      {user.sellerAuctions.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phiên Đấu Giá Đã Đăng</h4>
                          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                            {user.sellerAuctions.map((auc) => (
                              <div key={auc.id} className="p-4 bg-white flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                <div>
                                  <Link href={`/admin/auctions/${auc.id}`} className="font-bold text-slate-800 hover:text-[#8f5c38] transition-colors">{auc.item.title}</Link>
                                  <p className="text-xs text-slate-400 mt-1">Khởi điểm: {Number(auc.startingPrice).toLocaleString()}₫ · Hiện tại: {Number(auc.currentPrice).toLocaleString()}₫</p>
                                </div>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                                  auc.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"
                                }`}>
                                  {auc.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {user.wonAuctions.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phiên Đấu Giá Đã Thắng</h4>
                          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                            {user.wonAuctions.map((auc) => (
                              <div key={auc.id} className="p-4 bg-white flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                <div>
                                  <Link href={`/admin/auctions/${auc.id}`} className="font-bold text-slate-800 hover:text-[#8f5c38] transition-colors">{auc.item.title}</Link>
                                  <p className="text-xs text-slate-400 mt-1">Giá chung cuộc: {Number(auc.currentPrice).toLocaleString()}₫ · Ngày kết thúc: {new Date(auc.createdAt).toLocaleDateString("vi-VN")}</p>
                                </div>
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 rounded-full uppercase">Đã thắng</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "bids" && (
                <div className="space-y-3">
                  {user.bids.length === 0 ? (
                    <p className="text-sm text-slate-400 font-medium text-center py-10">Người dùng này chưa đặt giá phiên nào.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                      {user.bids.map((bid) => (
                        <div key={bid.id} className="p-4 bg-white flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                          <div>
                            <Link href={`/admin/auctions/${bid.auction.id}`} className="font-bold text-slate-800 hover:text-[#8f5c38] transition-colors">{bid.auction.item.title}</Link>
                            <p className="text-xs text-slate-400 mt-1">Đặt lúc: {new Date(bid.createdAt).toLocaleString("vi-VN")}</p>
                          </div>
                          <span className="font-mono font-bold text-slate-900">{Number(bid.amount).toLocaleString()}₫</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "payments" && (
                <div className="space-y-6">
                  {user.buyerPayments.length === 0 && user.sellerPayments.length === 0 ? (
                    <p className="text-sm text-slate-400 font-medium text-center py-10">Không có lịch sử giao dịch nào.</p>
                  ) : (
                    <div className="space-y-6">
                      {user.buyerPayments.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hóa Đơn Đã Thanh Toán</h4>
                          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                            {user.buyerPayments.map((pay) => (
                              <div key={pay.id} className="p-4 bg-white flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                <div>
                                  <p className="font-bold text-slate-800">{pay.auction.item.title}</p>
                                  <p className="text-xs text-slate-400 mt-1">Ngày GD: {new Date(pay.createdAt).toLocaleDateString("vi-VN")}</p>
                                </div>
                                <div className="text-right space-y-1">
                                  <p className="font-mono font-bold text-red-500">-{Number(pay.amount).toLocaleString()}₫</p>
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                                    pay.status === "paid" || pay.status === "escrow_released" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"
                                  }`}>
                                    {pay.status === "pending" ? "Chờ thanh toán" : pay.status === "paid" ? "Đã thanh toán" : pay.status === "escrow_released" ? "Đã hoàn thành" : pay.status === "refunded" ? "Đã hoàn tiền" : pay.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {user.sellerPayments.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Khoản Thu Nhận Được</h4>
                          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                            {user.sellerPayments.map((pay) => (
                              <div key={pay.id} className="p-4 bg-white flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                <div>
                                  <p className="font-bold text-slate-800">{pay.auction.item.title}</p>
                                  <p className="text-xs text-slate-400 mt-1">Ngày GD: {new Date(pay.createdAt).toLocaleDateString("vi-VN")}</p>
                                </div>
                                <div className="text-right space-y-1">
                                  <p className="font-mono font-bold text-emerald-500">+{Number(pay.amount).toLocaleString()}₫</p>
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                                    pay.status === "escrow_released" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"
                                  }`}>
                                    {pay.status === "pending" ? "Chờ thanh toán" : pay.status === "paid" ? "Đã thanh toán" : pay.status === "escrow_released" ? "Đã hoàn thành" : pay.status === "refunded" ? "Đã hoàn tiền" : pay.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="space-y-3">
                  {user.reviewsReceived.length === 0 ? (
                    <p className="text-sm text-slate-400 font-medium text-center py-10">Người dùng này chưa nhận được đánh giá nào.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                      {user.reviewsReceived.map((rev) => (
                        <div key={rev.id} className="p-4 bg-white space-y-1.5 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-sm">{rev.author.fullName || "Khách"}</span>
                            <span className="text-amber-500 font-bold text-xs flex items-center gap-0.5">
                              ★ {rev.rating}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">{rev.comment || "Không có nội dung nhận xét."}</p>
                          <p className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString("vi-VN")}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions Dialogs */}
      {actionType === "ban" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setActionType(null)} />
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden z-10 p-6 space-y-4">
            <div className="flex gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl flex-shrink-0 flex items-center justify-center w-12 h-12">
                <Ban className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-950 font-sans tracking-tight">Khóa tài khoản người dùng</h3>
                <p className="text-sm text-slate-500 font-sans">
                  Bạn đang chuẩn bị khóa tài khoản của <strong>{user.fullName || user.email}</strong>.
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
                onClick={() => setActionType(null)}
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

      {actionType === "role" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setActionType(null)} />
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden z-10 p-6 space-y-4">
            <div className="flex gap-4">
              <div className="p-3 bg-[#8f5c38]/10 text-[#8f5c38] rounded-xl flex-shrink-0 flex items-center justify-center w-12 h-12">
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-950 font-sans tracking-tight">Thay đổi vai trò người dùng</h3>
                <p className="text-sm text-slate-500 font-sans">
                  Chọn vai trò mới cho tài khoản <strong>{user.fullName || user.email}</strong>.
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
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setActionType(null)}
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

      {actionType === "unban" && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setActionType(null)}
          onConfirm={executeAction}
          isLoading={submitting}
          variant="info"
          title="Kích hoạt lại tài khoản"
          description={`Bạn có chắc chắn muốn mở khóa tài khoản của ${user.fullName || user.email}?`}
          confirmText="Mở khóa"
        />
      )}

      {actionType === "reset-strikes" && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setActionType(null)}
          onConfirm={executeAction}
          isLoading={submitting}
          variant="warning"
          title="Reset gậy vi phạm thanh toán"
          description={`Hành động này sẽ reset số gậy vi phạm thanh toán của người dùng ${user.fullName || user.email} về 0. Bạn có chắc chắn muốn thực hiện?`}
          confirmText="Xác nhận Reset"
        />
      )}
    </div>
  );
}

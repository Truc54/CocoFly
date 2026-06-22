"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { userApi, mediaApi } from "@/lib/api";
import { authStorage } from "@/lib/auth-storage";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import {
  User,
  Lock,
  Mail,
  Phone,
  Camera,
  Save,
  Loader2,
  ShieldCheck,
  Bell,
  BellOff,
  MapPin,
  FileText,
  Settings,
  ChevronRight,
  Gavel,
  CreditCard,
  Truck,
  AlertTriangle,
  Star,
  MessageSquare,
  Megaphone,
  Gift,
  X,
} from "lucide-react";

// ─── Mock User Data ──────────────────────────────────────────────────────────
const MOCK_USER = {
  fullName: "Trực Trần",
  email: "truc@gmail.com",
  phone: "0909123456",
  avatarUrl: "/default-avatar.svg",
  phoneVerified: true,
  bio: "",
  address: "",
};

// ─── Notification Settings ───────────────────────────────────────────────────
interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  category: "auction" | "payment" | "social" | "system";
}

const INITIAL_NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    id: "outbid",
    label: "Bị vượt giá",
    description: "Nhận thông báo khi có người đặt giá cao hơn bạn",
    icon: <img src="https://img.icons8.com/color/96/gavel.png" className="w-5 h-5" alt="gavel" />,
    enabled: true,
    category: "auction",
  },
  {
    id: "auction_starting",
    label: "Phiên đấu giá sắp bắt đầu",
    description: "Thông báo trước khi phiên đấu giá trong danh sách theo dõi bắt đầu",
    icon: <img src="https://img.icons8.com/color/96/alarm-clock.png" className="w-5 h-5" alt="alarm" />,
    enabled: true,
    category: "auction",
  },
  {
    id: "auction_ending",
    label: "Phiên đấu giá sắp kết thúc",
    description: "Nhắc nhở khi phiên đấu giá bạn đang tham gia sắp kết thúc",
    icon: <img src="https://img.icons8.com/color/96/hourglass.png" className="w-5 h-5" alt="hourglass" />,
    enabled: true,
    category: "auction",
  },
  {
    id: "auction_won",
    label: "Chiến thắng đấu giá",
    description: "Thông báo khi bạn thắng một phiên đấu giá",
    icon: <img src="https://img.icons8.com/color/96/gift.png" className="w-5 h-5" alt="gift" />,
    enabled: true,
    category: "auction",
  },
  {
    id: "new_bid",
    label: "Có lượt đấu giá mới",
    description: "Thông báo khi có người đặt giá trên sản phẩm của bạn",
    icon: <img src="https://img.icons8.com/color/96/gavel.png" className="w-5 h-5" alt="gavel" />,
    enabled: true,
    category: "auction",
  },
  {
    id: "payment_due",
    label: "Nhắc thanh toán",
    description: "Nhắc nhở khi có khoản thanh toán cần thực hiện",
    icon: <img src="https://img.icons8.com/color/96/bill.png" className="w-5 h-5" alt="bill" />,
    enabled: true,
    category: "payment",
  },
  {
    id: "payment_confirmed",
    label: "Thanh toán thành công",
    description: "Xác nhận khi thanh toán được xử lý thành công",
    icon: <img src="https://img.icons8.com/color/96/checkmark.png" className="w-5 h-5" alt="success" />,
    enabled: true,
    category: "payment",
  },
  {
    id: "shipping_update",
    label: "Cập nhật giao hàng",
    description: "Theo dõi trạng thái giao hàng đơn hàng của bạn",
    icon: <img src="https://img.icons8.com/color/96/delivery.png" className="w-5 h-5" alt="delivery" />,
    enabled: true,
    category: "payment",
  },
  {
    id: "review_received",
    label: "Nhận đánh giá mới",
    description: "Thông báo khi có người đánh giá bạn",
    icon: <img src="https://img.icons8.com/color/96/star.png" className="w-5 h-5" alt="star" />,
    enabled: true,
    category: "social",
  },
  {
    id: "dispute_opened",
    label: "Khiếu nại mới",
    description: "Thông báo khi có khiếu nại được mở liên quan đến bạn",
    icon: <img src="https://img.icons8.com/color/96/warning-shield.png" className="w-5 h-5" alt="warning" />,
    enabled: true,
    category: "social",
  },
  {
    id: "system",
    label: "Thông báo hệ thống",
    description: "Cập nhật quan trọng từ CocoFly về tính năng và bảo trì",
    icon: <img src="https://img.icons8.com/color/96/megaphone.png" className="w-5 h-5" alt="megaphone" />,
    enabled: true,
    category: "system",
  },
  {
    id: "account_warning",
    label: "Cảnh báo tài khoản",
    description: "Cảnh báo bảo mật và hoạt động bất thường trên tài khoản",
    icon: <img src="https://img.icons8.com/color/96/alert.png" className="w-5 h-5" alt="alert" />,
    enabled: true,
    category: "system",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  auction: "Đấu giá",
  payment: "Thanh toán & Giao hàng",
  social: "Đánh giá & Khiếu nại",
  system: "Hệ thống",
};

// ─── Toggle Switch ───────────────────────────────────────────────────────────
function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none flex-shrink-0
        ${enabled ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-300
          ${enabled ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

// ─── Input Field ─────────────────────────────────────────────────────────────
function FieldInput({ label, icon, type = "text", value, onChange, disabled, suffix, placeholder }: {
  label: string; icon: React.ReactNode; type?: string; value: string;
  onChange: (v: string) => void; disabled?: boolean; suffix?: React.ReactNode; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1.5 block">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-11 pr-10 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none
            focus:shadow-[2px_2px_0px_#E2B9A1] transition-all
            disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-400 disabled:cursor-not-allowed
            placeholder:text-slate-300 dark:placeholder:text-slate-500"
        />
        {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{suffix}</span>}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("/default-avatar.svg");
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(INITIAL_NOTIFICATION_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh đại diện vượt quá dung lượng cho phép (tối đa 5MB).");
      return;
    }
    
    setIsUploadingAvatar(true);
    try {
      const sigRes = await mediaApi.getUploadSignature();
      const { signature, timestamp, apiKey, cloudName, folder } = sigRes.data;

      if (!cloudName) {
        throw new Error("Missing Cloudinary config. Please check backend .env");
      }

      const formData = new window.FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      const uploadData = await uploadRes.json();

      if (uploadData.secure_url) {
        setAvatarUrl(uploadData.secure_url);
      }
    } catch (err: any) {
      console.error("Upload thất bại:", err);
      toast.error("Tải ảnh lên thất bại. Vui lòng tắt trình chặn quảng cáo (Adblock) hoặc thử lại.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userApi.getMyProfile();
        if (res?.data) {
          setFullName(res.data.fullName || "");
          setBio(res.data.bio || "");
          setAddress(res.data.address || "");
          setEmail(res.data.email || "");
          setPhone(res.data.phone || "");
          if (res.data.avatarUrl) setAvatarUrl(res.data.avatarUrl);
          
          // Merge saved notification settings
          if (res.data.notificationSettings) {
            const savedSettings = res.data.notificationSettings as Record<string, boolean>;
            setNotificationSettings(prev => prev.map(n => ({
              ...n,
              enabled: savedSettings[n.id] !== undefined ? savedSettings[n.id] : n.enabled
            })));
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Detect if password was successfully changed from query param
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("password_changed") === "true") {
        setPasswordSuccess(true);
        // Clear search params
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
        const timer = setTimeout(() => setPasswordSuccess(false), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleSaveProfile = async () => {
    setShowConfirmModal(false);
    setIsSaving(true);
    try {
      await userApi.updateProfile({
        fullName,
        bio,
        address,
        avatarUrl
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      const currentUser = authStorage.getUser() as any;
      const token = authStorage.getToken();
      if (currentUser && token) {
        authStorage.save(token, { ...currentUser, fullName, avatarUrl });
      }

      window.dispatchEvent(new Event("auth-change"));
    } catch (err) {
      console.error("Lỗi khi lưu profile:", err);
      // Có thể thêm toast báo lỗi ở đây
    } finally {
      setIsSaving(false);
    }
  };

  const saveNotificationSettings = async (newSettings: NotificationSetting[]) => {
    try {
      const payload = newSettings.reduce((acc, curr) => {
        acc[curr.id] = curr.enabled;
        return acc;
      }, {} as Record<string, boolean>);
      await userApi.updateNotificationSettings(payload);
    } catch (err) {
      console.error("Lỗi khi lưu thông báo:", err);
    }
  };

  const toggleNotification = (id: string) => {
    setNotificationSettings(prev => {
      const next = prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n);
      saveNotificationSettings(next);
      return next;
    });
  };

  const toggleAllNotifications = (enabled: boolean) => {
    setNotificationSettings(prev => {
      const next = prev.map(n => ({ ...n, enabled }));
      saveNotificationSettings(next);
      return next;
    });
  };

  const allEnabled = notificationSettings.every(n => n.enabled);
  const allDisabled = notificationSettings.every(n => !n.enabled);

  // Group notifications by category
  const groupedNotifications = notificationSettings.reduce((acc, n) => {
    if (!acc[n.category]) acc[n.category] = [];
    acc[n.category].push(n);
    return acc;
  }, {} as Record<string, NotificationSetting[]>);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Cài đặt</h1>
        </div>

        {/* ── Success Toast ───────────────────────────────────────────── */}
        {saveSuccess && (
          <div className="fixed top-24 right-6 z-50 animate-in fade-in slide-in-from-right-8 duration-300">
            <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-[4px_4px_0px_#059669] p-4 flex items-center gap-3 w-80 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">Thành công!</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Đã lưu thông tin tài khoản.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Password Success Toast ────────────────────────────────────── */}
        {passwordSuccess && (
          <div className="fixed top-24 right-6 z-50 animate-in fade-in slide-in-from-right-8 duration-300">
            <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-[4px_4px_0px_#059669] p-4 flex items-center gap-3 w-80 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">Thành công!</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Mật khẩu của bạn đã được cập nhật an toàn.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Confirm Modal ───────────────────────────────────────────── */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] animate-in zoom-in-95 duration-200 relative">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-primary" />
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                Xác nhận lưu
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Bạn có chắc chắn muốn lưu lại những thông tin đã thay đổi không?
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-primary bg-primary font-bold text-sm text-white shadow-[2px_2px_0px_#E2B9A1] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#E2B9A1] transition-all"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">

            {/* ── Avatar + Bio ── */}
            <div className="bg-white dark:bg-slate-800/60 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-2">
                <img src="https://img.icons8.com/color/96/user-male-circle.png" className="w-5 h-5" alt="user" />
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Hồ sơ</h2>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-6">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-600 shadow-[3px_3px_0px_#E2B9A1]">
                      {isUploadingAvatar ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800">
                          <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        </div>
                      ) : (
                        <Image src={avatarUrl} alt="Avatar" width={96} height={96} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files)}
                    />
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="px-4 py-2 text-xs font-bold rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-[2px_2px_0px_#E2B9A1] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#E2B9A1] transition-all disabled:opacity-50"
                  >
                    Thay đổi ảnh
                  </button>
                </div>

                {/* Bio */}
                <div className="flex-1 w-full">
                  <label className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1.5 block">
                    Giới thiệu bản thân
                  </label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Viết vài dòng giới thiệu về bạn..."
                    rows={4}
                    maxLength={200}
                    className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-3.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none resize-none
                      focus:shadow-[2px_2px_0px_#E2B9A1] transition-all
                      placeholder:text-slate-300 dark:placeholder:text-slate-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 text-right">{bio.length}/200</p>
                </div>
              </div>

              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 mt-4 rounded-xl bg-primary text-white text-sm font-bold border-2 border-primary shadow-[2px_2px_0px_#E2B9A1] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#E2B9A1] transition-all disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu thay đổi
              </button>
            </div>

            {/* ── Personal Info ── */}
            <div className="bg-white dark:bg-slate-800/60 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-2">
                <img src="https://img.icons8.com/color/96/resume.png" className="w-5 h-5" alt="personal-info" />
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Thông tin cá nhân</h2>
              </div>

              <div className="space-y-4">
                <FieldInput
                  label="Họ và tên"
                  icon={<User className="w-4 h-4" />}
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Nhập họ và tên"
                />
                <FieldInput
                  label="Email"
                  icon={<Mail className="w-4 h-4" />}
                  value={email}
                  onChange={() => {}}
                  disabled
                  suffix={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
                />
                <FieldInput
                  label="Số điện thoại"
                  icon={<Phone className="w-4 h-4" />}
                  value={phone}
                  onChange={() => {}}
                  disabled
                  suffix={phone ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : undefined}
                />
                <FieldInput
                  label="Địa chỉ"
                  icon={<MapPin className="w-4 h-4" />}
                  value={address}
                  onChange={setAddress}
                  placeholder="Nhập địa chỉ của bạn"
                />

                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 mt-2 rounded-xl bg-primary text-white text-sm font-bold border-2 border-primary shadow-[2px_2px_0px_#E2B9A1] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#E2B9A1] transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Lưu thay đổi
                </button>
              </div>
            </div>

            {/* ── Security ── */}
            <div className="bg-white dark:bg-slate-800/60 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-2">
                <img src="https://img.icons8.com/color/96/shield.png" className="w-5 h-5" alt="security" />
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Bảo mật</h2>
              </div>

              <div className="flex items-center justify-between border-t-2 border-slate-100 dark:border-slate-700 pt-5">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Mật khẩu</p>
                    <p className="text-xs text-slate-400 mt-0.5">Cập nhật mật khẩu để bảo vệ tài khoản</p>
                  </div>
                </div>
                <Link
                  href="/change-password"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-[2px_2px_0px_#E2B9A1] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#E2B9A1] transition-all"
                >
                  Đổi mật khẩu
                </Link>
              </div>
            </div>

            {/* ── Thông báo ── */}
            <div className="bg-white dark:bg-slate-800/60 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-2">
                <img src="https://img.icons8.com/color/96/bell.png" className="w-5 h-5" alt="notifications" />
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Thông báo</h2>
              </div>

              {/* Global Toggle */}
              <div className="flex items-center justify-between border-t-2 border-slate-100 dark:border-slate-700 pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {allDisabled ? "Thông báo đã tắt" : "Tất cả thông báo"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Bật / tắt tất cả thông báo cùng lúc</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={!allDisabled}
                  onToggle={() => toggleAllNotifications(allDisabled)}
                />
              </div>

              {/* Notification Items by Category */}
              {Object.entries(groupedNotifications).map(([category, items]) => (
                <div key={category}>
                  <div className="px-1 pt-4 pb-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {CATEGORY_LABELS[category] || category}
                    </h3>
                  </div>
                  <div className="space-y-0">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 py-3 px-1 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 rounded-lg transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold transition-colors duration-300 ${
                            item.enabled
                              ? "text-slate-800 dark:text-slate-100"
                              : "text-slate-400"
                          }`}>
                            {item.label}
                          </p>
                          <p className={`text-xs mt-0.5 transition-colors duration-300 ${
                            item.enabled
                              ? "text-slate-400"
                              : "text-slate-300 dark:text-slate-500"
                          }`}>
                            {item.description}
                          </p>
                        </div>
                        <ToggleSwitch
                          enabled={item.enabled}
                          onToggle={() => toggleNotification(item.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>


      </div>
    </div>
  );
}

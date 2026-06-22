"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  AlertTriangle,
  Edit2,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";

interface SystemConfig {
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
}

export default function ConfigPage() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit states
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [editValue, setEditValue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await adminApi.config.getAll();
      if (res && res.success) {
        setConfigs(res.data);
      } else {
        setErrorMsg(res?.message || "Không thể tải cấu hình hệ thống.");
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || "Đã xảy ra lỗi khi tải cấu hình.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const getShortTitle = (key: string) => {
    switch (key) {
      case "platform_fee_rate":
        return "Phí nền tảng";
      case "payment_timeout_hours":
        return "Thời hạn thanh toán";
      case "auto_confirm_days":
        return "Tự động xác nhận nhận hàng";
      case "max_active_listings":
        return "Số phiên hoạt động tối đa";
      case "new_account_bid_limit":
        return "Hạn mức đấu giá tài khoản mới";
      case "seller_shipping_deadline_days":
        return "Thời hạn người bán giao hàng";
      case "max_non_payment_strikes":
        return "Số gậy vi phạm tối đa";
      default:
        return key.replace(/_/g, " ").toUpperCase();
    }
  };

  const getFriendlyName = (key: string, description: string | null) => {
    if (description) return description;
    switch (key) {
      case "platform_fee_rate":
        return "Tỷ lệ phí nền tảng";
      case "payment_timeout_hours":
        return "Thời hạn thanh toán mua hàng";
      case "auto_confirm_days":
        return "Thời gian tự động xác nhận đơn hàng";
      case "max_active_listings":
        return "Số lượng đấu giá tối đa mỗi người bán";
      case "new_account_bid_limit":
        return "Hạn mức đấu giá tài khoản chưa xác thực";
      case "seller_shipping_deadline_days":
        return "Thời hạn giao hàng của người bán";
      case "max_non_payment_strikes":
        return "Số gậy phạt hủy thanh toán tối đa";
      default:
        return key;
    }
  };

  const formatValue = (key: string, val: string) => {
    const num = Number(val);
    if (isNaN(num)) return val;

    switch (key) {
      case "platform_fee_rate":
        return `${val}%`;
      case "payment_timeout_hours":
        return `${val} giờ`;
      case "auto_confirm_days":
      case "seller_shipping_deadline_days":
        return `${val} ngày`;
      case "new_account_bid_limit":
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
      case "max_active_listings":
        return `${val} phiên`;
      case "max_non_payment_strikes":
        return `${val} gậy`;
      default:
        return val;
    }
  };

  const handleEditClick = (config: SystemConfig) => {
    setEditingConfig(config);
    setEditValue(config.value);
    setFormError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;
    setFormError(null);

    if (!editValue.trim()) {
      setFormError("Vui lòng nhập giá trị cấu hình");
      return;
    }

    // Basic numerical validations
    const numVal = Number(editValue);
    if (
      [
        "platform_fee_rate",
        "payment_timeout_hours",
        "auto_confirm_days",
        "max_active_listings",
        "new_account_bid_limit",
        "seller_shipping_deadline_days",
        "max_non_payment_strikes",
      ].includes(editingConfig.key) &&
      (isNaN(numVal) || numVal < 0)
    ) {
      setFormError("Giá trị phải là một số dương hợp lệ");
      return;
    }

    try {
      setSubmitting(true);
      const res = await adminApi.config.update(editingConfig.key, editValue.trim());
      if (res && res.success) {
        setEditingConfig(null);
        fetchConfigs();
      } else {
        setFormError(res?.message || "Cập nhật cấu hình thất bại");
      }
    } catch (err: unknown) {
      setFormError((err as Error)?.message || "Đã xảy ra lỗi hệ thống khi lưu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight font-sans">CẤU HÌNH HỆ THỐNG</h2>
        </div>
      </div>

      {/* Success/Error Alert Bars */}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200/60 rounded-2xl p-4 flex gap-3 text-red-800 animate-[fadeIn_0.2s_ease-out]">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-sans flex-1">
            <span className="font-bold">Lỗi tải dữ liệu:</span> {errorMsg}
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-700 text-xs font-bold font-sans cursor-pointer self-start"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Configuration Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                <div className="w-8 h-8 bg-slate-100 rounded-lg" />
              </div>
              <div className="h-4 w-3/4 bg-slate-100 rounded-md" />
              <div className="h-8 w-1/3 bg-slate-100 rounded-md" />
              <div className="h-3 w-5/6 bg-slate-100 rounded-md" />
            </div>
          ))}
        </div>
      ) : configs.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center text-slate-400 font-sans">
          Không tìm thấy cấu hình hệ thống nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configs
            .filter((config) => config.key !== "auto_confirm_days")
            .map((config) => (
              <div
                key={config.key}
                className="bg-white border border-slate-200/60 hover:border-slate-300 rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300 group min-h-[200px]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-base font-bold text-slate-800 tracking-tight font-sans">
                      {getShortTitle(config.key)}
                    </h4>
                    <button
                      onClick={() => handleEditClick(config)}
                      className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                      title="Chỉnh sửa giá trị"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-3xl font-extrabold text-[#8f5c38] font-mono tracking-tight">
                    {formatValue(config.key, config.value)}
                  </div>
                  <p className="text-sm text-slate-500 font-sans leading-relaxed">
                    {config.description || getFriendlyName(config.key, null)}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-sans">
                  <span>Cập nhật mới nhất:</span>
                  <span className="font-mono">
                    {new Date(config.updatedAt).toLocaleDateString("vi-VN")} -{" "}
                    {new Date(config.updatedAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
          ))}
        </div>
      )}

      {/* Edit Slide-over Modal */}
      {editingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => !submitting && setEditingConfig(null)}
          />

          {/* Modal Container */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden transform transition-all duration-300 scale-100 z-10 animate-[scaleUp_0.2s_ease-out]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 font-sans">
                <Settings className="w-5 h-5 text-[#8f5c38]" />
                ĐIỀU CHỈNH CẤU HÌNH
              </h3>
              <button
                type="button"
                onClick={() => setEditingConfig(null)}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50 text-sm font-bold"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200/60 rounded-xl p-3 flex gap-2 text-red-700 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Mã cấu hình (Key)
                </span>
                <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-600 select-all">
                  {editingConfig.key}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ý nghĩa cấu hình
                </span>
                <p className="text-sm font-semibold text-slate-700 font-sans">
                  {getFriendlyName(editingConfig.key, editingConfig.description)}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Giá trị cấu hình mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-xl px-4 py-3 text-base text-[#8f5c38] font-bold font-mono focus:bg-white focus:border-slate-300 focus:outline-hidden transition-all"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 font-sans">
                  Hiện tại đang có giá trị: <strong className="text-slate-600 font-mono">{formatValue(editingConfig.key, editingConfig.value)}</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingConfig(null)}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#8f5c38] hover:bg-[#8f5c38]/90 text-white font-bold rounded-xl text-sm shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>Xác nhận</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

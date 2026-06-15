"use client";

import { AlertTriangle, Info, X } from "lucide-react";

interface AdminConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export default function AdminConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "info",
  isLoading = false,
}: AdminConfirmDialogProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
          iconBg: "bg-red-50",
          confirmBtn: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
          iconBg: "bg-amber-50",
          confirmBtn: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-500",
        };
      case "info":
      default:
        return {
          icon: <Info className="w-6 h-6 text-[#8f5c38]" />,
          iconBg: "bg-[#8f5c38]/10",
          confirmBtn: "bg-[#8f5c38] hover:bg-[#8f5c38]/90 focus:ring-[#8f5c38]",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Modal Content */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden transform transition-all duration-300 scale-100 z-10 animate-[scaleUp_0.2s_ease-out]">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className={`p-3 rounded-xl ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
                {styles.icon}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-950 font-sans tracking-tight">
                  {title}
                </h3>
                <p className="text-sm text-slate-500 font-sans leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-50/50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white font-bold rounded-xl text-sm shadow-xs transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2 ${styles.confirmBtn}`}
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
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

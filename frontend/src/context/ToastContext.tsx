"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
  showToast: (message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg: string, dur?: number) => showToast(msg, "success", dur), [showToast]);
  const error = useCallback((msg: string, dur?: number) => showToast(msg, "error", dur), [showToast]);
  const warning = useCallback((msg: string, dur?: number) => showToast(msg, "warning", dur), [showToast]);
  const info = useCallback((msg: string, dur?: number) => showToast(msg, "info", dur), [showToast]);

  const toastMethods = React.useMemo(() => ({ success, error, warning, info }), [success, error, warning, info]);

  return (
    <ToastContext.Provider value={{ toast: toastMethods, showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const { id, message, type, duration } = toast;
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(id);
    }, 300); // match fade-out duration
  }, [id, onRemove]);

  useEffect(() => {
    const timer = setTimeout(handleClose, duration || 4000);
    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  // Styles based on toast type
  let borderClass = "";
  let shadowClass = "";
  let iconColor = "";
  let Icon = Info;

  switch (type) {
    case "success":
      borderClass = "border-emerald-500 dark:border-emerald-500/80";
      shadowClass = "shadow-[4px_4px_0px_#10B981]";
      iconColor = "text-emerald-600 dark:text-emerald-500";
      Icon = CheckCircle2;
      break;
    case "error":
      borderClass = "border-red-500 dark:border-red-500/80";
      shadowClass = "shadow-[4px_4px_0px_#EF4444]";
      iconColor = "text-red-600 dark:text-red-500";
      Icon = XCircle;
      break;
    case "warning":
      borderClass = "border-amber-500 dark:border-amber-500/80";
      shadowClass = "shadow-[4px_4px_0px_#F59E0B]";
      iconColor = "text-amber-600 dark:text-amber-500";
      Icon = AlertTriangle;
      break;
    case "info":
      borderClass = "border-blue-500 dark:border-blue-500/80";
      shadowClass = "shadow-[4px_4px_0px_#3B82F6]";
      iconColor = "text-blue-600 dark:text-blue-500";
      Icon = Info;
      break;
  }

  return (
    <div
      className={`pointer-events-auto bg-white dark:bg-slate-900 border-2 ${borderClass} ${shadowClass} p-4 flex items-start gap-3 w-full rounded-xl transition-all duration-300 ${
        isExiting
          ? "animate-out fade-out slide-out-to-right-8"
          : "animate-in fade-in slide-in-from-right-8"
      }`}
    >
      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 break-words whitespace-pre-line leading-snug">
          {message}
        </p>
      </div>
      <button
        onClick={handleClose}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 self-start cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api";

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["700", "800"],
});

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("reset_email");
    const token = localStorage.getItem("reset_token");
    if (!email || !token) {
      router.push("/forgot-password");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }

    const email = localStorage.getItem("reset_email");
    const token = localStorage.getItem("reset_token");
    if (!email || !token) {
      setErrorMsg("Phiên đặt lại mật khẩu không hợp lệ. Vui lòng thử lại từ đầu.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({ email, token, newPassword });
      localStorage.removeItem("reset_email");
      localStorage.removeItem("reset_token");
      router.push("/password-reset-success");
    } catch (err: any) {
      setErrorMsg(err.message || "Có lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      {/* LEFT PANEL */}
      <div className="relative hidden w-1/2 overflow-hidden bg-primary-main lg:flex">
        <img
          src="/otp-illustration.png"
          alt="Reset Password Illustration"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1200&auto=format&fit=crop";
          }}
        />
        <div className="absolute inset-0 bg-primary-main/30" />
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2 lg:p-16">
        <div className="w-full max-w-md space-y-8 relative">
          <div className="absolute -top-12 -right-6 h-20 w-20 border-r-4 border-t-4 border-primary-main/20 hidden md:block" />

          <div className="space-y-3 text-center">
            <div className="mb-2 flex justify-center">
              <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 shadow-[4px_4px_0px_#E2B9A1]">
                <Image src="/logo.jpeg" alt="COCOFLY Logo" width={34} height={34} className="rounded-md" />
              </div>
            </div>
            <h1 className={`${playfairDisplay.className} text-4xl font-extrabold text-slate-900 dark:text-white`}>
              Đặt mật khẩu mới
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400">
              Tạo mật khẩu mới cho tài khoản của bạn. Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {errorMsg}
              </div>
            )}

            <label className="block space-y-2">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300">
                Mật khẩu mới
              </span>
              <div className="relative">
                <Image
                  src="/auth/lock-icon.svg"
                  alt="Lock"
                  width={18}
                  height={18}
                  className="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2"
                />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Tối thiểu 8 ký tự"
                  className="h-12 pl-10 pr-10 text-base"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300">
                Xác nhận mật khẩu
              </span>
              <div className="relative">
                <Image
                  src="/auth/lock-icon.svg"
                  alt="Lock"
                  width={18}
                  height={18}
                  className="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2"
                />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu mới"
                  className="h-12 pl-10 pr-10 text-base"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 cursor-pointer"
                  aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>

            <Button
              type="submit"
              className="group relative h-14 w-full overflow-hidden rounded-none border-2 border-primary-main bg-primary-main text-lg font-bold text-white shadow-[4px_4px_0px_#E2B9A1] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#E2B9A1]"
              disabled={isSubmitting || !newPassword || !confirmPassword}
            >
              {isSubmitting ? "Đang xử lý..." : (
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Đặt lại mật khẩu
                  <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

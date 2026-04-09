"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OtpInput from "@/components/auth/OtpInput";

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["700", "800"],
});

export default function ChangePasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown, step]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email.trim()) {
      setErrorMsg("Vui lòng nhập email.");
      return;
    }
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(2);
      setCountdown(60);
    }, 1000);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (otpValue.length !== 6) return;
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(3); // Go to change password form
    }, 1000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMsg("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(4); // Success step
    }, 1500);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen overflow-y-auto bg-background-light dark:bg-background-dark">
      {/* LEFT PANEL */}
      <div className="relative hidden w-1/2 overflow-hidden bg-primary-main lg:flex">
        <Image
          src="/otp-illustration.png"
          alt="Change Password Illustration"
          fill
          unoptimized
          className="absolute inset-0 object-cover"
        />
        <div className="absolute inset-0 bg-primary-main/30" />
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2 lg:p-16">
        <div className="w-full max-w-md space-y-8 relative">
          <div className="absolute -top-12 -right-6 h-20 w-20 border-r-4 border-t-4 border-primary-main/20 hidden md:block" />

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <>
              <div className="space-y-3 text-center">
                <div className="mb-2 flex justify-center">
                  <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 shadow-[4px_4px_0px_#E2B9A1]">
                    <Image src="/logo.jpeg" alt="COCOFLY Logo" width={34} height={34} className="rounded-md" />
                  </div>
                </div>
                <h1 className={`${playfairDisplay.className} text-4xl font-extrabold text-slate-900 dark:text-white`}>
                  Đổi mật khẩu
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-400">
                  Nhập email xác thực tài khoản của bạn để nhận mã OTP.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-6">
                {errorMsg && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {errorMsg}
                  </div>
                )}
                <label className="block space-y-2">
                  <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300">
                    Email tài khoản
                  </span>
                  <div className="relative">
                    <Image
                      src="/auth/mail-icon.svg"
                      alt="Mail"
                      width={18}
                      height={18}
                      className="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2"
                    />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      className="h-12 pl-10 text-base border-2 border-slate-300 shadow-[4px_4px_0px_#cbd5e1] focus-visible:ring-0 focus-visible:border-primary-main rounded-none"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </label>

                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <Button
                    type="submit"
                    className="group relative h-14 w-full overflow-hidden rounded-none border-2 border-primary-main bg-primary-main text-lg font-bold text-white shadow-[4px_4px_0px_#E2B9A1] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] disabled:opacity-70 disabled:hover:translate-y-0 sm:w-64"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang gửi..." : (
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Gửi mã OTP
                        <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => router.back()}
                    className="h-14 w-full rounded-none border-2 border-slate-300 bg-white text-lg font-bold text-slate-700 shadow-[4px_4px_0px_#cbd5e1] transition-all hover:-translate-y-1 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 sm:w-36"
                  >
                    <ArrowLeft className="mr-1 size-5" />
                    Quay lại
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* STEP 2: Input OTP */}
          {step === 2 && (
            <>
              <div className="space-y-3 text-center">
                <div className="mb-2 flex justify-center">
                  <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 shadow-[4px_4px_0px_#E2B9A1]">
                    <Image src="/logo.jpeg" alt="COCOFLY Logo" width={34} height={34} className="rounded-md" />
                  </div>
                </div>
                <h1 className={`${playfairDisplay.className} text-4xl font-extrabold text-slate-900 dark:text-white`}>
                  Nhập mã OTP
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-400">
                  Mã xác thực 6 số đã được gửi đến email <span className="font-semibold text-slate-800 dark:text-white">{email}</span>.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-8">
                <div className="space-y-4">
                  {errorMsg && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                      {errorMsg}
                    </div>
                  )}
                  {successMsg && (
                    <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
                      {successMsg}
                    </div>
                  )}
                  <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300">
                    Nhập mã bảo mật
                  </label>
                  <OtpInput
                    length={6}
                    onComplete={(val) => setOtpValue(val)}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-500">Chưa nhận được mã?</span>
                  <button
                    type="button"
                    className="font-bold text-primary-main hover:underline disabled:opacity-50"
                    onClick={() => { setCountdown(60); setSuccessMsg("Đã gửi lại mã OTP."); }}
                    disabled={countdown > 0}
                  >
                    {countdown > 0 ? `Đợi ${formatTime(countdown)}` : "Gửi lại mã"}
                  </button>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <Button
                    type="submit"
                    className="group relative h-14 w-full overflow-hidden rounded-none border-2 border-primary-main bg-primary-main text-lg font-bold text-white shadow-[4px_4px_0px_#E2B9A1] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] disabled:opacity-70 disabled:hover:translate-y-0 sm:w-64"
                    disabled={isSubmitting || otpValue.length !== 6}
                  >
                    {isSubmitting ? "Đang xử lý..." : "Xác nhận OTP"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-14 w-full rounded-none border-2 border-slate-300 bg-white text-lg font-bold text-slate-700 shadow-[4px_4px_0px_#cbd5e1] transition-all hover:-translate-y-1 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 sm:w-36"
                  >
                    Đổi Email
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* STEP 3: Enter New Passwords */}
          {step === 3 && (
            <>
              <div className="space-y-3 text-center">
                <h1 className={`${playfairDisplay.className} text-4xl font-extrabold text-slate-900 dark:text-white`}>
                  Cập nhật mật khẩu
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-400">
                  Vui lòng nhập mật khẩu cũ và đặt mật khẩu mới cho tài khoản của bạn.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6">
                {errorMsg && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-4">
                  <label className="block space-y-2">
                    <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300">Mật khẩu hiện tại</span>
                    <Input
                      type="password"
                      className="h-12 text-base border-2 border-slate-300 shadow-[4px_4px_0px_#cbd5e1] focus-visible:ring-0 focus-visible:border-primary-main rounded-none"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300">Mật khẩu mới</span>
                    <Input
                      type="password"
                      className="h-12 text-base border-2 border-slate-300 shadow-[4px_4px_0px_#cbd5e1] focus-visible:ring-0 focus-visible:border-primary-main rounded-none"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300">Xác nhận mật khẩu mới</span>
                    <Input
                      type="password"
                      className="h-12 text-base border-2 border-slate-300 shadow-[4px_4px_0px_#cbd5e1] focus-visible:ring-0 focus-visible:border-primary-main rounded-none"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-4 pt-2">
                  <Button
                    type="submit"
                    className="h-14 w-full rounded-none border-2 border-primary-main bg-primary-main text-lg font-bold text-white shadow-[4px_4px_0px_#E2B9A1] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] disabled:opacity-70 disabled:hover:translate-y-0"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang xử lý..." : "Đổi Mật Khẩu"}
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* STEP 4: Success */}
          {step === 4 && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="mb-6 flex justify-center">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="relative flex h-full w-full items-center justify-center rounded-full bg-emerald-500 shadow-[6px_6px_0px_#059669]">
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>

              <h1 className={`${playfairDisplay.className} text-4xl font-extrabold text-slate-900 dark:text-white`}>
                Thành công!
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Mật khẩu của bạn đã được cập nhật an toàn.
              </p>

              <div className="flex flex-col gap-4 mt-8 pt-4">
                <Button
                  onClick={() => router.push("/profile")}
                  className="h-14 w-full rounded-none border-2 border-slate-300 bg-white text-lg font-bold text-slate-700 shadow-[4px_4px_0px_#cbd5e1] transition-all hover:-translate-y-1 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                >
                  Trở lại Hồ sơ
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

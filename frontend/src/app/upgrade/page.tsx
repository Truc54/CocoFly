"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { userApi } from "@/lib/api";
import { authStorage } from "@/lib/auth-storage";
import { Button } from "@/components/ui/button";
import OtpInput from "@/components/auth/OtpInput";

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["700", "800"],
});

export default function UpgradePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
    if (phone.length < 9) {
      setErrorMsg("Số điện thoại không hợp lệ");
      return;
    }
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      // Mock sending OTP: Delay for 1.5s
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setStep(2);
      setCountdown(60);
      setSuccessMsg("Đã gửi mã OTP. Mã thử nghiệm mặc định là 123456.");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch {
      setErrorMsg("Không thể gửi mã OTP. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) return;
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      // 1. Mock verify OTP: Delay and check if it's 123456
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      if (otpValue !== "123456") {
        setErrorMsg("Mã OTP không đúng. Vui lòng kiểm tra lại.");
        setIsSubmitting(false);
        return;
      }

      // 2. Send phone number to our backend to upgrade role
      const accessToken = authStorage.getToken();
      if (!accessToken) {
        setErrorMsg("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        setIsSubmitting(false);
        return;
      }

      const fullPhone = `+84${phone.replace(/^0/, "")}`;
      const result = await userApi.upgradeRole(fullPhone, accessToken);

      // 3. Silent update: save new tokens & user data
      authStorage.save(result.accessToken, result.user);
      window.dispatchEvent(new Event("auth-change"));

      setStep(3); // Success
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message.includes("Token không hợp lệ") || error.message.includes("Phiên đăng nhập") || error.message.includes("Unauthorized")) {
        authStorage.clear();
        window.dispatchEvent(new Event("auth-change"));
        setErrorMsg("Phiên đăng nhập đã hết hạn. Đang chuyển hướng...");
        setTimeout(() => router.push("/login?redirect=/upgrade"), 1500);
      } else {
        setErrorMsg(error.message || "Xác thực thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      // Mock resend OTP: Delay for 1s
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setCountdown(60);
      setSuccessMsg("Đã gửi lại mã OTP. Mã thử nghiệm mặc định là 123456.");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch {
      setErrorMsg("Không thể gửi lại mã. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen overflow-y-auto bg-background-light dark:bg-background-dark">
      {/* LEFT PANEL */}
      <div className="relative hidden w-1/2 overflow-hidden bg-primary-main lg:flex">
        <Image
          src="/otp-illustration.png"
          alt="Upgrade Illustration"
          fill
          className="absolute inset-0 object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-primary-main/30" />
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2 lg:p-16">
        <div className="w-full max-w-md space-y-8 relative">
          <div className="absolute -top-12 -right-6 h-20 w-20 border-r-4 border-t-4 border-primary-main/20 hidden md:block" />

          {/* ── Step 1: Nhập Số điện thoại ── */}
          {step === 1 && (
            <>
              <div className="space-y-3 text-center">
                <div className="mb-2 flex justify-center">
                  <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 shadow-[4px_4px_0px_#E2B9A1]">
                    <Image src="/logo.jpeg" alt="COCOFLY Logo" width={34} height={34} className="rounded-md" />
                  </div>
                </div>
                <h1 className={`${playfairDisplay.className} text-4xl font-extrabold text-slate-900 dark:text-white`}>
                  Nâng cấp Seller
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-400">
                  Xác minh số điện thoại để mở khóa tính năng bán hàng và tạo phiên đấu giá.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-8">
                <div className="space-y-4">
                  {errorMsg && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                      {errorMsg}
                    </div>
                  )}

                  <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300">
                    Số điện thoại (*)
                  </label>
                  <div className="flex gap-2">
                    <span className="flex border-2 border-slate-300 shadow-[4px_4px_0px_#cbd5e1] items-center justify-center px-4 bg-slate-100 text-slate-600 font-bold dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:shadow-[4px_4px_0px_#334155] rounded-l-xl">
                      +84
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="909 123 456"
                      maxLength={10}
                      required
                      className="h-14 w-full flex-1 border-2 border-slate-300 bg-white px-4 text-lg font-medium text-slate-900 shadow-[4px_4px_0px_#cbd5e1] outline-none transition-all focus:-translate-y-1 focus:border-primary-main focus:shadow-[6px_6px_0px_#E2B9A1] focus:ring-0 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:shadow-[4px_4px_0px_#334155] dark:focus:border-primary-main rounded-r-xl"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <Button
                    type="submit"
                    className="group relative h-14 w-full overflow-hidden rounded-xl border-2 border-primary-main bg-primary-main text-lg font-bold text-white shadow-[4px_4px_0px_#E2B9A1] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#E2B9A1] sm:w-64"
                    disabled={isSubmitting || phone.length < 9}
                  >
                    {isSubmitting ? "Đang xử lý..." : (
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Gửi mã OTP
                      </span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => router.back()}
                    className="h-14 w-full rounded-xl border-2 border-slate-300 bg-white text-lg font-bold text-slate-700 shadow-[4px_4px_0px_#cbd5e1] transition-all hover:-translate-y-1 hover:bg-slate-50 hover:shadow-[6px_6px_0px_#cbd5e1] dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:shadow-[4px_4px_0px_#334155] sm:w-36"
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* ── Step 2: Nhập OTP ── */}
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
                  Vui lòng nhập mã bảo mật 6 số đã được gửi qua SMS tới số{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">+84 {phone}</span>.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-8">
                <div className="space-y-4">
                  {successMsg && (
                    <div className="rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      {successMsg}
                    </div>
                  )}
                  {errorMsg && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                      {errorMsg}
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
                  <span className="font-medium text-slate-500">
                    Chưa nhận được mã?
                  </span>
                  <button
                    type="button"
                    className="font-bold text-primary-main transition-colors hover:text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || isSubmitting}
                  >
                    {countdown > 0 ? `Đợi ${formatTime(countdown)}` : "Gửi lại mã"}
                  </button>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <Button
                    type="submit"
                    className="group relative h-14 w-full overflow-hidden rounded-xl border-2 border-primary-main bg-primary-main text-lg font-bold text-white shadow-[4px_4px_0px_#E2B9A1] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#E2B9A1] sm:w-64"
                    disabled={isSubmitting || otpValue.length !== 6}
                  >
                    {isSubmitting ? "Đang xử lý..." : (
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Xác nhận OTP
                        <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => { setStep(1); setOtpValue(""); }}
                    className="h-14 w-full rounded-xl border-2 border-slate-300 bg-white text-lg font-bold text-slate-700 shadow-[4px_4px_0px_#cbd5e1] transition-all hover:-translate-y-1 hover:bg-slate-50 hover:shadow-[6px_6px_0px_#cbd5e1] dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:shadow-[4px_4px_0px_#334155] sm:w-36"
                  >
                    Đổi SĐT
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* ── Step 3: Thành công ── */}
          {step === 3 && (
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
                🎉 Chúc mừng!
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Bạn đã nâng cấp thành công thành <span className="font-bold text-emerald-600">SELLER</span>.
              </p>

              <div className="flex flex-col gap-4 mt-8 pt-4">
                <Button
                  onClick={() => router.push("/create-auction")}
                  className="group relative h-14 w-full overflow-hidden rounded-xl border-2 border-primary-main bg-primary-main text-lg font-bold text-white shadow-[4px_4px_0px_#E2B9A1] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1]"
                >
                  <span className="relative z-10">Tạo phiên đấu giá đầu tiên</span>
                </Button>
                <Button
                  onClick={() => router.push("/")}
                  className="h-14 w-full rounded-xl border-2 border-slate-300 bg-white text-lg font-bold text-slate-700 shadow-[4px_4px_0px_#cbd5e1] transition-all hover:-translate-y-1 hover:bg-slate-50 hover:shadow-[6px_6px_0px_#cbd5e1] dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:shadow-[4px_4px_0px_#334155]"
                >
                  Về trang chủ
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

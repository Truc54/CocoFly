"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Playfair_Display } from "next/font/google";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OtpInput from "@/components/auth/OtpInput";
import { authStorage } from "@/lib/auth-storage";
import { authApi, userApi } from "@/lib/api";

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["700", "800"],
});

export default function ChangePasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(2); // Start directly at step 2 (OTP verification)
  const [email, setEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [hasPassword, setHasPassword] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Retrieve user email and auto-send OTP on mount
  useEffect(() => {
    const initPage = async () => {
      const currentUser = authStorage.getUser() as { email?: string } | null;
      const regEmail = currentUser?.email || "truc@gmail.com";
      setEmail(regEmail);

      setIsSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");
      try {
        // Fetch user profile to detect if password exists (OAuth2 check)
        const profileRes = await userApi.getMyProfile();
        if (profileRes?.data) {
          setHasPassword(!!profileRes.data.hasPassword);
        }
        await authApi.forgotPassword({ email: regEmail });
        setCountdown(60);
      } catch (err) {
        setErrorMsg((err as Error).message || "Không thể tự động gửi mã OTP. Vui lòng thử lại.");
      } finally {
        setIsSubmitting(false);
      }
    };
    initPage();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown, step]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (otpValue.length !== 6) return;
    setIsSubmitting(true);
    try {
      const res = await authApi.verifyResetOtp({ email, otp: otpValue });
      if (res?.resetToken) {
        setResetToken(res.resetToken);
        setStep(3); // Go to change password form
      } else {
        throw new Error("Không nhận được mã thông báo đặt lại mật khẩu.");
      }
    } catch (err) {
      setErrorMsg((err as Error).message || "Mã OTP không đúng hoặc đã hết hạn.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await authApi.forgotPassword({ email });
      setCountdown(60);
      setSuccessMsg("Đã gửi lại mã OTP thành công.");
    } catch (err) {
      setErrorMsg((err as Error).message || "Gửi lại mã OTP thất bại.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if ((hasPassword && !oldPassword) || !newPassword || !confirmPassword) {
      setErrorMsg("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }
    setIsSubmitting(true);
    try {
      await authApi.resetPassword({
        email,
        token: resetToken,
        newPassword,
        ...(hasPassword ? { oldPassword } : {})
      });
      // Redirect back to settings page with password_changed=true param
      router.push("/settings?password_changed=true");
    } catch (err) {
      setErrorMsg((err as Error).message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.");
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

          {/* STEP 2: Input OTP */}
          {step === 2 && (
            <>
              <div className="space-y-3 text-center animate-in fade-in duration-300">
                <div className="mb-2 flex justify-center">
                  <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 shadow-[4px_4px_0px_#E2B9A1]">
                    <Image src="/logo.png" alt="CocoFly Logo" width={34} height={34} className="rounded-md" />
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
                    <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                      {errorMsg}
                    </div>
                  )}
                  {successMsg && (
                    <div className="rounded-xl bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
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
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || isSubmitting}
                  >
                    {countdown > 0 ? `Đợi ${formatTime(countdown)}` : "Gửi lại mã"}
                  </button>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <Button
                    type="submit"
                    className="group relative h-14 w-full overflow-hidden rounded-xl border-2 border-primary-main bg-primary-main text-lg font-bold text-white shadow-[4px_4px_0px_#E2B9A1] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] disabled:opacity-70 disabled:hover:translate-y-0 sm:w-64"
                    disabled={isSubmitting || otpValue.length !== 6}
                  >
                    {isSubmitting ? "Đang xử lý..." : "Xác nhận OTP"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => router.back()}
                    className="h-14 w-full rounded-xl border-2 border-slate-300 bg-white text-lg font-bold text-slate-700 shadow-[4px_4px_0px_#cbd5e1] transition-all hover:-translate-y-1 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 sm:w-36"
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* STEP 3: Enter New Passwords */}
          {step === 3 && (
            <>
              <div className="space-y-3 text-center animate-in fade-in duration-300">
                <h1 className={`${playfairDisplay.className} text-4xl font-extrabold text-slate-900 dark:text-white`}>
                  Cập nhật mật khẩu
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-400">
                  {hasPassword
                    ? "Vui lòng nhập mật khẩu hiện tại và đặt mật khẩu mới cho tài khoản của bạn."
                    : "Tài khoản liên kết Google/Facebook của bạn chưa thiết lập mật khẩu. Vui lòng đặt mật khẩu mới."}
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6">
                {errorMsg && (
                  <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-4">
                  {hasPassword && (
                    <label className="block space-y-2">
                      <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300">Mật khẩu hiện tại</span>
                      <Input
                        type="password"
                        className="h-12 text-base border-2 border-slate-300 shadow-[4px_4px_0px_#cbd5e1] focus-visible:ring-0 focus-visible:border-primary-main rounded-xl"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                    />
                  </label>
                  )}

                  <label className="block space-y-2">
                    <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300">Mật khẩu mới</span>
                    <Input
                      type="password"
                      className="h-12 text-base border-2 border-slate-300 shadow-[4px_4px_0px_#cbd5e1] focus-visible:ring-0 focus-visible:border-primary-main rounded-xl"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300">Xác nhận mật khẩu mới</span>
                    <Input
                      type="password"
                      className="h-12 text-base border-2 border-slate-300 shadow-[4px_4px_0px_#cbd5e1] focus-visible:ring-0 focus-visible:border-primary-main rounded-xl"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-4 pt-2">
                  <Button
                    type="submit"
                    className="h-14 w-full rounded-xl border-2 border-primary-main bg-primary-main text-lg font-bold text-white shadow-[4px_4px_0px_#E2B9A1] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] disabled:opacity-70 disabled:hover:translate-y-0"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang xử lý..." : "Đổi Mật Khẩu"}
                  </Button>
                </div>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

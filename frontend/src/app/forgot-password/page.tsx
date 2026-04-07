"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import { ArrowRight, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api";

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["700", "800"],
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim()) {
      setErrorMsg("Vui lòng nhập email.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.forgotPassword({ email });
      localStorage.setItem("reset_email", email);
      router.push("/reset-verify-otp");
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
          alt="Forgot Password Illustration"
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
              Quên mật khẩu
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400">
              Nhập email tài khoản của bạn, chúng tôi sẽ gửi mã OTP để xác thực danh tính.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="h-12 pl-10 text-base"
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
                className="group relative h-14 w-full overflow-hidden rounded-none border-2 border-primary-main bg-primary-main text-lg font-bold text-white shadow-[4px_4px_0px_#E2B9A1] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#E2B9A1] sm:w-64"
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
                onClick={() => router.push("/login")}
                className="h-14 w-full rounded-none border-2 border-slate-300 bg-white text-lg font-bold text-slate-700 shadow-[4px_4px_0px_#cbd5e1] transition-all hover:-translate-y-1 hover:bg-slate-50 hover:shadow-[6px_6px_0px_#cbd5e1] dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:shadow-[4px_4px_0px_#334155] sm:w-36"
              >
                <ArrowLeft className="mr-1 size-5" />
                Quay lại
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            Đã nhớ mật khẩu?{" "}
            <Link href="/login" className="text-primary-main hover:underline font-bold">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

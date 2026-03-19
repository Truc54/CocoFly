"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import OtpInput from "@/components/auth/OtpInput";

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["700", "800"],
});

export default function VerifyOtpPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpValue, setOtpValue] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpValue.length !== 6) return;

    setIsSubmitting(true);
    // Mock API call delay
    setTimeout(() => {
      router.push("/verification-success");
    }, 800);
  };

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      {/* LEFT PANEL - IMAGE BACKGROUND ONLY (Hidden on small screens) */}
      <div className="relative hidden w-1/2 overflow-hidden bg-primary-main lg:flex">
        <img
          src="/otp-illustration.png"
          alt="OTP Illustration"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1200&auto=format&fit=crop";
          }}
        />
        <div className="absolute inset-0 bg-primary-main/30" />
      </div>

      {/* RIGHT PANEL - FORM */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2 lg:p-16">
        <div className="w-full max-w-md space-y-8 relative">

          {/* Decorative Corner Element (Brutalist motif) */}
          <div className="absolute -top-12 -right-6 h-20 w-20 border-r-4 border-t-4 border-primary-main/20 hidden md:block" />

          <div className="space-y-3 text-center">
            <div className="mb-2 flex justify-center">
              <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 shadow-[4px_4px_0px_#E2B9A1]">
                <Image src="/logo.jpeg" alt="COCOFLY Logo" width={34} height={34} className="rounded-md" />
              </div>
            </div>
            <h1 className={`${playfairDisplay.className} text-4xl font-extrabold text-slate-900 dark:text-white`}>
              Xác thực OTP
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400">
              Để bảo vệ tài khoản, vui lòng nhập mã gồm 6 chữ số đã được gửi đến email của bạn.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-300">
                Nhập mã bảo mật
              </label>

              <OtpInput
                length={6}
                onComplete={(val) => {
                  setOtpValue(val);
                }}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-500">
                Chưa nhận được mã?
              </span>
              <button
                type="button"
                className="font-bold text-primary-main transition-colors hover:text-primary hover:underline"
                onClick={() => alert("Đã gửi lại mã OTP!")}
              >
                Gửi lại mã
              </button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                type="submit"
                className="group relative h-14 w-full overflow-hidden rounded-none border-2 border-primary-main bg-primary-main text-lg font-bold text-white shadow-[4px_4px_0px_#E2B9A1] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_#E2B9A1] sm:w-64"
                disabled={isSubmitting || otpValue.length !== 6}
              >
                {isSubmitting ? "Đang xử lý..." : (
                  <>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Xác nhận
                      <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={() => router.back()}
                className="h-14 w-full rounded-none border-2 border-slate-300 bg-white text-lg font-bold text-slate-700 shadow-[4px_4px_0px_#cbd5e1] transition-all hover:-translate-y-1 hover:bg-slate-50 hover:shadow-[6px_6px_0px_#cbd5e1] dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:shadow-[4px_4px_0px_#334155] sm:w-36"
              >
                Hủy bỏ
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            Gặp khó khăn với OTP?{" "}
            <Link href="#" className="text-primary-main hover:underline">
              Nhận trợ giúp
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Playfair_Display } from "next/font/google";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthCardProps = {
  mode: "login" | "register";
};

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["700"],
});

export default function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter();
  const isLogin = mode === "login";
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin) {
      // Flow đăng ký -> OTP
      router.push("/verify-otp");
    } else {
      // Flow đăng nhập -> Trang chủ
      router.push("/");
    }
  };

  return (
    <section className="relative box-border flex min-h-dvh items-start justify-center overflow-hidden px-6 pb-3 pt-5 lg:pb-4 lg:pt-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background-light to-background-light dark:from-primary/20 dark:via-background-dark dark:to-background-dark" />
      <div className="pointer-events-none absolute -top-20 -left-10 -z-10 h-64 w-64 rounded-full bg-accent-main/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

      <div className="mx-auto w-full max-w-md">
        <Card className="relative mx-auto w-full border-primary/15 bg-white/90 py-0 shadow-2xl shadow-primary/10 backdrop-blur-sm dark:bg-background-dark/90">
          <Link
            href="/"
            aria-label="Về trang chủ"
            title="Về trang chủ"
            className="absolute left-4 top-4 z-20 inline-flex size-11 items-center justify-center rounded-full transition-transform duration-200 hover:scale-105"
          >
            <Image
              src="/auth/back-arrow.svg"
              alt="Back"
              width={44}
              height={44}
              className="h-11 w-11"
            />
          </Link>

          <CardHeader className="space-y-1.5 px-6 pb-1 pt-6 text-center">
            <div className="flex items-center justify-center gap-2.5">
              <Image
                src="/logo.jpeg"
                alt="COCOFLY Logo"
                width={42}
                height={42}
                className="rounded-md"
              />
              <span className="brand-text text-[2.2rem] leading-none text-primary">COCOFLY</span>
            </div>
            <div className="mt-3 rounded-xl border border-primary/15 bg-primary/5 p-1">
              <div className="grid grid-cols-2 gap-1">
                <Link
                  href="/login"
                  className={`inline-flex h-10 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                    isLogin
                      ? "bg-white text-primary shadow-sm"
                      : "text-primary/75 hover:text-primary"
                  }`}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className={`inline-flex h-10 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                    !isLogin
                      ? "bg-white text-primary shadow-sm"
                      : "text-primary/75 hover:text-primary"
                  }`}
                >
                  Đăng ký
                </Link>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-6 pb-5 pt-1">
            <h1 className={`${playfairDisplay.className} text-center text-[2.15rem] leading-tight font-bold text-primary`}>
              {isLogin ? "Chào mừng trở lại" : "Tạo tài khoản"}
            </h1>

            <form className="space-y-3.5" onSubmit={handleSubmit}>
              {!isLogin && (
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Họ và tên</span>
                  <div className="relative">
                    <Image
                      src="/auth/user-icon.svg"
                      alt="User"
                      width={18}
                      height={18}
                      className="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2"
                    />
                    <Input type="text" placeholder="Nguyễn Văn A" className="h-10 pl-10" />
                  </div>
                </label>
              )}

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Email</span>
                <div className="relative">
                  <Image
                    src="/auth/mail-icon.svg"
                    alt="Mail"
                    width={18}
                    height={18}
                    className="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2"
                  />
                  <Input type="email" placeholder="you@example.com" className="h-10 pl-10" />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Mật khẩu</span>
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
                    placeholder={isLogin ? "••••••••" : "Tối thiểu 8 ký tự"}
                    className="h-10 pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </label>

              {!isLogin && (
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Xác nhận mật khẩu</span>
                  <div className="relative">
                    <Image
                      src="/auth/lock-icon.svg"
                      alt="Lock"
                      width={18}
                      height={18}
                      className="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2"
                    />
                    <Input type="password" placeholder="Nhập lại mật khẩu" className="h-10 pl-10" />
                  </div>
                </label>
              )}

              <div
                className={
                  isLogin
                    ? "flex items-center justify-between gap-3 text-sm"
                    : "flex items-start gap-3 text-sm"
                }
              >
                <label
                  className={
                    isLogin
                      ? "inline-flex cursor-pointer items-center gap-2 text-slate-600 dark:text-slate-300"
                      : "inline-flex cursor-pointer items-start gap-2 text-slate-900"
                  }
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 cursor-pointer rounded border border-primary-main text-primary-main accent-primary-main focus:ring-primary-main/30"
                  />
                  {isLogin ? (
                    <span>Ghi nhớ đăng nhập</span>
                  ) : (
                    <span className="leading-5">
                      Tôi đồng ý với{" "}
                      <Link href="#" className="font-semibold text-primary-main hover:text-primary hover:underline">
                        điều khoản sử dụng
                      </Link>{" "}
                      và{" "}
                      <Link href="#" className="font-semibold text-primary-main hover:text-primary hover:underline">
                        chính sách bảo mật
                      </Link>{" "}
                      của COCOFLY
                    </span>
                  )}
                </label>
                {isLogin && (
                  <Link href="#" className="font-semibold text-primary hover:text-primary/80 hover:underline">
                    Quên mật khẩu?
                  </Link>
                )}
              </div>

              <Button className="h-10 w-full text-sm font-bold" size="lg" type="submit">
                {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
              </Button>
            </form>

            {isLogin && (
              <>
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-primary/15" />
                  </div>
                  <span className="relative mx-auto block w-fit bg-white px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-background-dark dark:text-slate-400">
                    Hoặc
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button variant="outline" className="h-10 font-semibold" type="button">
                    <Image
                      src="/auth/google-logo.svg"
                      alt="Google"
                      width={18}
                      height={18}
                      className="size-4.5"
                    />
                    Tiếp tục với Google
                  </Button>
                  <Button variant="outline" className="h-10 font-semibold" type="button">
                    <Image
                      src="/auth/facebook-logo.svg"
                      alt="Facebook"
                      width={18}
                      height={18}
                      className="size-4.5"
                    />
                    Tiếp tục với Facebook
                  </Button>
                </div>
              </>
            )}

            <p className="text-center text-sm text-slate-600 dark:text-slate-300">
              {isLogin ? "Bạn chưa có tài khoản?" : "Bạn đã có tài khoản?"}{" "}
              <Link
                href={isLogin ? "/register" : "/login"}
                className="font-bold text-primary hover:text-primary/80 hover:underline"
              >
                {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

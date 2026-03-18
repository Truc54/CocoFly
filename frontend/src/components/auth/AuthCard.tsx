"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LockKeyhole, Mail, UserRound } from "lucide-react";

import RoundedDatePicker from "@/components/auth/RoundedDatePicker";
import RoundedSelect from "@/components/auth/RoundedSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthCardProps = {
  mode: "login" | "register";
};

export default function AuthCard({ mode }: AuthCardProps) {
  const isLogin = mode === "login";
  const [gender, setGender] = useState("");

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10 lg:py-14">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background-light to-background-light dark:from-primary/20 dark:via-background-dark dark:to-background-dark" />
      <div className="pointer-events-none absolute -top-20 -left-10 -z-10 h-64 w-64 rounded-full bg-accent-main/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

      <div className="mx-auto w-full max-w-md">
        <Card className="mx-auto w-full border-primary/15 bg-white/90 py-0 shadow-2xl shadow-primary/10 backdrop-blur-sm dark:bg-background-dark/90">
          <CardHeader className="space-y-2 px-6 pb-1 pt-7 text-center">
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
            <CardTitle
              className="mt-4 text-[1.42rem] leading-[0.9] font-black uppercase tracking-[0.038em] text-primary sm:text-[1.55rem]"
              style={{ fontVariationSettings: '"wght" 820' }}
            >
              {isLogin ? "ĐĂNG NHẬP" : "ĐĂNG KÝ"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 px-6 pb-6 pt-1">
            <form className="space-y-4">
              {!isLogin && (
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Họ và tên</span>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input type="text" placeholder="Nguyễn Văn A" className="h-10 pl-10" />
                  </div>
                </label>
              )}

              {!isLogin && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Giới tính</span>
                    <RoundedSelect
                      value={gender}
                      onChange={setGender}
                      placeholder="Chọn giới tính"
                      options={[
                        { value: "male", label: "Nam" },
                        { value: "female", label: "Nữ" },
                        { value: "other", label: "Khác" },
                      ]}
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ngày sinh</span>
                    <RoundedDatePicker />
                  </label>
                </div>
              )}

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input type="email" placeholder="you@example.com" className="h-10 pl-10" />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Mật khẩu</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input type="password" placeholder="••••••••" className="h-10 pl-10" />
                </div>
              </label>

              {!isLogin && (
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Xác nhận mật khẩu</span>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input type="password" placeholder="••••••••" className="h-10 pl-10" />
                  </div>
                </label>
              )}

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="inline-flex cursor-pointer items-center gap-2 text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    className="size-4 cursor-pointer rounded border border-slate-300 text-primary focus:ring-primary"
                  />
                  {isLogin ? "Ghi nhớ đăng nhập" : "Tôi đồng ý với điều khoản sử dụng"}
                </label>
                {isLogin && (
                  <Link href="#" className="font-semibold text-primary hover:underline">
                    Quên mật khẩu?
                  </Link>
                )}
              </div>

              <Button className="h-10 w-full text-sm font-bold" size="lg" type="submit">
                {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
              </Button>
            </form>

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
                  className="size-[18px]"
                />
                Tiếp tục với Google
              </Button>
              <Button variant="outline" className="h-10 font-semibold" type="button">
                <Image
                  src="/auth/facebook-logo.svg"
                  alt="Facebook"
                  width={18}
                  height={18}
                  className="size-[18px]"
                />
                Tiếp tục với Facebook
              </Button>
            </div>

            <p className="text-center text-sm text-slate-600 dark:text-slate-300">
              {isLogin ? "Bạn chưa có tài khoản?" : "Bạn đã có tài khoản?"}{" "}
              <Link
                href={isLogin ? "/register" : "/login"}
                className="font-bold text-primary hover:underline"
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

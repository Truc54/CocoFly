"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, X } from "lucide-react";
import { Playfair_Display } from "next/font/google";

import { API_URL, authApi } from "@/lib/api";
import { authStorage } from "@/lib/auth-storage";
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
  
  const [toastConfig, setToastConfig] = useState<{ title: string; desc: string } | null>(null);
  const [isClosingToast, setIsClosingToast] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redir = params.get("redirect");
      if (redir) {
        setRedirectUrl(redir);
      }

      let title = "";
      let desc = "";

      if (params.get("verified") === "true") {
        title = "Xác thực thành công!";
        desc = "Tài khoản của bạn đã được xác minh. Bạn có thể đăng nhập bằng tài khoản vừa mới đăng ký.";
      } else if (params.get("reset") === "true") {
        title = "Đặt lại mật khẩu thành công!";
        desc = "Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.";
      }

      if (title) {
        setToastConfig({ title, desc });
        const timerClose = setTimeout(() => setIsClosingToast(true), 7700);
        const timerHide = setTimeout(() => {
          setToastConfig(null);
          setIsClosingToast(false);
        }, 8000);

        const newParams = new URLSearchParams(window.location.search);
        newParams.delete("verified");
        newParams.delete("reset");
        const newSearch = newParams.toString();
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
        window.history.replaceState({ path: newUrl }, "", newUrl);

        return () => {
          clearTimeout(timerClose);
          clearTimeout(timerHide);
        };
      }
    }
  }, []);
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!isLogin && password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (!isLogin && !termsAccepted) {
      setErrorMsg("Bạn cần đồng ý với điều khoản sử dụng và chính sách bảo mật.");
      return;
    }

    setIsLoading(true);
    try {
      if (!isLogin) {
        // Gọi API Register
        await authApi.register({ email, password, fullName });
        // Nếu thành công, lưu email vào localStorage để màn verify-otp có thể lấy
        localStorage.setItem("verification_email", email);
        router.push("/verify-otp");
      } else {
        const data = await authApi.login({ email, password });
        authStorage.setRememberMe(rememberMe);
        authStorage.save(data.accessToken, data.user || {}, data.refreshToken);
        window.dispatchEvent(new Event("auth-change"));
        if (data.user?.role === "admin") {
          router.push("/admin");
        } else {
          if (redirectUrl) {
            router.push(redirectUrl);
          } else {
            router.push("/");
          }
        }
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Có lỗi xảy ra.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative box-border flex min-h-dvh items-start justify-center overflow-hidden px-6 pb-3 pt-5 lg:pb-4 lg:pt-6">
      {/* Success Toast */}
      {toastConfig && (
        <div className={`fixed top-6 right-6 z-50 transition-all duration-300 ${
          isClosingToast ? "animate-out fade-out slide-out-to-right-8" : "animate-in fade-in slide-in-from-right-8"
        }`}>
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-[4px_4px_0px_#059669] p-4 flex items-center gap-3 w-80 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{toastConfig.title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{toastConfig.desc}</p>
            </div>
            <button 
              onClick={() => {
                setIsClosingToast(true);
                setTimeout(() => {
                  setToastConfig(null);
                  setIsClosingToast(false);
                }, 300);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
                src="/logo.png"
                alt="CocoFly Logo"
                width={42}
                height={42}
                className="rounded-md"
              />
              <span className="brand-text text-[2.2rem] leading-none text-primary">CocoFly</span>
            </div>
            <div className="mt-3 rounded-xl border border-primary/15 bg-primary/5 p-1">
              <div className="grid grid-cols-2 gap-1">
                <Link
                  href={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login"}
                  className={`inline-flex h-10 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                    isLogin
                      ? "bg-white text-primary shadow-sm"
                      : "text-primary/75 hover:text-primary"
                  }`}
                >
                  Đăng nhập
                </Link>
                <Link
                  href={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : "/register"}
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
              {errorMsg && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {errorMsg}
                </div>
              )}

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
                    <Input 
                      type="text" 
                      placeholder="Nguyễn Văn A" 
                      className="h-10 pl-10"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                    />
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
                  <Input 
                    type="email" 
                    placeholder="you@example.com" 
                    className="h-10 pl-10" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
                    <Input 
                      type="password" 
                      placeholder="Nhập lại mật khẩu" 
                      className="h-10 pl-10" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required={!isLogin}
                    />
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
                    checked={isLogin ? rememberMe : termsAccepted}
                    onChange={isLogin ? (e) => setRememberMe(e.target.checked) : (e) => setTermsAccepted(e.target.checked)}
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
                      của CocoFly
                    </span>
                  )}
                </label>
                {isLogin && (
                  <Link href="/forgot-password" className="font-semibold text-primary hover:text-primary/80 hover:underline">
                    Quên mật khẩu?
                  </Link>
                )}
              </div>

              <Button className="h-10 w-full text-sm font-bold" size="lg" type="submit" disabled={isLoading}>
                {isLoading ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Tạo tài khoản"}
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

                <div className="flex flex-col gap-3">
                  <a href={redirectUrl ? `${API_URL}/auth/google?redirect=${encodeURIComponent(redirectUrl)}` : `${API_URL}/auth/google`} className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-slate-800 dark:hover:text-slate-50 w-full">
                    <Image
                      src="/auth/google-logo.svg"
                      alt="Google"
                      width={18}
                      height={18}
                      className="size-4.5"
                    />
                    Tiếp tục với Google
                  </a>
                </div>
              </>
            )}

            <p className="text-center text-sm text-slate-600 dark:text-slate-300">
              {isLogin ? "Bạn chưa có tài khoản?" : "Bạn đã có tài khoản?"}{" "}
              <Link
                href={isLogin 
                  ? (redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : "/register") 
                  : (redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login")}
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

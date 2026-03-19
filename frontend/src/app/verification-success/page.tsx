"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["700", "800"],
});

export default function VerificationSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    // Redirect if countdown reaches 0
    if (countdown === 0) {
      router.push("/login");
      return;
    }

    // Set interval to countdown
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, router]);

  return (
    <section className="relative box-border flex min-h-screen items-center justify-center overflow-hidden bg-background-light p-6 dark:bg-background-dark">
      {/* Background Graphic elements */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 aspect-square w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[100px] border-primary-main/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 aspect-square w-[400px] -translate-x-1/2 -translate-y-1/2 animate-spin-slow rounded-full border-2 border-dashed border-primary-main/20" style={{ animationDuration: '40s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="overflow-hidden rounded-none border-4 border-primary-main bg-white shadow-[12px_12px_0px_#E2B9A1] dark:bg-slate-900 dark:shadow-[12px_12px_0px_#4c2d1b]">
          <CardContent className="flex flex-col items-center p-10 text-center">
            
            {/* Success Icon from User */}
            <div className="relative mb-6 flex size-32 items-center justify-center rounded-full bg-green-50 shadow-inner dark:bg-green-900/20 animate-in zoom-in duration-500">
              <div className="absolute inset-0 rounded-full border-4 border-green-200 border-t-green-500 animate-spin" style={{ animationDuration: '3s' }} />
              {/* 
                USER NOTE: Đặt ảnh 2 (khiên xanh) của bạn vào thư mục public và đổi tên thành 'success-icon.png' 
              */}
              <img 
                src="/success-icon.png" 
                alt="Success Verification" 
                className="z-10 h-20 w-20 object-contain drop-shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/190/190411.png'; // Fallback icon
                }}
              />
            </div>

            <h1 className={`${playfairDisplay.className} mb-3 text-3xl font-extrabold text-slate-900 dark:text-white`}>
              Xác thực thành công!
            </h1>
            
            <p className="mb-8 text-base text-slate-600 dark:text-slate-400">
              Tài khoản của bạn đã được bảo vệ. Vui lòng đăng nhập để bắt đầu trải nghiệm cùng COCOFLY.
            </p>

            <div className="w-full space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800">
              <div className="flex items-center justify-center gap-2 font-mono text-sm font-semibold tracking-wide text-primary-main">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-main opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-primary-main"></span>
                </span>
                Tự động chuyển trang sau {countdown}s...
              </div>

              <Button 
                onClick={() => router.push("/login")}
                className="group h-14 w-full rounded-xl border-2 border-primary-main bg-transparent text-lg font-bold text-primary-main transition-colors duration-300 hover:bg-primary-main hover:text-white dark:border-accent-main dark:text-accent-main dark:hover:bg-accent-main dark:hover:text-background-dark"
              >
                <LogIn className="mr-2 size-5" />
                Đăng nhập ngay
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </section>
  );
}

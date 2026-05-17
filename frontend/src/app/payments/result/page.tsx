"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, ArrowRight, Home, Loader2, Package } from "lucide-react";
import Link from "next/link";

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  const isSuccess = searchParams.get("success") === "true";
  const message = searchParams.get("message");
  const paymentId = searchParams.get("paymentId");

  useEffect(() => {
    // Simulate a brief loading state for better UX
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Đang xử lý kết quả giao dịch...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 text-center">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500 ${isSuccess ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
        {isSuccess ? (
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        ) : (
          <XCircle className="w-12 h-12 text-red-500" />
        )}
      </div>

      <h1 className="text-3xl font-bold text-foreground mb-2">
        {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}
      </h1>
      
      <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg">
        {message || (isSuccess ? "Đơn hàng của bạn đã được thanh toán và đang chờ giao." : "Đã có lỗi xảy ra trong quá trình giao dịch. Vui lòng thử lại.")}
      </p>

      {paymentId && (
        <div className="bg-muted px-6 py-3 rounded-lg mb-8 inline-flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Mã giao dịch:</span>
          <span className="font-mono font-medium text-foreground">{paymentId.slice(0, 8).toUpperCase()}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        {isSuccess ? (
          <>
            <Link 
              href="/won-auctions"
              className="flex-1 py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" /> Đơn mua của tôi
            </Link>
            <Link 
              href="/"
              className="flex-1 py-3 px-4 bg-transparent border border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" /> Trang chủ
            </Link>
          </>
        ) : (
          <>
            <button 
              onClick={() => router.back()}
              className="flex-1 py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              Thử lại ngay
            </button>
            <Link 
              href="/won-auctions"
              className="flex-1 py-3 px-4 bg-transparent border border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-all flex items-center justify-center gap-2"
            >
              Quay lại
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      }>
        <ResultContent />
      </Suspense>
    </div>
  );
}

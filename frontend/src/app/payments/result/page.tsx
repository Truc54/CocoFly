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
    if (isSuccess && paymentId) {
      const pendingStr = sessionStorage.getItem("pendingPayment");
      let successData = { paymentId };
      if (pendingStr) {
        successData = { ...JSON.parse(pendingStr), paymentId };
        sessionStorage.removeItem("pendingPayment");
      }
      sessionStorage.setItem("successPayment", JSON.stringify(successData));
      router.replace("/");
    } else {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, paymentId, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Đang xử lý kết quả giao dịch...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-12 max-w-lg w-full text-center animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-700 delay-100 ${isSuccess ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
          {isSuccess ? (
            <CheckCircle2 className="w-12 h-12" />
          ) : (
            <XCircle className="w-12 h-12" />
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-4">
          {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}
        </h1>
        
        <p className="text-slate-500 mb-8 text-base sm:text-lg">
          {message && message !== "Giao dịch thành công" && message !== "Thanh toán thành công" && message !== "Thanh toán thất bại"
            ? message
            : (isSuccess ? "Đơn hàng của bạn đã được thanh toán và đang chờ giao." : "Đã có lỗi xảy ra trong quá trình giao dịch. Vui lòng thử lại.")}
        </p>

        {paymentId && (
          <div className="bg-slate-50 border border-slate-100 px-6 py-4 rounded-xl mb-8 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Mã giao dịch:</span>
            <span className="font-mono font-bold text-slate-800">{paymentId.split('_')[0].slice(0, 8).toUpperCase()}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full">
          {isSuccess ? (
            <>
              <Link 
                href="/won-auctions?tab=won"
                className="w-full py-3.5 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                <Package className="w-5 h-5" /> Xem đơn mua của tôi
              </Link>
              <Link 
                href="/"
                className="w-full py-3.5 px-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" /> Về trang chủ
              </Link>
            </>
          ) : (
            <>
              <button 
                onClick={() => router.back()}
                className="w-full py-3.5 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                Thử lại ngay
              </button>
              <Link 
                href="/won-auctions?tab=won"
                className="w-full py-3.5 px-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                Trở lại danh sách
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      }>
        <ResultContent />
      </Suspense>
    </div>
  );
}

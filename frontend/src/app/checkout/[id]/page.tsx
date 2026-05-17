"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CreditCard, Landmark, ArrowRight, Loader2, CheckCircle2, AlertCircle, ShieldCheck, Trophy } from "lucide-react";
import Image from "next/image";

import { paymentApi } from "@/lib/api";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const auctionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);
  const [error, setError] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"vnpay" | "momo" | "banking">("vnpay");
  const [processing, setProcessing] = useState(false);
  const [bankingInfo, setBankingInfo] = useState<any>(null);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const json = await paymentApi.getByAuctionId(auctionId);
        if (json.success && json.data) {
          setPayment(json.data);
        } else {
          setError(json.message || "Không tìm thấy thanh toán");
        }
      } catch (err: any) {
        setError(err.message || "Không thể tải thông tin thanh toán");
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [auctionId]);

  const handlePayment = async () => {
    if (!payment) return;
    setProcessing(true);
    try {
      const json = await paymentApi.initiate(payment.id, selectedMethod);

      if (json.success) {
        if (json.data.paymentUrl) {
          window.location.href = json.data.paymentUrl;
        } else if (json.data.bankingInfo) {
          setBankingInfo(json.data.bankingInfo);
          setProcessing(false);
        }
      } else {
        alert(json.message || "Khởi tạo thanh toán thất bại");
        setProcessing(false);
      }
    } catch (err: any) {
      alert(err.message || "Khởi tạo thanh toán thất bại");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground">Không thể tải thông tin thanh toán</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Thanh toán an toàn</h1>
            <p className="text-sm text-muted-foreground">Mọi giao dịch đều được bảo vệ bởi CocoFly Escrow</p>
          </div>
        </div>

        {bankingInfo ? (
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <Landmark className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Chuyển khoản thủ công</h2>
            <p className="text-muted-foreground mb-8">Vui lòng chuyển khoản theo thông tin bên dưới. Hệ thống sẽ tự động xác nhận sau 5-10 phút.</p>
            
            <div className="bg-muted rounded-xl p-6 text-left space-y-4 max-w-md mx-auto">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Ngân hàng</p>
                <p className="text-lg font-medium text-foreground">{bankingInfo.bankName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Số tài khoản</p>
                <p className="text-2xl font-bold text-primary tracking-wider">{bankingInfo.accountNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Chủ tài khoản</p>
                <p className="text-lg font-medium text-foreground">{bankingInfo.accountName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Nội dung (Bắt buộc)</p>
                <p className="text-lg font-bold text-orange-500 bg-orange-500/10 inline-block px-3 py-1 rounded-md mt-1">
                  {bankingInfo.content}
                </p>
              </div>
            </div>

            <button 
              onClick={() => router.push('/won-auctions')}
              className="mt-8 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              Tôi đã chuyển khoản
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Phương thức thanh toán */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground mb-4">Chọn phương thức thanh toán</h2>
                
                <div className="space-y-3">
                  {/* VNPay */}
                  <label className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedMethod === 'vnpay' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <input type="radio" name="paymentMethod" value="vnpay" checked={selectedMethod === 'vnpay'} onChange={() => setSelectedMethod('vnpay')} className="sr-only" />
                    <div className="w-12 h-12 bg-[#005BAA] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">VNPAY</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Ví VNPAY / Thẻ ATM / Visa</h3>
                      <p className="text-sm text-muted-foreground">Thanh toán an toàn qua cổng VNPAY</p>
                    </div>
                    {selectedMethod === 'vnpay' && <CheckCircle2 className="w-6 h-6 text-primary" />}
                  </label>

                  {/* MoMo */}
                  <label className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedMethod === 'momo' ? 'border-[#A50064] bg-[#A50064]/5' : 'border-border hover:border-[#A50064]/50'}`}>
                    <input type="radio" name="paymentMethod" value="momo" checked={selectedMethod === 'momo'} onChange={() => setSelectedMethod('momo')} className="sr-only" />
                    <div className="w-12 h-12 bg-[#A50064] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">MoMo</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Ví điện tử MoMo</h3>
                      <p className="text-sm text-muted-foreground">Thanh toán siêu tốc qua ứng dụng MoMo</p>
                    </div>
                    {selectedMethod === 'momo' && <CheckCircle2 className="w-6 h-6 text-[#A50064]" />}
                  </label>

                  {/* Banking */}
                  <label className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedMethod === 'banking' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <input type="radio" name="paymentMethod" value="banking" checked={selectedMethod === 'banking'} onChange={() => setSelectedMethod('banking')} className="sr-only" />
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Landmark className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Chuyển khoản thủ công</h3>
                      <p className="text-sm text-muted-foreground">Xác nhận trong 5-10 phút</p>
                    </div>
                    {selectedMethod === 'banking' && <CheckCircle2 className="w-6 h-6 text-primary" />}
                  </label>
                </div>
              </div>
            </div>

            {/* Tóm tắt đơn hàng */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm sticky top-8">
                <h2 className="text-lg font-semibold text-foreground mb-4">Tóm tắt đơn hàng</h2>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0 relative">
                    {/* Placeholder or real image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                    <Trophy className="absolute inset-0 m-auto w-8 h-8 text-primary/50" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-foreground line-clamp-2">{payment.auction?.item?.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Mã TT: #{payment.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Giá thắng thầu</span>
                    <span className="font-medium text-foreground">{Number(payment.amount).toLocaleString()}₫</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phí nền tảng (5%)</span>
                    <span className="font-medium text-foreground">Đã bao gồm</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span className="font-medium text-green-500">Miễn phí</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex justify-between items-end mb-6">
                    <span className="text-base font-semibold text-foreground">Tổng cộng</span>
                    <span className="text-2xl font-bold text-primary">{Number(payment.amount).toLocaleString()}₫</span>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={processing}
                    className="w-full py-3.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {processing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Thanh toán ngay <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Giao dịch được bảo vệ an toàn
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

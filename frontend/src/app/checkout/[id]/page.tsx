"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CreditCard, Landmark, ArrowRight, Loader2, CheckCircle2, AlertCircle, ShieldCheck, Trophy } from "lucide-react";
import Image from "next/image";

import { paymentApi, userApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const auctionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);
  const [error, setError] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"vnpay" | "momo">("vnpay");
  const [processing, setProcessing] = useState(false);
  const [bankingInfo, setBankingInfo] = useState<any>(null);

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [initialAddress, setInitialAddress] = useState("");
  const [initialPhone, setInitialPhone] = useState("");
  const [addressError, setAddressError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paymentRes, addressRes] = await Promise.all([
          paymentApi.getByAuctionId(auctionId),
          userApi.getAddress().catch(() => ({ success: false, data: null }))
        ]);

        if (paymentRes.success && paymentRes.data) {
          setPayment(paymentRes.data);
        } else {
          setError(paymentRes.message || "Không tìm thấy thanh toán");
        }

        if (addressRes && addressRes.success && addressRes.data) {
          setAddress(addressRes.data.addressLine);
          setPhone(addressRes.data.phone);
          setInitialAddress(addressRes.data.addressLine);
          setInitialPhone(addressRes.data.phone);
        }
      } catch (err: any) {
        setError(err.message || "Không thể tải thông tin");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [auctionId]);

  const handlePayment = async () => {
    if (!payment) return;

    setAddressError("");
    setPhoneError("");
    let isValid = true;

    if (!phone.trim()) {
      setPhoneError("Vui lòng nhập số điện thoại liên hệ.");
      isValid = false;
    } else if (!/^[0-9]{10,11}$/.test(phone.replace(/\s+/g, ''))) {
      setPhoneError("Số điện thoại không hợp lệ.");
      isValid = false;
    }

    if (!address.trim()) {
      setAddressError("Vui lòng nhập địa chỉ giao hàng.");
      isValid = false;
    } else if (address.trim().length < 5) {
      setAddressError("Địa chỉ giao hàng quá ngắn.");
      isValid = false;
    }

    if (!isValid) return;

    setProcessing(true);
    try {
      // Chỉ lưu vào DB nếu đây là lần đầu tiên (chưa từng có data cũ)
      if (!initialAddress && !initialPhone) {
        try {
          await userApi.saveAddress(address, phone);
        } catch (saveErr: any) {
          toast.error(`Lỗi lưu địa chỉ: ${saveErr.message}`);
          setProcessing(false);
          return; // Dừng thanh toán nếu không lưu được địa chỉ
        }
      }

      // Lưu thông tin tạm để hiển thị popup ở trang chủ
      const paymentData = {
        itemName: payment.auction?.item?.title || "Sản phẩm đấu giá",
        imageUrl: payment.auction?.item?.media?.[0]?.cdnUrl || "/placeholder.png",
        amount: payment.amount,
      };
      sessionStorage.setItem("pendingPayment", JSON.stringify(paymentData));

      const json = await paymentApi.initiate(payment.id, selectedMethod, { addressLine: address, phone });

      if (json.success) {
        if (json.data.paymentUrl) {
          window.location.href = json.data.paymentUrl;
        } else if (json.data.bankingInfo) {
          setBankingInfo(json.data.bankingInfo);
          setProcessing(false);
        }
      } else {
        toast.error(json.message || "Khởi tạo thanh toán thất bại");
        setProcessing(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Khởi tạo thanh toán thất bại");
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

  const isExpired = payment && (
    payment.status === 'failed' ||
    (payment.paymentDeadline && new Date() > new Date(payment.paymentDeadline)) ||
    (!payment.paymentDeadline && 
      (payment.auction?.endTime 
        ? new Date() > new Date(new Date(payment.auction.endTime).getTime() + 48 * 60 * 60 * 1000)
        : payment.createdAt && new Date() > new Date(new Date(payment.createdAt).getTime() + 48 * 60 * 60 * 1000)
      )
    )
  );

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12">
        <div className="text-center p-8 bg-white border-2 border-slate-200 rounded-2xl shadow-[6px_6px_0px_#E2B9A1] max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Thanh toán đã hết hạn</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Thời hạn thanh toán 48 giờ cho sản phẩm này đã kết thúc. Giao dịch đã bị đóng và bạn không thể thực hiện thanh toán.
          </p>
          <button
            onClick={() => router.back()}
            className="w-full py-3 bg-[#E25C24] hover:bg-[#c94d1b] text-white font-bold rounded-xl transition-all shadow-[3px_3px_0px_#E2B9A1] hover:-translate-y-0.5"
          >
            Quay lại
          </button>
        </div>
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
        {bankingInfo ? (
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <Landmark className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Chuyển khoản ngân hàng</h2>
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
              className="mt-8 px-6 py-3 bg-[#0066FF] text-white font-bold rounded-full shadow-[4px_4px_0px_#bfdbfe] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#bfdbfe] active:translate-y-0 active:shadow-[2px_2px_0px_#bfdbfe] transition-all"
            >
              Tôi đã chuyển khoản
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Thông tin giao hàng */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground mb-4">Thông tin nhận hàng</h2>
                
                <div className="space-y-5">
                  <div>
                    <div className="mb-1.5">
                      <label className="block text-sm font-medium text-foreground mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                      {phoneError && <span className="text-sm text-red-500 font-medium block">{phoneError}</span>}
                    </div>
                    <div className={`flex items-center bg-slate-50 border-2 rounded-xl px-1 py-1 shadow-[3px_3px_0px_#E2B9A1] transition-all ${phoneError ? 'border-red-500' : 'border-slate-200'}`}>
                      <input 
                        type="tel" 
                        value={phone} 
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (phoneError) setPhoneError("");
                        }} 
                        placeholder="Nhập số điện thoại liên hệ" 
                        className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-slate-400 min-w-0"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5">
                      <label className="block text-sm font-medium text-foreground mb-1">Địa chỉ giao hàng <span className="text-red-500">*</span></label>
                      {addressError && <span className="text-sm text-red-500 font-medium block">{addressError}</span>}
                    </div>
                    <div className={`flex items-center bg-slate-50 border-2 rounded-xl px-1 py-1 shadow-[3px_3px_0px_#E2B9A1] transition-all ${addressError ? 'border-red-500' : 'border-slate-200'}`}>
                      <input 
                        type="text" 
                        value={address} 
                        onChange={(e) => {
                          setAddress(e.target.value);
                          if (addressError) setAddressError("");
                        }} 
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố" 
                        className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-slate-400 min-w-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground mb-4">Chọn phương thức thanh toán</h2>
                
                <div className="space-y-3">
                  {/* VNPay */}
                  <label className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedMethod === 'vnpay' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <input type="radio" name="paymentMethod" value="vnpay" checked={selectedMethod === 'vnpay'} onChange={() => setSelectedMethod('vnpay')} className="sr-only" />
                    <div className="w-12 h-12 bg-white border rounded-lg flex items-center justify-center flex-shrink-0">
                      <Image src="/payment_logo/vnpay_logo.png" alt="VNPAY" width={40} height={40} className="object-contain" />
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
                    <div className="w-12 h-12 bg-white border rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <Image src="/payment_logo/Momo_logo.svg" alt="MoMo" width={48} height={48} className="object-cover w-full h-full" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Ví điện tử MoMo</h3>
                      <p className="text-sm text-muted-foreground">Thanh toán siêu tốc qua ứng dụng MoMo</p>
                    </div>
                    {selectedMethod === 'momo' && <CheckCircle2 className="w-6 h-6 text-[#A50064]" />}
                  </label>

                </div>
              </div>
            </div>

            {/* Tóm tắt đơn hàng */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground mb-4">Tóm tắt đơn hàng</h2>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0 relative">
                    <Image
                      src={payment.auction?.item?.media?.[0]?.cdnUrl || 'https://placehold.co/400x300/f1f5f9/94a3b8?text=No+Image'}
                      alt={payment.auction?.item?.title || 'Thumbnail'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
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
                    <span className="text-2xl font-bold text-orange-600 dark:text-orange-500">{Number(payment.amount).toLocaleString()}₫</span>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={processing}
                    className="w-full py-3.5 px-4 bg-[#0066FF] text-white font-bold rounded-full shadow-[4px_4px_0px_#bfdbfe] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#bfdbfe] active:translate-y-0 active:shadow-[2px_2px_0px_#bfdbfe] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Thanh toán ngay <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

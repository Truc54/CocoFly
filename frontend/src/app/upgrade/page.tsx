"use client";

import React, { useState } from "react";
import {
  ArrowUpCircle,
  ShieldCheck,
  Store,
  TrendingUp,
  Gavel,
  CheckCircle2,
  Phone,
  Loader2,
  PartyPopper,
} from "lucide-react";

// ─── Step indicator ──────────────────────────────────────────────────────────
function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = ["Giới thiệu", "Số điện thoại", "Nhập OTP", "Hoàn tất"];
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                ${isDone ? "bg-emerald-500 text-white" : isActive ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : "bg-muted text-muted-foreground"}`}>
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
            </div>
            {i < 3 && (
              <div className={`w-8 h-0.5 rounded-full mb-4 transition-colors ${isDone ? "bg-emerald-500" : "bg-muted"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Benefit Item ────────────────────────────────────────────────────────────
function BenefitItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 dark:bg-muted/30">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function UpgradePage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 min
  const [isSuccess, setIsSuccess] = useState(false);

  // ── OTP input handler ──
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  // ── Simulate send OTP ──
  const handleSendOtp = () => {
    if (phone.length < 9) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
      // Start countdown
      let t = 300;
      const interval = setInterval(() => {
        t--;
        setCountdown(t);
        if (t <= 0) clearInterval(interval);
      }, 1000);
    }, 1500);
  };

  // ── Simulate verify OTP ──
  const handleVerifyOtp = () => {
    const code = otp.join("");
    if (code.length < 6) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(4);
      setIsSuccess(true);
    }, 1500);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-background flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-sm">

          <StepIndicator currentStep={step} />

          {/* ── Step 1: Giới thiệu lợi ích ──────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ArrowUpCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Nâng cấp lên Seller</h2>
                <p className="text-sm text-muted-foreground mt-1">Mở khóa khả năng đấu giá và bán hàng</p>
              </div>

              <BenefitItem
                icon={<Store className="w-4 h-4" />}
                title="Tạo phiên đấu giá"
                desc="Đăng sản phẩm và tổ chức đấu giá trực tuyến"
              />
              <BenefitItem
                icon={<TrendingUp className="w-4 h-4" />}
                title="Tiếp cận hàng ngàn người mua"
                desc="Sản phẩm hiển thị cho cộng đồng COCOFLY"
              />
              <BenefitItem
                icon={<Gavel className="w-4 h-4" />}
                title="Quản lý đấu giá chuyên nghiệp"
                desc="Dashboard theo dõi đơn hàng và thanh toán"
              />
              <BenefitItem
                icon={<ShieldCheck className="w-4 h-4" />}
                title="Thanh toán an toàn"
                desc="Hệ thống Escrow bảo vệ cả người mua và bán"
              />

              <button
                onClick={() => setStep(2)}
                className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Bắt đầu xác thực
              </button>
            </div>
          )}

          {/* ── Step 2: Nhập SĐT ────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Xác thực số điện thoại</h2>
                <p className="text-sm text-muted-foreground mt-1">Nhập SĐT để nhận mã OTP qua Zalo</p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Số điện thoại</label>
                <div className="flex gap-2">
                  <span className="flex items-center justify-center px-3 rounded-lg border border-input bg-muted text-sm font-medium text-muted-foreground">
                    +84
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="909 123 456"
                    maxLength={10}
                    className="flex-1 h-11 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={phone.length < 9 || isLoading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <svg viewBox="0 0 48 48" className="w-5 h-5" fill="currentColor">
                      <path d="M24 4C12.95 4 4 12.95 4 24c0 4.15 1.27 8 3.43 11.19L4 44l9.19-3.43C16 42.73 19.85 44 24 44c11.05 0 20-8.95 20-20S35.05 4 24 4z" />
                    </svg>
                    Gửi OTP qua Zalo
                  </>
                )}
              </button>

              <button onClick={() => setStep(1)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                ← Quay lại
              </button>
            </div>
          )}

          {/* ── Step 3: Nhập OTP ─────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-foreground">Nhập mã xác thực</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Mã 6 số đã gửi đến <span className="font-semibold text-foreground">+84 {phone}</span>
                </p>
              </div>

              {/* OTP Inputs */}
              <div className="flex justify-center gap-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-input bg-transparent outline-none
                      focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                ))}
              </div>

              {/* Countdown Timer */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Mã hết hạn sau <span className="font-semibold text-foreground">{formatTime(countdown)}</span>
                  </p>
                ) : (
                  <button className="text-sm font-medium text-primary hover:underline">
                    Gửi lại mã OTP
                  </button>
                )}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otp.join("").length < 6 || isLoading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác nhận"}
              </button>

              <button onClick={() => setStep(2)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                ← Đổi số điện thoại
              </button>
            </div>
          )}

          {/* ── Step 4: Thành công ───────────────────────────────────── */}
          {step === 4 && (
            <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-foreground">🎉 Chúc mừng!</h2>
                <p className="text-sm text-muted-foreground mt-1">Bạn đã trở thành <span className="font-semibold text-emerald-600">SELLER</span> trên COCOFLY</p>
              </div>

              <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20">
                <p className="text-sm text-foreground">
                  Bây giờ bạn có thể tạo phiên đấu giá, quản lý sản phẩm và nhận thanh toán qua hệ thống Escrow an toàn.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <a
                  href="/my-listings"
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-center"
                >
                  Bắt đầu đăng sản phẩm
                </a>
                <a
                  href="/"
                  className="w-full py-3 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors text-center"
                >
                  Về trang chủ
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

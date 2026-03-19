"use client";

import { useState, useRef, KeyboardEvent, ClipboardEvent } from "react";
import { Input } from "@/components/ui/input";

type OtpInputProps = {
  length?: number;
  onComplete?: (otp: string) => void;
};

export default function OtpInput({ length = 6, onComplete }: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    // Take only the last character if multiple are typed somehow
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    const completeOtp = newOtp.join("");
    if (completeOtp.length === length && onComplete) {
      onComplete(completeOtp);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, length);
    
    if (!pastedData) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);

    // Focus on the next empty input or the last one
    const focusIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[focusIndex]?.focus();

    if (pastedData.length === length && onComplete) {
      onComplete(newOtp.join(""));
    }
  };

  return (
    <div className="flex w-full justify-between gap-2 sm:gap-3">
      {otp.map((data, index) => (
        <Input
          key={index}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={data}
          ref={(el) => { inputRefs.current[index] = el; }}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="h-12 w-10 px-0 sm:h-14 sm:w-12 text-center text-xl sm:text-2xl font-bold text-primary transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 
          shadow-[2px_2px_0px_#8f5c38] focus:shadow-[4px_4px_0px_#8f5c38] focus:-translate-y-0.5 rounded-none border-2 border-slate-300 dark:bg-slate-900 dark:border-slate-700"
        />
      ))}
    </div>
  );
}

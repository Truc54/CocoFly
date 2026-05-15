"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  endTime: string;
}

export default function CountdownTimer({ endTime }: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(() => {
    const diff = Math.floor((new Date(endTime).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.floor((new Date(endTime).getTime() - Date.now()) / 1000);
      setSeconds(Math.max(0, diff));
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const isUrgent = seconds > 0 && seconds <= 60;
  const isCritical = seconds > 0 && seconds <= 10;

  const blockClasses = `flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-none font-bold text-base sm:text-lg tabular-nums transition-colors duration-300 border-2 ${
    isUrgent
      ? "bg-red-50 text-red-600 border-red-500 shadow-[3px_3px_0px_#ef4444]"
      : "bg-white text-slate-800 border-slate-200 shadow-[3px_3px_0px_#cbd5e1] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
  }`;

  if (seconds <= 0) {
    return (
      <div className="flex items-center gap-1 text-sm font-bold text-red-600">
        <span className="material-symbols-outlined text-lg">timer_off</span>
        Đã kết thúc
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${isCritical ? "animate-shake" : ""}`}>
      <div className={blockClasses}>{h.toString().padStart(2, "0")}</div>
      <span className="text-lg font-bold self-center text-slate-400">:</span>
      <div className={blockClasses}>{m.toString().padStart(2, "0")}</div>
      <span className="text-lg font-bold self-center text-slate-400">:</span>
      <div className={`${blockClasses} ${isUrgent ? "animate-pulse" : ""}`}>
        {s.toString().padStart(2, "0")}
      </div>
    </div>
  );
}

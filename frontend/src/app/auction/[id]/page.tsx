"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, use } from "react";

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const MOCK_AUCTIONS: Record<string, {
  id: string;
  title: string;
  category: string;
  currentPrice: string;
  currentPriceNum: number;
  startPrice: string;
  totalSeconds: number; // For countdown simulation
  totalBids: number;
  activeBidders: number;
  seller: string;
  sellerVerified: boolean;
  images: string[];
  description: string;
  condition: string;
}> = {
  "1": {
    id: "1",
    title: "iPhone 15 Pro Max 256GB",
    category: "Công nghệ",
    currentPrice: "25.000.000đ",
    currentPriceNum: 25000000,
    startPrice: "20.000.000đ",
    totalSeconds: 262, // 04:22
    totalBids: 47,
    activeBidders: 18,
    seller: "TechStore Official",
    sellerVerified: true,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA4a25dDQ7_BoHv9jPPsBrzK8pCoacotFh4rj2EbadQxLUZJb6cgm2WFrulnz_oKYWUlVRqhJe9VDK-qcvsbchTduj7uebB3DwpLruZAcw0v5XwX5ludpx35uPPsRWjFevZX7F9jPJZtqyt679m-wzBmEMQrmwKUnZn1-heHLZXIwSqyiX6AY15BkBf6oEajTicPzqGnNPTklzu3fwA90fP0zn0vCO6pZQpQFblj7XIjWuIDXeMNLv-Ws9z5eR_zVO0k7Oj-CKhRrbk",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBYfyyLXiyVQPUR0qZVHlXkqxdAsOBOwe6p7_woDvvJRR8KbKSTiT4my1PLt7bE3ttDdAzIs4DaP5GV7j7mwc6sURi2Tl-GZ_8AWYf-eKXEtytJNrxHHrkrQdQXcQrdL9dl5v5aZK9PbMGZ5pdU_1zks08kqgIuhtPofoMVr9fZGR7j5SNJ5aSeb08mTV2pIWw-0-RpF_o5wFU2GkuovVYbyPIxLmLhvCvRZnOW04h0zVV8rdM-xH8BOFz1JwQJqkPVAngodA5A-V4R",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAzpD9mw1WAy6OfuYXKy7PrdKT94ud97mMOwQvIdBpK2CiQy28GlqZualekmgAs6aUTkXVjjd_1hQEwB7RMkPSQG3HX0ioanafptmihC7wzEN_OzRzSS4RbCFbkxYEeMqrBv7KPJLksJFdOzbvAonqD1RB-kETQ9d02LgzvXvSlIxWWJISfZV1BF0aM9WrMgos-qn9rCRXT5OZcu5EP9M7QyeXIRBBMIUGGccVXJn4t0WLBIeMC8xD_uDJhVqg6kT-mTqZUvF9IQbtO"
    ],
    description: "iPhone 15 Pro Max chính hãng Apple, full box, mới 100%. Màn hình Super Retina XDR 6.7 inch, chip A17 Pro, camera 48MP. Bảo hành 12 tháng tại các trung tâm uỷ quyền Apple.",
    condition: "Mới 100% - Nguyên seal, Full Box, phụ kiện đầy đủ theo máy.",
  },
  "2": {
    id: "2",
    title: "MacBook Pro M3 14 inch",
    category: "Công nghệ",
    currentPrice: "45.000.000đ",
    currentPriceNum: 45000000,
    startPrice: "38.000.000đ",
    totalSeconds: 58, // 00:58 (Urgency Test)
    totalBids: 32,
    activeBidders: 12,
    seller: "Luxury Store",
    sellerVerified: true,
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBYfyyLXiyVQPUR0qZVHlXkqxdAsOBOwe6p7_woDvvJRR8KbKSTiT4my1PLt7bE3ttDdAzIs4DaP5GV7j7mwc6sURi2Tl-GZ_8AWYf-eKXEtytJNrxHHrkrQdQXcQrdL9dl5v5aZK9PbMGZ5pdU_1zks08kqgIuhtPofoMVr9fZGR7j5SNJ5aSeb08mTV2pIWw-0-RpF_o5wFU2GkuovVYbyPIxLmLhvCvRZnOW04h0zVV8rdM-xH8BOFz1JwQJqkPVAngodA5A-V4R"
    ],
    description: "MacBook Pro 14 inch với chip M3, RAM 18GB, SSD 512GB. Màn hình Liquid Retina XDR, hiệu năng vượt trội cho mọi tác vụ chuyên nghiệp.",
    condition: "Mới 100% - Nguyên seal, Full Box.",
  },
};

const ALL_AUCTIONS = [
  { id: "3", title: "Sony WH-1000XM5", category: "Công nghệ", price: "6.200.000đ", timeLeft: "01:45:00", activeBidders: 8, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQfvUXFE65sSLZ2IXh0jKTKiqGW4HteCjaoIn7nPOkGZNb5QY7sWC3sRN6dOcsj5qxLrv8pzi1X7AF5OY1aIWG7fDhdEeatxkhBwU6WZ6lHdl3ftwotVAah-JW87rkNkasem5pseRcGFB4iHteLu0lYk_45v9JdomFCJxhFTq1UAfSQs8Z5V8-6FS8fEG7TUwUGd8OrflCQ2-fvL7ivCoTYN_yQf38Vv92l5MqfYrrdzlQxJbKmP1X4FMc7ze2KHtfqgPQuW-94k00" },
  { id: "6", title: "iPad Pro M2 12.9", category: "Công nghệ", price: "22.500.000đ", timeLeft: "05:55:10", activeBidders: 15, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzpD9mw1WAy6OfuYXKy7PrdKT94ud97mMOwQvIdBpK2CiQy28GlqZualekmgAs6aUTkXVjjd_1hQEwB7RMkPSQG3HX0ioanafptmihC7wzEN_OzRzSS4RbCFbkxYEeMqrBv7KPJLksJFdOzbvAonqD1RB-kETQ9d02LgzvXvSlIxWWJISfZV1BF0aM9WrMgos-qn9rCRXT5OZcu5EP9M7QyeXIRBBMIUGGccVXJn4t0WLBIeMC8xD_uDJhVqg6kT-mTqZUvF9IQbtO" },
  { id: "7", title: "Samsung Galaxy S24 Ultra", category: "Công nghệ", price: "28.500.000đ", timeLeft: "03:45:20", activeBidders: 10, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbZbZhHzJfOF8mkjtpCNGgFz9N_NW80stwh0Os0lT6cLlYbq8xTT9kVUszUf9Ijrpw7xExty70sxJnDdmyxUoKa81byc5-NTlDlKFqiMaRaFxGFTfRJBNwZe1aG2iLlILRXLJ7bm2iAcNJ0q3zU-egL6BByZgbnKbjiP22qGNOucnBbjhAzY38ZoFA3L9d5Q1r76qWA_fqWPRv6WLrpVU0dm8Lp-9BOLhn31yTae1Dk6ARXx-P1gvGJcud16WumgW1ib5mYx3TfwNQ" },
  { id: "4", title: "Đồng hồ Rolex Daytona", category: "Thời trang", price: "1.250.000.000đ", timeLeft: "06:30:45", activeBidders: 24, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQ1_eZdI7SfaLzXHrLPFejTE5oq_79VOkahGxTCaX7UsFYdPij7bFQlF91NATxViIfo1_O54JfK8p4I44cmz_pjT8Up-6lKkCR5bCMGeUpoBNJL5hVjR7xlzeaF040eybKWaAqFd2OQ7Dz-Lp2UVGpt-w7HVHumwUlLHHTKkcjpY_8ZNwiGpy5ZGCK5Uqukw0KwlrXJzWm3SJDOOZAaT0yH0TcSo6563uyZmg4rrsecm12BEzT1PBiSTQBZLNBAWBnL5E_t0lH33ip" },
];

const CHAT_MESSAGES = [
  { id: 1, type: "bid", user: "Nam H.", amount: "25.000.000đ", time: "2 phút trước", avatar: "N" },
  { id: 2, type: "chat", user: "Minh Trần", message: "Sản phẩm còn bảo hành Apple Care không shop ơi?", time: "5 phút", avatar: "M" },
  { id: 3, type: "bid", user: "Linh B.", amount: "24.500.000đ", time: "5 phút trước", avatar: "L" },
  { id: 4, type: "chat", user: "Thanh Hương", message: "Đẹp quá, mình theo con này!", time: "12 phút", avatar: "T" },
  { id: 5, type: "bid", user: "Quốc Anh", amount: "24.000.000đ", time: "8 phút trước", avatar: "Q" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getAuction(id: string) {
  return MOCK_AUCTIONS[id] || MOCK_AUCTIONS["1"];
}

function getRelatedAuctions(currentId: string, category: string) {
  return ALL_AUCTIONS.filter((a) => a.category === category && a.id !== currentId).slice(0, 4);
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function CountdownTimer({ initialSeconds }: { initialSeconds: number }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <div className={`flex gap-2 ${isCritical ? "animate-shake" : ""}`}>
      <div className={blockClasses}>{h.toString().padStart(2, '0')}</div>
      <span className="text-lg font-bold self-center text-slate-400">:</span>
      <div className={blockClasses}>{m.toString().padStart(2, '0')}</div>
      <span className="text-lg font-bold self-center text-slate-400">:</span>
      <div className={`${blockClasses} ${isUrgent ? "animate-pulse" : ""}`}>
        {s.toString().padStart(2, '0')}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const auction = getAuction(id);
  const relatedAuctions = getRelatedAuctions(auction.id, auction.category);

  // Mocks for interaction
  const [chatMessage, setChatMessage] = useState("");
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  
  // Mock states for bid UX
  const [isLeading, setIsLeading] = useState<boolean | null>(null);
  const [showPriceAlert, setShowPriceAlert] = useState(true);
  
  const suggestedPrice = auction.currentPriceNum + 500000;

  const handleBid = () => {
    setIsLeading(true);
    setShowPriceAlert(false);
    // Simulate being outbid after 5 seconds
    setTimeout(() => {
      setIsLeading(false);
    }, 5000);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-medium">
        <Link href="/" className="hover:text-primary transition-colors cursor-pointer">Trang chủ</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link href="/live" className="hover:text-primary transition-colors cursor-pointer">{auction.category}</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-primary truncate max-w-xs">{auction.title}</span>
      </nav>

      {/* Grid: approx 58:42 is col-7:col-5 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN (Content & Gallery)                          */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Photo Gallery (Neo-brutalist style) */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[4/3] bg-white dark:bg-slate-800 rounded-none border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-[4px_4px_0px_#E2B9A1] group">
              <Image
                src={auction.images[activeImageIdx]}
                alt={auction.title}
                fill
                className="object-contain p-4"
                unoptimized
              />
              
              {auction.images.length > 1 && (
                <>
                  <button 
                    onClick={() => setActiveImageIdx(prev => prev > 0 ? prev - 1 : auction.images.length - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white border-2 border-slate-800 rounded-full flex items-center justify-center text-slate-800 shadow-[2px_2px_0px_#1e293b] opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button 
                    onClick={() => setActiveImageIdx(prev => prev < auction.images.length - 1 ? prev + 1 : 0)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white border-2 border-slate-800 rounded-full flex items-center justify-center text-slate-800 shadow-[2px_2px_0px_#1e293b] opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </>
              )}

              <div className="absolute bottom-3 right-3 bg-white border-2 border-slate-800 text-slate-800 text-xs font-bold px-2 py-1 rounded-none shadow-[2px_2px_0px_#1e293b]">
                {activeImageIdx + 1} / {auction.images.length}
              </div>
            </div>
            
            {/* Thumbnails */}
            {auction.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 pt-1">
                {auction.images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-[72px] h-[72px] shrink-0 rounded-none border-2 transition-all cursor-pointer ${
                      activeImageIdx === idx 
                        ? "border-primary shadow-[3px_3px_0px_#8f5c38] scale-100" 
                        : "border-slate-200 opacity-80 hover:opacity-100 hover:shadow-[3px_3px_0px_#cbd5e1] scale-95 hover:scale-100"
                    }`}
                  >
                    <Image src={img} alt={`Thumb ${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Seller Info */}
          <div className="flex items-center gap-4 p-4 border-2 border-slate-200 shadow-[4px_4px_0px_#cbd5e1] bg-white dark:bg-slate-800 dark:border-slate-700">
            <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-slate-800 flex items-center justify-center text-xl font-bold shrink-0 text-slate-800">
              {auction.seller.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-slate-800 dark:text-white">{auction.seller}</h3>
                {auction.sellerVerified && <span className="material-symbols-outlined text-blue-500 text-[18px]">verified</span>}
              </div>
              <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                <span className="material-symbols-outlined text-yellow-500 text-[16px]">star</span>
                <span className="font-bold">4.9</span>
                <span>(128 đánh giá)</span>
              </div>
            </div>
            <button className="px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 font-bold flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#bfdbfe] hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">chat</span>
              Nhắn tin
            </button>
          </div>

          {/* Product Details Accordion */}
          <div className="space-y-4 pt-4">
            <details open className="bg-white dark:bg-slate-800 rounded-none border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#cbd5e1] group">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none outline-none select-none">
                <span className="flex items-center gap-2 font-bold text-slate-800 dark:text-white uppercase tracking-wide text-sm">
                  <span className="material-symbols-outlined text-primary">info</span>
                  Mô tả sản phẩm
                </span>
                <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t-2 border-slate-100 dark:border-slate-700 pt-4">
                {auction.description}
              </div>
            </details>

            <details className="bg-white dark:bg-slate-800 rounded-none border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#cbd5e1] group">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none outline-none select-none">
                <span className="flex items-center gap-2 font-bold text-slate-800 dark:text-white uppercase tracking-wide text-sm">
                  <span className="material-symbols-outlined text-primary">verified</span>
                  Tình trạng
                </span>
                <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t-2 border-slate-100 dark:border-slate-700 pt-4">
                {auction.condition}
              </div>
            </details>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN (Bidding & Chat)                            */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Header Info & Title */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-tight">
                {auction.title}
              </h1>
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">visibility</span> 
                <span className="text-base">{auction.activeBidders}</span>
              </span>
            </div>
          </div>

          {/* 1. BIDDING ENGINE BOX */}
          <div className="bg-white dark:bg-slate-800 rounded-none border-2 border-slate-200 dark:border-slate-700 p-6 shadow-[4px_4px_0px_#E2B9A1]">
            <div className="mb-6">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tabular-nums">
                  {auction.currentPriceNum.toLocaleString("vi-VN")} <span className="text-lg sm:text-xl text-slate-500 font-bold">VNĐ</span>
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t-2 border-slate-100 dark:border-slate-700 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  Kết thúc lúc 20:00, 25/11/2026
                </p>
                <CountdownTimer initialSeconds={auction.totalSeconds} />
              </div>
            </div>

            {/* Single Bid Input (Neo-brutalist) */}
            <div className="relative mb-5">
              <input
                type="text"
                placeholder={`Nhập giá (Tối thiểu ${suggestedPrice.toLocaleString('vi-VN')} VNĐ)`}
                className="w-full pl-4 pr-12 py-3 bg-white border-2 border-slate-300 rounded-none text-base font-bold text-slate-800 focus:border-slate-400 focus:ring-0 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal shadow-[inset_2px_2px_0px_#f1f5f9]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">VNĐ</span>
            </div>

            {/* CTA Button */}
            <div className="space-y-3">
              <button 
                onClick={handleBid}
                className="w-full py-3 bg-[#0066FF] text-white font-bold text-base rounded-full border-2 border-[#0066FF] shadow-[4px_4px_0px_#bfdbfe] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#bfdbfe] active:translate-y-0 active:shadow-[2px_2px_0px_#bfdbfe] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                ĐẶT GIÁ NGAY
              </button>
              
              <button 
                className="w-full py-3 bg-white text-slate-700 font-bold text-base rounded-full border-2 border-slate-200 shadow-[3px_3px_0px_#cbd5e1] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#cbd5e1] active:translate-y-0 active:shadow-[1px_1px_0px_#cbd5e1] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">favorite</span>
                Thêm vào yêu thích
              </button>
            </div>

            {/* Status Feedback */}
            {isLeading === true && (
              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-green-700 bg-green-50 border-2 border-green-200 py-3 rounded-none font-bold shadow-[3px_3px_0px_#86efac] animate-in fade-in zoom-in-95">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                Bạn đang dẫn đầu phiên đấu giá!
              </div>
            )}
            {isLeading === false && (
              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-red-700 bg-red-50 border-2 border-red-200 py-3 rounded-none font-bold shadow-[3px_3px_0px_#fca5a5] animate-in fade-in zoom-in-95">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                Bạn vừa bị vượt giá! Đặt lại ngay.
              </div>
            )}
          </div>

          {/* 2. LIVE CHAT BOX */}
          <div className="bg-white dark:bg-slate-800 rounded-none border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] flex flex-col h-[550px]">
            {/* Header */}
            <div className="p-4 border-b-2 border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-800">
              <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white uppercase tracking-wide text-sm">
                <span className="material-symbols-outlined text-primary">forum</span>
                Live Chat & Lịch sử
              </h3>
              <div className="flex items-center gap-1.5 bg-white text-green-600 text-[10px] font-bold px-2 py-1 border-2 border-green-200 shadow-[2px_2px_0px_#bbf7d0]">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                LIVE
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-white dark:bg-slate-800">
              {CHAT_MESSAGES.map((msg) => {
                const isBid = msg.type === "bid";
                return (
                  <div key={msg.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                      isBid 
                        ? "bg-orange-50 border-orange-200 text-orange-600 shadow-[2px_2px_0px_#fed7aa]" 
                        : "bg-white border-slate-200 text-slate-500 shadow-[2px_2px_0px_#cbd5e1]"
                    }`}>
                      {isBid ? <span className="material-symbols-outlined text-sm">gavel</span> : msg.avatar}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-slate-800 dark:text-white">{msg.user}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{msg.time}</span>
                      </div>
                      
                      {isBid ? (
                        <div className="inline-block bg-white border-2 border-orange-200 text-orange-700 font-bold text-xs px-3 py-1.5 rounded-none shadow-[2px_2px_0px_#fed7aa]">
                          Đã đặt {msg.amount}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 px-3 py-2 rounded-none inline-block shadow-[2px_2px_0px_#cbd5e1]">
                          {msg.message}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t-2 border-slate-200 dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nhắn tin..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 h-10 px-3 bg-white border-2 border-slate-300 rounded-none text-sm outline-none focus:border-slate-400 transition-all placeholder:text-slate-400 shadow-[inset_2px_2px_0px_#f1f5f9]"
                />
                <button className="w-10 h-10 flex items-center justify-center bg-transparent text-primary hover:bg-slate-200/50 rounded-full transition-all cursor-pointer shrink-0">
                  <span className="material-symbols-outlined text-[20px] leading-none">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BOTTOM SECTION (Related)                                 */}
      {/* ======================================================== */}
      {relatedAuctions.length > 0 && (
        <section className="mt-10 pt-8 border-t-2 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-wide">
              Đấu giá tương tự
            </h2>
            <Link 
              href="/live" 
              className="group inline-flex items-center gap-1.5 rounded-none border-2 border-primary bg-white px-3 py-1.5 text-xs font-bold text-primary shadow-[3px_3px_0px_#E2B9A1] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#E2B9A1] dark:bg-slate-900 cursor-pointer"
            >
              Xem tất cả
              <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {relatedAuctions.map((auction, idx) => (
              <Link
                key={auction.id}
                href={`/auction/${auction.id}`}
                className="group bg-white dark:bg-slate-800/60 rounded-none overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-700 border-b-2 border-slate-200">
                  <Image
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={auction.title}
                    src={auction.image}
                    fill
                    unoptimized
                  />
                  <span className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm px-2 py-0.5 rounded-none border border-red-600 text-[10px] font-bold text-white flex items-center gap-1 shadow-[2px_2px_0px_#991b1b]">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </span>
                  <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-none border border-slate-200 text-[10px] font-bold text-orange-600 flex items-center gap-1 shadow-[2px_2px_0px_#cbd5e1]">
                    <span className="material-symbols-outlined text-[12px]">visibility</span>
                    {auction.activeBidders} theo dõi
                  </span>
                </div>
                
                <div className="p-3 space-y-1.5 flex-1 flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {auction.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug flex-1">
                    {auction.title}
                  </h3>
                  <div className="space-y-2 mt-2">
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 font-medium">Giá hiện tại</p>
                      <p className="text-sm font-bold text-primary">{auction.price}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-slate-500 font-medium">Còn lại</p>
                      <p className="text-xs text-red-500 font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {auction.timeLeft}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, use } from "react";

// Mock auction data
const MOCK_AUCTIONS: Record<string, {
  id: string;
  title: string;
  category: string;
  currentPrice: string;
  currentPriceNum: number;
  startPrice: string;
  timeLeft: string;
  totalBids: number;
  activeBidders: number;
  seller: string;
  sellerVerified: boolean;
  image: string;
  description: string;
  condition: string;
  authenticity: string;
}> = {
  "1": {
    id: "1",
    title: "iPhone 15 Pro Max 256GB",
    category: "Công nghệ",
    currentPrice: "25.000.000đ",
    currentPriceNum: 25000000,
    startPrice: "20.000.000đ",
    timeLeft: "00:04:22",
    totalBids: 47,
    activeBidders: 18,
    seller: "TechStore Official",
    sellerVerified: true,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4a25dDQ7_BoHv9jPPsBrzK8pCoacotFh4rj2EbadQxLUZJb6cgm2WFrulnz_oKYWUlVRqhJe9VDK-qcvsbchTduj7uebB3DwpLruZAcw0v5XwX5ludpx35uPPsRWjFevZX7F9jPJZtqyt679m-wzBmEMQrmwKUnZn1-heHLZXIwSqyiX6AY15BkBf6oEajTicPzqGnNPTklzu3fwA90fP0zn0vCO6pZQpQFblj7XIjWuIDXeMNLv-Ws9z5eR_zVO0k7Oj-CKhRrbk",
    description: "iPhone 15 Pro Max chính hãng Apple, full box, mới 100%. Màn hình Super Retina XDR 6.7 inch, chip A17 Pro, camera 48MP. Bảo hành 12 tháng tại các trung tâm uỷ quyền Apple.",
    condition: "Mới 100% - Nguyên seal, Full Box, phụ kiện đầy đủ theo máy.",
    authenticity: "Sản phẩm chính hãng Apple, có đầy đủ hóa đơn VAT và giấy tờ bảo hành. Đã được CocoFly xác minh.",
  },
  "2": {
    id: "2",
    title: "MacBook Pro M3 14 inch",
    category: "Công nghệ",
    currentPrice: "45.000.000đ",
    currentPriceNum: 45000000,
    startPrice: "38.000.000đ",
    timeLeft: "00:02:15",
    totalBids: 32,
    activeBidders: 12,
    seller: "Luxury Store",
    sellerVerified: true,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBYfyyLXiyVQPUR0qZVHlXkqxdAsOBOwe6p7_woDvvJRR8KbKSTiT4my1PLt7bE3ttDdAzIs4DaP5GV7j7mwc6sURi2Tl-GZ_8AWYf-eKXEtytJNrxHHrkrQdQXcQrdL9dl5v5aZK9PbMGZ5pdU_1zks08kqgIuhtPofoMVr9fZGR7j5SNJ5aSeb08mTV2pIWw-0-RpF_o5wFU2GkuovVYbyPIxLmLhvCvRZnOW04h0zVV8rdM-xH8BOFz1JwQJqkPVAngodA5A-V4R",
    description: "MacBook Pro 14 inch với chip M3, RAM 18GB, SSD 512GB. Màn hình Liquid Retina XDR, hiệu năng vượt trội cho mọi tác vụ chuyên nghiệp.",
    condition: "Mới 100% - Nguyên seal, Full Box.",
    authenticity: "Sản phẩm chính hãng Apple. Đã được CocoFly xác minh chất lượng.",
  },
};

// Related auctions — grouped by category for similarity matching
const ALL_AUCTIONS = [
  { id: "3", title: "Sony WH-1000XM5", category: "Công nghệ", price: "6.200.000đ", timeLeft: "01:45:00", activeBidders: 8, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQfvUXFE65sSLZ2IXh0jKTKiqGW4HteCjaoIn7nPOkGZNb5QY7sWC3sRN6dOcsj5qxLrv8pzi1X7AF5OY1aIWG7fDhdEeatxkhBwU6WZ6lHdl3ftwotVAah-JW87rkNkasem5pseRcGFB4iHteLu0lYk_45v9JdomFCJxhFTq1UAfSQs8Z5V8-6FS8fEG7TUwUGd8OrflCQ2-fvL7ivCoTYN_yQf38Vv92l5MqfYrrdzlQxJbKmP1X4FMc7ze2KHtfqgPQuW-94k00" },
  { id: "6", title: "iPad Pro M2 12.9", category: "Công nghệ", price: "22.500.000đ", timeLeft: "05:55:10", activeBidders: 15, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzpD9mw1WAy6OfuYXKy7PrdKT94ud97mMOwQvIdBpK2CiQy28GlqZualekmgAs6aUTkXVjjd_1hQEwB7RMkPSQG3HX0ioanafptmihC7wzEN_OzRzSS4RbCFbkxYEeMqrBv7KPJLksJFdOzbvAonqD1RB-kETQ9d02LgzvXvSlIxWWJISfZV1BF0aM9WrMgos-qn9rCRXT5OZcu5EP9M7QyeXIRBBMIUGGccVXJn4t0WLBIeMC8xD_uDJhVqg6kT-mTqZUvF9IQbtO" },
  { id: "7", title: "Samsung Galaxy S24 Ultra", category: "Công nghệ", price: "28.500.000đ", timeLeft: "03:45:20", activeBidders: 10, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbZbZhHzJfOF8mkjtpCNGgFz9N_NW80stwh0Os0lT6cLlYbq8xTT9kVUszUf9Ijrpw7xExty70sxJnDdmyxUoKa81byc5-NTlDlKFqiMaRaFxGFTfRJBNwZe1aG2iLlILRXLJ7bm2iAcNJ0q3zU-egL6BByZgbnKbjiP22qGNOucnBbjhAzY38ZoFA3L9d5Q1r76qWA_fqWPRv6WLrpVU0dm8Lp-9BOLhn31yTae1Dk6ARXx-P1gvGJcud16WumgW1ib5mYx3TfwNQ" },
  { id: "4", title: "Đồng hồ Rolex Daytona", category: "Thời trang", price: "1.250.000.000đ", timeLeft: "06:30:45", activeBidders: 24, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQ1_eZdI7SfaLzXHrLPFejTE5oq_79VOkahGxTCaX7UsFYdPij7bFQlF91NATxViIfo1_O54JfK8p4I44cmz_pjT8Up-6lKkCR5bCMGeUpoBNJL5hVjR7xlzeaF040eybKWaAqFd2OQ7Dz-Lp2UVGpt-w7HVHumwUlLHHTKkcjpY_8ZNwiGpy5ZGCK5Uqukw0KwlrXJzWm3SJDOOZAaT0yH0TcSo6563uyZmg4rrsecm12BEzT1PBiSTQBZLNBAWBnL5E_t0lH33ip" },
  { id: "5", title: "Tranh sơn dầu phong cảnh", category: "Nghệ thuật", price: "85.000.000đ", timeLeft: "03:10:22", activeBidders: 6, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMhTwnzOtPaS7lh-P0RPx1NqyN2L3y3FNKCXtSnn3IHVnsxEKBUSN-BL5Grv2T-JbWbhhAYpSEa-tKFzAtCWxf6VQg9dS6PuIBf7dcP-zKo6IQy3HasuIZkE03qDqS3iR0g1zjfTUn1SrtkuJTOVDhe5vHIj9WFxLMJEy-wPDI1iRchW8RCwrcd-pmOotmZ0K9HlwmkbgTtNSkV450rltmU2IkRXeqP2i5tEgyfddFH2tu0rPEvVmOZhqUuZ_3_-_5Dh-zOJPGYmDU" },
  { id: "8", title: "Túi xách Gucci Marmont", category: "Thời trang", price: "35.000.000đ", timeLeft: "07:20:00", activeBidders: 9, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDNV1sxmWooGJfzm4dzG9tx2ff6SRtKhzZCYS732G-eCRNp2nyUdvZNLO-P_YceZPttkJKsFiomN822mKKoC9ZwRqOiVRUCUXCwUuUIwvc61Wvdt8rwX3OvPIUWd6eUinWmivrVtzzhKaH9vxTIEVr5ZVnaZWJnrJ2P2IivnoBkhpVCHK1324cFdxBOP60FbASnz7WZstFnvebN14Vi_CsM7BioPjBMR7WVROK9tF6iUwAlZdC3Ls3f9nIm8iuudZzby6658TETHjkI" },
];

const CHAT_MESSAGES = [
  { type: "bid", user: "Nam H.", amount: "25.000.000đ", time: "2 phút trước", avatar: "N" },
  { type: "chat", user: "Minh Trần", message: "Túi này còn đầy đủ box và thẻ bảo hành không shop ơi?", time: "5 phút", avatar: "M" },
  { type: "bid", user: "Linh B.", amount: "24.500.000đ", time: "5 phút trước", avatar: "L" },
  { type: "chat", user: "Thanh Hương", message: "Chất lượng sản phẩm rất tốt, mình cũng đang nhắm em nó!", time: "12 phút", avatar: "T" },
  { type: "bid", user: "Quốc Anh", amount: "24.000.000đ", time: "8 phút trước", avatar: "Q" },
];

function getAuction(id: string) {
  return MOCK_AUCTIONS[id] || MOCK_AUCTIONS["1"];
}

function getRelatedAuctions(currentId: string, category: string) {
  return ALL_AUCTIONS.filter((a) => a.category === category && a.id !== currentId).slice(0, 4);
}

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const auction = getAuction(id);
  const [chatMessage, setChatMessage] = useState("");
  const suggestedPrice = (auction.currentPriceNum + 500000).toLocaleString("vi-VN");
  const relatedAuctions = getRelatedAuctions(auction.id, auction.category);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-primary transition-colors cursor-pointer">Home</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link href="/live" className="hover:text-primary transition-colors cursor-pointer">{auction.category}</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-primary font-medium">{auction.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Product Image + Bidding */}
        <div className="lg:col-span-3 space-y-6">
          {/* Hot Badge */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full border border-red-100">
              <span className="material-symbols-outlined text-sm">local_fire_department</span>
              ĐANG ĐẤU GIÁ NHIỆT
            </span>
            <span className="text-xs text-slate-400">
              <span className="material-symbols-outlined text-sm align-middle">visibility</span> {auction.activeBidders} người đang xem
            </span>
          </div>

          {/* Product Image */}
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="relative aspect-[4/3] bg-slate-50">
              <Image
                src={auction.image}
                alt={auction.title}
                fill
                className="object-contain p-8"
                unoptimized
              />
            </div>
          </div>

          {/* Price + Timer */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Giá hiện tại</p>
                <p className="text-4xl font-extrabold text-primary">
                  vnđ {auction.currentPriceNum.toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Thời gian còn lại</p>
                <p className="text-3xl font-bold text-red-500 tabular-nums">{auction.timeLeft}</p>
              </div>
            </div>

            {/* Suggested Bid Alert */}
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 mb-5 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">tips_and_updates</span>
              <p className="text-sm">
                Giá hiện tại đã thay đổi. <Link href="#" className="text-primary font-bold underline underline-offset-2 cursor-pointer">Đặt mức {suggestedPrice}đ ngay?</Link>
              </p>
            </div>

            {/* Bid Input */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">Đặt ý kiến theo</span>
                <input
                  type="text"
                  className="w-full pl-4 pt-8 pb-3 pr-4 bg-primary/5 border-2 border-primary/20 rounded-xl text-lg font-bold text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  defaultValue={`vnđ ${suggestedPrice}`}
                  readOnly
                />
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Nhập giá của bạn..."
                  className="w-full px-4 py-5 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-lg font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors cursor-pointer">
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </div>
            </div>

            {/* Place Bid Button */}
            <button className="w-full py-4 bg-primary hover:bg-primary/90 text-white text-lg font-bold rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all cursor-pointer">
              ĐẶT GIÁ NGAY
              <span className="material-symbols-outlined">gavel</span>
            </button>
          </div>

          {/* Product Details Accordion */}
          <div className="space-y-3">
            <details open className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm group">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                <span className="flex items-center gap-2 font-bold">
                  <span className="material-symbols-outlined text-primary">info</span>
                  Mô tả
                </span>
                <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-4">
                {auction.description}
              </div>
            </details>

            <details className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm group">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                <span className="flex items-center gap-2 font-bold">
                  <span className="material-symbols-outlined text-primary">verified</span>
                  Tình trạng
                </span>
                <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-4">
                {auction.condition}
              </div>
            </details>

            <details className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm group">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                <span className="flex items-center gap-2 font-bold">
                  <span className="material-symbols-outlined text-primary">shield</span>
                  Chứng thực
                </span>
                <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-4">
                {auction.authenticity}
              </div>
            </details>
          </div>
        </div>

        {/* Right Column: Live Chat & History */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm sticky top-20 flex flex-col" style={{ maxHeight: "calc(100vh - 120px)" }}>
            {/* Chat Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0">
              <h3 className="font-bold flex items-center gap-2 text-lg">
                <span className="material-symbols-outlined text-primary">forum</span>
                Live Chat & Lịch sử
              </h3>
              <div className="flex items-center gap-1.5 bg-green-50 text-green-600 text-xs font-bold px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                LIVE TRỰC TUYẾN
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
              {CHAT_MESSAGES.map((msg, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    msg.type === "bid"
                      ? "bg-primary/10 text-primary"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                  }`}>
                    {msg.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm">{msg.user}</span>
                      <span className="text-[10px] text-slate-400">{msg.time}</span>
                    </div>
                    {msg.type === "bid" ? (
                      <div className="bg-primary/10 text-primary font-bold text-sm px-3 py-2 rounded-lg inline-block">
                        vừa đặt {msg.amount}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 px-3 py-2 rounded-lg">
                        {msg.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nhắn tin..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
                <button className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-sm cursor-pointer">
                  <span className="material-symbols-outlined text-xl">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Auctions Section */}
      {relatedAuctions.length > 0 && (
        <section className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">local_fire_department</span>
              Đấu giá tương tự
            </h2>
            <Link href="/live" className="text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer">
              Xem tất cả <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedAuctions.map((related) => (
              <Link
                key={related.id}
                href={`/auction/${related.id}`}
                className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  <Image
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    alt={related.title}
                    src={related.image}
                    fill
                    unoptimized
                  />
                  <span className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-bold text-red-600 flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-xs">groups</span>
                    🔥 {related.activeBidders}
                  </span>
                  <div className="absolute top-2 right-2 bg-red-500/90 backdrop-blur px-2 py-0.5 rounded-full text-[9px] font-bold text-white flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-white animate-pulse"></span>
                    LIVE
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-bold line-clamp-1">{related.title}</h3>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Giá hiện tại</p>
                      <p className="text-sm font-bold text-primary">{related.price}</p>
                    </div>
                    <p className="text-xs text-red-500 font-bold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      {related.timeLeft}
                    </p>
                  </div>
                  <div className="w-full py-2 bg-primary text-white text-center text-xs font-bold rounded-lg mt-1 hover:bg-primary/90 transition-all cursor-pointer">
                    Xem chi tiết
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const LIVE_AUCTIONS = [
  {
    id: 1,
    title: "iPhone 15 Pro Max",
    price: "25.000.000đ",
    timeLeft: "04:22:15",
    activeBidders: 18,
    category: "Công nghệ",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4a25dDQ7_BoHv9jPPsBrzK8pCoacotFh4rj2EbadQxLUZJb6cgm2WFrulnz_oKYWUlVRqhJe9VDK-qcvsbchTduj7uebB3DwpLruZAcw0v5XwX5ludpx35uPPsRWjFevZX7F9jPJZtqyt679m-wzBmEMQrmwKUnZn1-heHLZXIwSqyiX6AY15BkBf6oEajTicPzqGnNPTklzu3fwA90fP0zn0vCO6pZQpQFblj7XIjWuIDXeMNLv-Ws9z5eR_zVO0k7Oj-CKhRrbk",
  },
  {
    id: 2,
    title: "MacBook Pro M3",
    price: "45.000.000đ",
    timeLeft: "02:15:30",
    activeBidders: 12,
    category: "Công nghệ",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBYfyyLXiyVQPUR0qZVHlXkqxdAsOBOwe6p7_woDvvJRR8KbKSTiT4my1PLt7bE3ttDdAzIs4DaP5GV7j7mwc6sURi2Tl-GZ_8AWYf-eKXEtytJNrxHHrkrQdQXcQrdL9dl5v5aZK9PbMGZ5pdU_1zks08kqgIuhtPofoMVr9fZGR7j5SNJ5aSeb08mTV2pIWw-0-RpF_o5wFU2GkuovVYbyPIxLmLhvCvRZnOW04h0zVV8rdM-xH8BOFz1JwQJqkPVAngodA5A-V4R",
  },
  {
    id: 3,
    title: "Sony WH-1000XM5",
    price: "6.200.000đ",
    timeLeft: "01:45:00",
    activeBidders: 8,
    category: "Công nghệ",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQfvUXFE65sSLZ2IXh0jKTKiqGW4HteCjaoIn7nPOkGZNb5QY7sWC3sRN6dOcsj5qxLrv8pzi1X7AF5OY1aIWG7fDhdEeatxkhBwU6WZ6lHdl3ftwotVAah-JW87rkNkasem5pseRcGFB4iHteLu0lYk_45v9JdomFCJxhFTq1UAfSQs8Z5V8-6FS8fEG7TUwUGd8OrflCQ2-fvL7ivCoTYN_yQf38Vv92l5MqfYrrdzlQxJbKmP1X4FMc7ze2KHtfqgPQuW-94k00",
  },
  {
    id: 4,
    title: "Đồng hồ Rolex Daytona",
    price: "1.250.000.000đ",
    timeLeft: "06:30:45",
    activeBidders: 24,
    category: "Thời trang",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQ1_eZdI7SfaLzXHrLPFejTE5oq_79VOkahGxTCaX7UsFYdPij7bFQlF91NATxViIfo1_O54JfK8p4I44cmz_pjT8Up-6lKkCR5bCMGeUpoBNJL5hVjR7xlzeaF040eybKWaAqFd2OQ7Dz-Lp2UVGpt-w7HVHumwUlLHHTKkcjpY_8ZNwiGpy5ZGCK5Uqukw0KwlrXJzWm3SJDOOZAaT0yH0TcSo6563uyZmg4rrsecm12BEzT1PBiSTQBZLNBAWBnL5E_t0lH33ip",
  },
  {
    id: 5,
    title: "Tranh sơn dầu phong cảnh",
    price: "85.000.000đ",
    timeLeft: "03:10:22",
    activeBidders: 6,
    category: "Nghệ thuật",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMhTwnzOtPaS7lh-P0RPx1NqyN2L3y3FNKCXtSnn3IHVnsxEKBUSN-BL5Grv2T-JbWbhhAYpSEa-tKFzAtCWxf6VQg9dS6PuIBf7dcP-zKo6IQy3HasuIZkE03qDqS3iR0g1zjfTUn1SrtkuJTOVDhe5vHIj9WFxLMJEy-wPDI1iRchW8RCwrcd-pmOotmZ0K9HlwmkbgTtNSkV450rltmU2IkRXeqP2i5tEgyfddFH2tu0rPEvVmOZhqUuZ_3_-_5Dh-zOJPGYmDU",
  },
  {
    id: 6,
    title: "iPad Pro M2 12.9",
    price: "22.500.000đ",
    timeLeft: "05:55:10",
    activeBidders: 15,
    category: "Công nghệ",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzpD9mw1WAy6OfuYXKy7PrdKT94ud97mMOwQvIdBpK2CiQy28GlqZualekmgAs6aUTkXVjjd_1hQEwB7RMkPSQG3HX0ioanafptmihC7wzEN_OzRzSS4RbCFbkxYEeMqrBv7KPJLksJFdOzbvAonqD1RB-kETQ9d02LgzvXvSlIxWWJISfZV1BF0aM9WrMgos-qn9rCRXT5OZcu5EP9M7QyeXIRBBMIUGGccVXJn4t0WLBIeMC8xD_uDJhVqg6kT-mTqZUvF9IQbtO",
  },
  {
    id: 7,
    title: "Samsung Galaxy S24 Ultra",
    price: "28.500.000đ",
    timeLeft: "03:45:20",
    activeBidders: 10,
    category: "Công nghệ",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbZbZhHzJfOF8mkjtpCNGgFz9N_NW80stwh0Os0lT6cLlYbq8xTT9kVUszUf9Ijrpw7xExty70sxJnDdmyxUoKa81byc5-NTlDlKFqiMaRaFxGFTfRJBNwZe1aG2iLlILRXLJ7bm2iAcNJ0q3zU-egL6BByZgbnKbjiP22qGNOucnBbjhAzY38ZoFA3L9d5Q1r76qWA_fqWPRv6WLrpVU0dm8Lp-9BOLhn31yTae1Dk6ARXx-P1gvGJcud16WumgW1ib5mYx3TfwNQ",
  },
  {
    id: 8,
    title: "Túi xách Gucci Marmont",
    price: "35.000.000đ",
    timeLeft: "07:20:00",
    activeBidders: 9,
    category: "Thời trang",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDNV1sxmWooGJfzm4dzG9tx2ff6SRtKhzZCYS732G-eCRNp2nyUdvZNLO-P_YceZPttkJKsFiomN822mKKoC9ZwRqOiVRUCUXCwUuUIwvc61Wvdt8rwX3OvPIUWd6eUinWmivrVtzzhKaH9vxTIEVr5ZVnaZWJnrJ2P2IivnoBkhpVCHK1324cFdxBOP60FbASnz7WZstFnvebN14Vi_CsM7BioPjBMR7WVROK9tF6iUwAlZdC3Ls3f9nIm8iuudZzby6658TETHjkI",
  },
  {
    id: 9,
    title: "Bình gốm cổ Bát Tràng",
    price: "120.000.000đ",
    timeLeft: "08:10:33",
    activeBidders: 5,
    category: "Cổ vật",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAnvG5fYlLmLJJlsp9bXEmy5QaY0mqQiuVFblIINfb6j9XePA6VqUAt7EzZA-KPdbKKunhYbtAD5zcTdHVusRnEKFjZ2opagufdYEnepBK9KTGaFHk1O3WnbJHTDjYjNvmVDe_h3C8o44B2rsBggtYUxkXdHZMMAA0MsFBBdeu_nLCrmtYBC2nX3e1iG_Jx8qZfkdr7eXCrFMFu9hKa46c5Fzfr_PBaxEAwvDRaR8u6VwbWvxYCXN_V0qH3c9xU8XIabKDiKi-ycCtR",
  },
  {
    id: 10,
    title: "Đĩa than Beatles Abbey Road",
    price: "15.000.000đ",
    timeLeft: "02:00:15",
    activeBidders: 4,
    category: "Cổ vật",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBSOTZ45dJyx3H9gwXSwtQtZE_M9HJk2zH2zJO6qjoCiNMXcFBIHMfgFWaSJJd_SUrcPBWZd0GBD-5mAimopqK7gmfm0XhNrtB2euCIQiuIs7H4e6lWkt5W1_uVaSUc7-A6h-MCkq5bRngTt0nYBsXUoCrrCrEbODea75-EDxoexj_kmL5ELFBh6XLfFMz27H0NPe4ty0AE1QmuAe3DRq4-C3n0V55LfCfCfaUra_6gAtQBe0DVlicHWPvGxHGjf-BFm-3jHZAii7s3",
  },
];

const CATEGORIES = [
  { name: "Tất cả", icon: "apps" },
  { name: "Công nghệ", icon: "devices" },
  { name: "Thời trang", icon: "checkroom" },
  { name: "Cổ vật", icon: "account_balance" },
  { name: "Nghệ thuật", icon: "palette" },
  { name: "Khác", icon: "dashboard_customize" },
];

export default function LiveAuctionsPage() {
  const [activeCategory, setActiveCategory] = useState("Tất cả");

  const filtered =
    activeCategory === "Tất cả"
      ? LIVE_AUCTIONS
      : LIVE_AUCTIONS.filter((a) => a.category === activeCategory);

  return (
    <>
      {/* Hero Banner */}
      <section className="px-6 lg:px-20 py-10">
        <div className="max-w-7xl mx-auto">
          <div
            className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-10 py-16 flex flex-col items-center justify-center text-center shadow-2xl"
          >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
            <div className="relative z-10 flex flex-col items-center gap-4 max-w-2xl">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 text-white text-sm font-bold">
                <span className="w-2 h-2 rounded-full bg-red-300 animate-pulse"></span>
                LIVE
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Đấu giá đang diễn ra
              </h1>
              <p className="text-white/90 text-lg font-medium leading-relaxed">
                Tham gia ngay các phiên đấu giá nóng hổi. Đặt giá và trở thành chủ nhân của những sản phẩm tuyệt vời!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Sidebar + Grid */}
      <section className="px-6 lg:px-20 pb-20">
        <div className="max-w-7xl mx-auto flex gap-8">
          {/* Category Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0 self-start sticky top-20">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">filter_list</span>
                  Danh mục
                </h3>
              </div>
              <nav className="py-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all cursor-pointer ${
                      activeCategory === cat.name
                        ? "bg-primary/10 text-primary font-bold border-l-3 border-primary"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-lg ${
                      activeCategory === cat.name ? "text-primary" : "text-slate-400"
                    }`}>
                      {cat.icon}
                    </span>
                    {cat.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Active count */}
            <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="material-symbols-outlined text-green-500 text-base">circle</span>
                <span className="font-bold">{filtered.length} phiên đang hoạt động</span>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {/* Mobile Category Tabs */}
            <div className="lg:hidden mb-6">
              <div className="flex items-center bg-white dark:bg-background-dark p-1.5 rounded-xl shadow-sm border border-primary/5 overflow-x-auto">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`px-5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                      activeCategory === cat.name
                        ? "bg-primary text-white shadow-md"
                        : "text-slate-500 hover:text-primary"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filtered.map((auction, idx) => (
                <Link
                  href={`/auction/${auction.id}`}
                  key={auction.id}
                  className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-100">
                    <Image
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      alt={auction.title}
                      src={auction.image}
                      fill
                      unoptimized
                    />
                    <span className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-bold text-red-600 flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-xs">groups</span>
                      🔥 {auction.activeBidders}
                    </span>
                    <div className="absolute top-2 right-2 bg-red-500/90 backdrop-blur px-2 py-0.5 rounded-full text-[9px] font-bold text-white flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-white animate-pulse"></span>
                      LIVE
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{auction.category}</span>
                    <h3 className="text-sm font-bold line-clamp-1">{auction.title}</h3>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-slate-500 font-medium">Giá hiện tại</p>
                        <p className="text-sm font-bold text-primary">{auction.price}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-medium">Còn lại</p>
                        <p className="text-xs text-red-500 font-bold flex items-center justify-end gap-0.5">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          {auction.timeLeft}
                        </p>
                      </div>
                    </div>
                    <div
                      className="w-full py-2 bg-primary text-white text-center text-xs font-bold rounded-lg mt-1 hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Đặt giá ngay
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

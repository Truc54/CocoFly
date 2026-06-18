"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { auctionApi, categoryApi } from "@/lib/api";
import { mockHotAuctions, mockUpcomingAuctions } from "@/lib/mockData";
import Sidebar from "@/components/layout/Sidebar";
import HeroSection from "@/components/home/HeroSection";
import AuctionRow from "@/components/home/AuctionRow";
import CategoryGrid from "@/components/home/CategoryGrid";

interface AuctionItem {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  category: { id: number; name: string } | null;
  currentPrice: number;
  startingPrice: number;
  endTime: string;
  scheduledStart?: string;
  totalBids: number;
  totalWatchers: number;
}

interface CategoryWithAuctions {
  id: number;
  name: string;
  slug: string;
  auctions: AuctionItem[];
  loading: boolean;
}

export default function HomePage() {
  const [hotAuctions, setHotAuctions] = useState<AuctionItem[]>([]);
  const [upcomingAuctions, setUpcomingAuctions] = useState<AuctionItem[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<CategoryWithAuctions[]>([]);
  const [loadingHot, setLoadingHot] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);

  useEffect(() => {
    const dataStr = sessionStorage.getItem("successPayment");
    if (dataStr) {
      try {
        setPaymentSuccessData(JSON.parse(dataStr));
        sessionStorage.removeItem("successPayment");
      } catch (e) {}
    }
  }, []);

  // Fetch HOT auctions (sorted by most bids)
  useEffect(() => {
    auctionApi
      .getLive({ limit: 6, sort: "most_bids" })
      .then((res) => {
        const data = res?.data?.auctions;
        setHotAuctions(data?.length > 0 ? data : mockHotAuctions);
      })
      .catch(() => setHotAuctions(mockHotAuctions))
      .finally(() => setLoadingHot(false));
  }, []);

  // Fetch upcoming auctions
  useEffect(() => {
    auctionApi
      .getUpcoming({ limit: 6 })
      .then((res) => {
        const data = res?.data?.auctions;
        setUpcomingAuctions(data?.length > 0 ? data : mockUpcomingAuctions);
      })
      .catch(() => setUpcomingAuctions(mockUpcomingAuctions))
      .finally(() => setLoadingUpcoming(false));
  }, []);

  // Fetch Top 4 Hottest Categories and their active auctions
  useEffect(() => {
    categoryApi
      .getAll({ featured: true })
      .then((res) => {
        if (res?.data) {
          const isRealEstateCategory = (cat: any) =>
            cat.slug === "bat-dong-san" || cat.name === "Bất động sản";

          const top4 = res.data
            .filter((cat: any) => !isRealEstateCategory(cat) && cat.slug !== "khac")
            .slice(0, 4);

          // Initialize categories with loading state
          const initialCats = top4.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            auctions: [],
            loading: true,
          }));
          setFeaturedCategories(initialCats);

          // Fetch active auctions for each hot category
          top4.forEach((cat: any) => {
            auctionApi
              .getLive({ limit: 6, categoryId: cat.id })
              .then((auctionRes) => {
                const list = auctionRes?.data?.auctions || [];
                setFeaturedCategories((prev) =>
                  prev.map((item) =>
                    item.id === cat.id ? { ...item, auctions: list, loading: false } : item
                  )
                );
              })
              .catch(() => {
                setFeaturedCategories((prev) =>
                  prev.map((item) =>
                    item.id === cat.id ? { ...item, loading: false } : item
                  )
                );
              });
          });
        }
      })
      .catch((err) => {
        console.error("Error fetching featured categories with auctions:", err);
      });
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4">
      <div className="flex gap-6">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <HeroSection />

          {/* 🔥 Phiên đấu giá HOT */}
          <AuctionRow
            title="🔥 Phiên đấu giá HOT"
            auctions={hotAuctions}
            viewAllHref="/live?sort=most_bids"
            showCountdown
            loading={loadingHot}
          />

          {/* ⏰ Sắp diễn ra */}
          <AuctionRow
            title="⏰ Sắp diễn ra"
            auctions={upcomingAuctions}
            variant="upcoming"
            viewAllHref="/upcoming"
            loading={loadingUpcoming}
          />

          {/* Top 2 Hottest Categories with Auctions */}
          {featuredCategories.slice(0, 2).map((cat) => (
            <AuctionRow
              key={cat.id}
              title={cat.name}
              auctions={cat.auctions}
              viewAllHref={`/live?categoryId=${cat.id}`}
              showCountdown
              loading={cat.loading}
            />
          ))}

          {/* 🏷️ Khám phá danh mục */}
          <CategoryGrid />

          {/* Next 2 Hottest Categories with Auctions */}
          {featuredCategories.slice(2, 4).map((cat) => (
            <AuctionRow
              key={cat.id}
              title={cat.name}
              auctions={cat.auctions}
              viewAllHref={`/live?categoryId=${cat.id}`}
              showCountdown
              loading={cat.loading}
            />
          ))}
        </div>
      </div>

      {/* Payment Success Popup */}
      {paymentSuccessData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setPaymentSuccessData(null)}>
          <div className="bg-white dark:bg-slate-800 w-full max-w-md border-2 border-slate-200 dark:border-slate-700 shadow-[8px_8px_0px_#E2B9A1] rounded-2xl overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500">
                <span className="material-symbols-outlined text-[40px] text-green-500">check_circle</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Thanh toán thành công!</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
                Đơn hàng của bạn đã được thanh toán và đang chờ giao.
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6 flex gap-4 items-center border border-slate-100 dark:border-slate-600">
                <div className="w-16 h-16 relative rounded-lg overflow-hidden shrink-0 bg-white border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                  <img src={paymentSuccessData.imageUrl} alt={paymentSuccessData.itemName} className="object-contain w-full h-full" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{paymentSuccessData.itemName}</p>
                  <p className="text-sm text-slate-500 mb-1">Mã GD: <span className="font-mono text-slate-700 dark:text-slate-300">{paymentSuccessData.paymentId?.slice(0, 8).toUpperCase() || 'N/A'}</span></p>
                  <p className="font-bold text-orange-600">{Number(paymentSuccessData.amount || 0).toLocaleString('vi-VN')} VNĐ</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPaymentSuccessData(null)} className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 transition-all cursor-pointer rounded-xl">
                  Đóng
                </button>
                <Link href="/won-auctions" className="flex-1 py-3 font-bold text-white bg-[#0066FF] border-2 border-[#0066FF] hover:bg-blue-600 shadow-[4px_4px_0px_#bfdbfe] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#bfdbfe] active:translate-y-0 active:shadow-[2px_2px_0px_#bfdbfe] transition-all cursor-pointer rounded-xl block">
                  Đơn mua của tôi
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

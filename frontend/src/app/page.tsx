"use client";

import { useState, useEffect } from "react";
import { auctionApi } from "@/lib/api";
import { mockHotAuctions, mockUpcomingAuctions, mockCategoryAuctions } from "@/lib/mockData";
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

export default function HomePage() {
  const [hotAuctions, setHotAuctions] = useState<AuctionItem[]>([]);
  const [upcomingAuctions, setUpcomingAuctions] = useState<AuctionItem[]>([]);
  const [loadingHot, setLoadingHot] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);

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

          {/* Cổ vật & Sưu tầm */}
          <AuctionRow
            title="Cổ vật & Sưu tầm"
            auctions={mockCategoryAuctions["Cổ vật & Sưu tầm"]}
            viewAllHref="/live?categoryId=3"
            showCountdown
          />

          {/* Xe & Phương tiện */}
          <AuctionRow
            title="Xe & Phương tiện"
            auctions={mockCategoryAuctions["Xe & Phương tiện"]}
            viewAllHref="/live?categoryId=5"
            showCountdown
          />

          {/* 🏷️ Khám phá danh mục */}
          <CategoryGrid />

          {/* Đồng hồ & Trang sức */}
          <AuctionRow
            title="Đồng hồ & Trang sức"
            auctions={mockCategoryAuctions["Đồng hồ & Trang sức"]}
            viewAllHref="/live?categoryId=6"
            showCountdown
          />

          {/* Rượu vang & Đồ uống */}
          <AuctionRow
            title="Rượu vang & Đồ uống"
            auctions={mockCategoryAuctions["Rượu vang & Đồ uống"]}
            viewAllHref="/live?categoryId=7"
            showCountdown
          />
        </div>
      </div>
    </div>
  );
}

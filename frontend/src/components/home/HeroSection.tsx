"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { auctionApi } from "@/lib/api";

const DEFAULT_HOT_AUCTIONS = [
  { id: "1", name: "Rolex Submariner", price: "350.000.000 đ", image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=800&auto=format&fit=crop" },
  { id: "2", name: "Túi xách Hermes Birkin", price: "280.000.000 đ", image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800&auto=format&fit=crop" },
  { id: "3", name: "Bức tranh sơn dầu cổ", price: "120.000.000 đ", image: "https://images.unsplash.com/photo-1579541018335-7d84b553e4b7?q=80&w=800&auto=format&fit=crop" },
  { id: "4", name: "Vespa 946 Christian Dior", price: "950.000.000 đ", image: "https://images.unsplash.com/photo-1598286237841-53e7f67ad8cc?q=80&w=800&auto=format&fit=crop" },
  { id: "5", name: "MacBook Pro M3 Max", price: "80.000.000 đ", image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?q=80&w=800&auto=format&fit=crop" },
];

export default function HeroSection() {
  const [hotAuctions, setHotAuctions] = useState<any[]>(DEFAULT_HOT_AUCTIONS);
  const [activeIndex, setActiveIndex] = useState(2);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auctionApi
      .getLive({ limit: 5, sort: "most_bids" })
      .then((res) => {
        const liveList = res?.data?.auctions;
        if (liveList && liveList.length > 0) {
          const mapped = liveList.map((auc: any) => ({
            id: auc.id,
            name: auc.title,
            price: Number(auc.currentPrice).toLocaleString("vi-VN") + " đ",
            image: auc.thumbnailUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600",
          }));
          setHotAuctions(mapped);
          setActiveIndex(Math.min(2, Math.floor(mapped.length / 2)));
        }
      })
      .catch((err) => {
        console.error("Failed to load hot auctions for hero slider:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleNext = useCallback(() => {
    if (hotAuctions.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % hotAuctions.length);
  }, [hotAuctions.length]);

  const handlePrev = useCallback(() => {
    if (hotAuctions.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + hotAuctions.length) % hotAuctions.length);
  }, [hotAuctions.length]);

  // Auto-play every 4s
  useEffect(() => {
    const timer = setInterval(handleNext, 4000);
    return () => clearInterval(timer);
  }, [handleNext]);

  if (hotAuctions.length === 0) return null;

  return (
    <section className="relative w-full h-[280px] md:h-[320px] flex items-center justify-center overflow-hidden rounded-xl mb-6">
      {/* Background */}
      <div className="absolute inset-0 -z-20">
        <Image
          src="/background.jpg"
          alt="Night sky background"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-4 z-10 px-4 md:px-8">
        {/* Left text */}
        <div className="hidden md:flex flex-col gap-2 max-w-[240px] shrink-0">
          <h2 className="text-xl lg:text-2xl font-display font-bold text-white leading-tight">
            Phiên đấu giá cực HOT
          </h2>
          <p className="text-white/70 text-sm">
            Tham gia ngay để sở hữu những sản phẩm tuyệt vời
          </p>
        </div>

        {/* Carousel */}
        <div className="relative flex-1 h-[220px] md:h-[260px] flex items-center justify-center">
          {/* Arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-0 z-20 flex items-center justify-center w-9 h-9 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all"
            aria-label="Previous"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-0 z-20 flex items-center justify-center w-9 h-9 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all"
            aria-label="Next"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Items */}
          <div className="flex items-center justify-center w-full h-full relative">
            {hotAuctions.map((item, index) => {
              let offset = index - activeIndex;
              if (offset < -2) offset += hotAuctions.length;
              if (offset > 2) offset -= hotAuctions.length;

              const isCenter = offset === 0;
              const isVisible = Math.abs(offset) <= 1;
              const scale = isCenter ? 1.05 : 0.85;
              const translateX = `calc(${offset * 105}%)`;
              const zIndex = 10 - Math.abs(offset);
              const opacity = isVisible ? (isCenter ? 1 : 0.5) : 0;

              return (
                <Link
                  key={item.id}
                  href={`/auction/${item.id}`}
                  className="absolute w-[160px] md:w-[200px] lg:w-[220px] aspect-[3/4] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] rounded-xl overflow-hidden shadow-2xl group cursor-pointer"
                  style={{
                    transform: `translateX(${translateX}) scale(${scale})`,
                    zIndex,
                    opacity,
                    pointerEvents: isVisible ? "auto" : "none",
                  }}
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-4">
                    <h3 className="text-white font-bold text-sm md:text-base line-clamp-1">{item.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-accent text-[10px] font-semibold uppercase tracking-wider">Giá hiện tại</span>
                      <p className="text-white font-bold text-sm">{item.price}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {hotAuctions.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === activeIndex ? "bg-white w-5" : "bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

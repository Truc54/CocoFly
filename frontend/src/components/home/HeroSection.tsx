"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";

const hotAuctions = [
  { id: 1, name: "Rolex Submariner", price: "350.000.000đ", image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=800&auto=format&fit=crop" },
  { id: 2, name: "Túi xách Hermes Birkin", price: "280.000.000đ", image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800&auto=format&fit=crop" },
  { id: 3, name: "Bức tranh sơn dầu cổ", price: "120.000.000đ", image: "https://images.unsplash.com/photo-1579541018335-7d84b553e4b7?q=80&w=800&auto=format&fit=crop" },
  { id: 4, name: "Vespa 946 Christian Dior", price: "950.000.000đ", image: "https://images.unsplash.com/photo-1598286237841-53e7f67ad8cc?q=80&w=800&auto=format&fit=crop" },
  { id: 5, name: "MacBook Pro M3 Max", price: "80.000.000đ", image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?q=80&w=800&auto=format&fit=crop" },
];

export default function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(2);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % hotAuctions.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + hotAuctions.length) % hotAuctions.length);
  };

  return (
    <section className="relative w-full min-h-screen flex flex-col justify-center items-center overflow-hidden pt-28 pb-16">
      {/* Background Image */}
      <div className="absolute inset-0 -z-20">
        <Image
          src="/background.jpg"
          alt="Night sky background"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-12 z-10 px-4">
        {/* Header content */}
        <div className="text-center text-white space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-5xl lg:text-7xl font-display font-bold tracking-tight text-white drop-shadow-lg">
            Tham gia những phiên đấu giá cực hot ngay
          </h1>
        </div>

        {/* Custom 3-Item Carousel */}
        <div className="relative w-full max-w-5xl h-[400px] md:h-[450px] lg:h-[500px] flex items-center justify-center my-6">
          {/* Navigation Arrows */}
          <button 
            onClick={handlePrev}
            className="absolute left-0 lg:-left-12 z-30 flex items-center justify-center w-12 h-12 bg-[#8f5c38] text-white rounded-none border-2 border-primary-main shadow-[4px_4px_0px_#E2B9A1] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] transition-all active:scale-95"
            aria-label="Previous item"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <button 
            onClick={handleNext}
            className="absolute right-0 lg:-right-12 z-30 flex items-center justify-center w-12 h-12 bg-[#8f5c38] text-white rounded-none border-2 border-primary-main shadow-[4px_4px_0px_#E2B9A1] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#E2B9A1] transition-all active:scale-95"
            aria-label="Next item"
          >
            <ArrowRight className="w-6 h-6" />
          </button>

          {/* Carousel Items Container */}
          <div className="flex items-center justify-center w-full h-full relative">
            {hotAuctions.map((item, index) => {
              let offset = index - activeIndex;
              if (offset < -2) offset += hotAuctions.length;
              if (offset > 2) offset -= hotAuctions.length;

              const isCenter = offset === 0;
              const isVisible = Math.abs(offset) <= 1;

              const scale = isCenter ? 1.15 : 0.95;
              const translateX = `calc(${offset * 110}%)`;
              const zIndex = 10 - Math.abs(offset);
              const opacity = isVisible ? (isCenter ? 1 : 0.6) : 0;

              return (
                <div
                  key={item.id}
                  className="absolute w-[220px] md:w-[260px] lg:w-[300px] aspect-[4/5] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.6)] group cursor-pointer"
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
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
                    unoptimized
                  />
                  
                  {/* Gradient Overlay — works on ALL 3 visible items */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className="text-white font-bold text-xl md:text-2xl mb-1 line-clamp-1">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[#E2B9A1] text-xs font-semibold uppercase tracking-wider">Giá hiện tại</span>
                        <p className="text-white font-bold text-lg md:text-xl">{item.price}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

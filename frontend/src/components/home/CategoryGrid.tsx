"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { categoryApi } from "@/lib/api";
import { mockFeaturedCategories } from "@/lib/mockData";
import { getCategoryImageUrl } from "@/lib/categoryImages";

interface FeaturedCategory {
  id: number;
  name: string;
  slug: string;
  iconUrl: string | null;
}

export default function CategoryGrid() {
  const [categories, setCategories] = useState<FeaturedCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi
      .getAll({ featured: true })
      .then((res) => {
        if (res?.data) {
          // Pick top 8 featured categories (exclude "Khác" for cleaner UI)
          const featured = res.data
            .filter((c: FeaturedCategory) => c.slug !== "khac")
            .slice(0, 8);
          setCategories(featured);
        }
      })
      .catch(() => setCategories(mockFeaturedCategories))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xl text-orange-500">explore</span>
          Khám phá danh mục
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center animate-pulse">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-12 mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 md:gap-6">
          {categories.map((cat) => {
            const imgUrl = getCategoryImageUrl(cat.slug);
            return (
              <Link
                key={cat.id}
                href={`/live?categoryId=${cat.id}`}
                className="group flex flex-col items-center cursor-pointer"
              >
                {/* Circle Container */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700/60 flex items-center justify-center p-3.5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_8px_16px_rgba(226,185,161,0.2)] group-hover:border-orange-400 dark:group-hover:border-orange-500">
                  {imgUrl ? (
                    <div className="relative w-full h-full transition-transform duration-300 group-hover:rotate-6">
                      <Image
                        src={imgUrl}
                        alt={cat.name}
                        fill
                        sizes="60px"
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <span className="material-symbols-outlined text-2xl text-slate-400 group-hover:text-orange-500 transition-colors">
                      {cat.iconUrl || "category"}
                    </span>
                  )}
                </div>

                {/* Centered Name Underneath */}
                <span className="text-[11px] md:text-xs font-bold text-slate-700 dark:text-slate-200 mt-2 text-center line-clamp-2 leading-tight group-hover:text-orange-500 transition-colors">
                  {cat.name.replace(/&/g, "-")}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

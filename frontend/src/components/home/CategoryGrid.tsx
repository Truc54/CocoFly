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
  description?: string | null;
}

export default function CategoryGrid() {
  const [categories, setCategories] = useState<FeaturedCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi
      .getAll()
      .then((res) => {
        if (res?.data) {
          // Pick top 8 featured categories (exclude "Khác")
          const featured = res.data
            .filter((c: FeaturedCategory) => c.name !== "Khác")
            .slice(0, 8);
          setCategories(featured);
        }
      })
      .catch(() => setCategories(mockFeaturedCategories))
      .finally(() => setLoading(false));
  }, []);

  // Color palette for category cards (no purple!)
  const CARD_COLORS = [
    "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 hover:from-amber-100 hover:to-orange-100",
    "from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 hover:from-emerald-100 hover:to-teal-100",
    "from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 hover:from-sky-100 hover:to-blue-100",
    "from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 hover:from-rose-100 hover:to-pink-100",
    "from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 hover:from-cyan-100 hover:to-teal-100",
    "from-lime-50 to-green-50 dark:from-lime-900/20 dark:to-green-900/20 hover:from-lime-100 hover:to-green-100",
    "from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 hover:from-yellow-100 hover:to-amber-100",
    "from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 hover:from-red-100 hover:to-orange-100",
  ];

  const ICON_COLORS = [
    "text-amber-600", "text-emerald-600", "text-sky-600", "text-rose-600",
    "text-cyan-600", "text-lime-600", "text-yellow-600", "text-red-600",
  ];

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          🏷️ Khám phá danh mục
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[88px] rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.map((cat, i) => {
            const imgUrl = getCategoryImageUrl(cat.slug);
            return (
              <Link
                key={cat.id}
                href={`/live?categoryId=${cat.id}`}
                className={`group relative flex items-center gap-3 px-4 py-4 rounded-xl bg-gradient-to-br ${CARD_COLORS[i % CARD_COLORS.length]} border border-slate-100 dark:border-slate-700/30 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
              >
                {imgUrl ? (
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 transition-transform group-hover:scale-110">
                    <Image
                      src={imgUrl}
                      alt={cat.name}
                      fill
                      sizes="32px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : cat.iconUrl ? (
                  <span className={`material-symbols-outlined text-2xl ${ICON_COLORS[i % ICON_COLORS.length]} transition-transform group-hover:scale-110`}>
                    {cat.iconUrl}
                  </span>
                ) : (
                  <span className={`material-symbols-outlined text-2xl ${ICON_COLORS[i % ICON_COLORS.length]} transition-transform group-hover:scale-110`}>
                    category
                  </span>
                )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                  {cat.name}
                </p>
                {cat.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {cat.description}
                  </p>
                )}
              </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

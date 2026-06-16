"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { categoryApi } from "@/lib/api";
import { getCategoryImageUrl } from "@/lib/categoryImages";

interface SidebarCategory {
  id: number;
  name: string;
  slug: string;
  iconUrl: string | null;
}

export default function Sidebar() {
  const [categories, setCategories] = useState<SidebarCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi
      .getAll()
      .then((res) => {
        if (res?.data) setCategories(res.data);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const laptopIndex = categories.findIndex((c) => c.slug === "laptop-may-vi-tinh");
  const displayedCategories = laptopIndex !== -1 ? categories.slice(0, laptopIndex + 1) : categories;

  return (
    <aside className="hidden lg:block w-[240px] shrink-0 self-start sticky top-[102px]">
      <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-primary/5">
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-700 dark:text-slate-200">
            Danh mục
          </h3>
        </div>

        {/* Category list */}
        <nav className="py-1 flex flex-col">
          {loading ? (
            // Skeleton
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 mx-2 my-1">
                <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
                <div className="h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse flex-1" />
              </div>
            ))
          ) : (
            displayedCategories.map((cat) => {
              const imgUrl = getCategoryImageUrl(cat.slug);
              return (
                <Link
                  key={cat.id}
                  href={`/live?categoryId=${cat.id}`}
                  className="group flex items-center gap-3 px-3 py-2 text-[12px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all rounded-xl mx-2 my-0.5 border border-transparent shrink-0"
                >
                  {imgUrl ? (
                    <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={imgUrl}
                        alt={cat.name}
                        fill
                        sizes="28px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : cat.iconUrl ? (
                    <span className="material-symbols-outlined text-[20px] text-slate-400">
                      {cat.iconUrl}
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px] text-slate-400">
                      category
                    </span>
                  )}
                  <span className="flex-1 truncate">{cat.name.replace(/&/g, "-")}</span>
                </Link>
              );
            })
          )}
        </nav>
      </div>
    </aside>
  );
}

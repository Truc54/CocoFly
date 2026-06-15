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

  return (
    <aside className="hidden lg:block w-[220px] shrink-0 self-start sticky top-[102px]">
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">category</span>
            Danh mục
          </h3>
        </div>

        {/* Category list */}
        <nav className="py-1 max-h-[calc(100vh-200px)] overflow-y-auto hide-scrollbar">
          {loading ? (
            // Skeleton
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-3.5 rounded bg-slate-200 dark:bg-slate-700 animate-pulse flex-1" />
              </div>
            ))
          ) : (
            categories.map((cat) => {
              const imgUrl = getCategoryImageUrl(cat.slug);
              return (
                <Link
                  key={cat.id}
                  href={`/live?categoryId=${cat.id}`}
                  className="group flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-primary/5 hover:text-primary dark:hover:text-primary transition-all rounded-lg mx-2"
                >
                  {imgUrl ? (
                    <div className="relative w-[18px] h-[18px] rounded overflow-hidden shrink-0">
                      <Image
                        src={imgUrl}
                        alt={cat.name}
                        fill
                        sizes="18px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : cat.iconUrl ? (
                    <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-primary transition-colors">
                      {cat.iconUrl}
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-primary transition-colors">
                      category
                    </span>
                  )}
                  <span className="flex-1 truncate">{cat.name}</span>
                </Link>
              );
            })
          )}
        </nav>
      </div>
    </aside>
  );
}

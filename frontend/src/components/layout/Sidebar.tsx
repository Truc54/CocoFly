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
    <aside className="hidden lg:block w-[240px] shrink-0 self-start sticky top-[102px] h-[calc(100vh-120px)] overflow-y-auto pb-4 pr-1 scrollbar-thin">
      <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-[4px_4px_0px_#E2B9A1] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-primary/5">
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-700 dark:text-slate-200">
            Danh mục
          </h3>
        </div>

        {/* Category list */}
        <nav className="py-1">
          {loading ? (
            // Skeleton
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 mx-2 my-1">
                <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
                <div className="h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse flex-1" />
              </div>
            ))
          ) : (
            categories.map((cat) => {
              const imgUrl = getCategoryImageUrl(cat.slug);
              return (
                <Link
                  key={cat.id}
                  href={`/live?categoryId=${cat.id}`}
                  className="group flex items-center gap-3 px-3 py-2.5 text-[15px] font-bold text-slate-700 dark:text-slate-200 hover:bg-primary/5 hover:text-primary dark:hover:text-primary transition-all rounded-xl mx-2 my-1 border border-transparent hover:border-primary/10"
                >
                  {imgUrl ? (
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
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
                    <span className="material-symbols-outlined text-[22px] text-slate-400 group-hover:text-primary transition-colors">
                      {cat.iconUrl}
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[22px] text-slate-400 group-hover:text-primary transition-colors">
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

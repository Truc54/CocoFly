"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/live", label: "Đấu giá đang diễn ra" },
  { href: "/upcoming", label: "Sắp diễn ra" },
  { href: "/how-it-works", label: "Cách hoạt động" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-background-dark border-b border-primary/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <Image
            src="/logo.jpeg"
            alt="CocoFly Logo"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <span className="text-2xl font-extrabold tracking-tight text-primary">CocoFly</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm font-semibold cursor-pointer transition-colors duration-200 pb-1 after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300 ${
                  isActive
                    ? "text-primary after:w-full"
                    : "hover:text-primary after:w-0 hover:after:w-full"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button className="px-5 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-primary/5 dark:hover:bg-primary/20 rounded-xl transition-all cursor-pointer">Đăng nhập</button>
          <button className="px-5 py-2 text-sm font-bold bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer">Đăng ký</button>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Gavel,
  CreditCard,
  Scale,
  FolderTree,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { authStorage } from "@/lib/auth-storage";

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export default function AdminSidebar({ isCollapsed, setIsCollapsed }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: Users, label: "Người dùng", href: "/admin/users" },
    { icon: Gavel, label: "Đấu giá", href: "/admin/auctions" },
    { icon: CreditCard, label: "Thanh toán", href: "/admin/payments" },
    { icon: Scale, label: "Tranh chấp", href: "/admin/disputes" },
    { icon: FolderTree, label: "Danh mục", href: "/admin/categories" },
    { icon: Settings, label: "Cấu hình", href: "/admin/config" },
    { icon: FileText, label: "Nhật ký", href: "/admin/audit-logs" },
  ];

  const handleLogout = () => {
    authStorage.clear();
    window.dispatchEvent(new Event("auth-change"));
    router.push("/login");
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-dvh bg-white border-r border-slate-100 flex flex-col z-30 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4 bg-white relative">
        {!isCollapsed ? (
          <>
            <Link href="/admin" className="flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
              <Image
                src="/logo.png"
                alt="CocoFly Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="brand-text text-lg font-bold text-[#8f5c38] tracking-wider">
                CocoFly
              </span>

            </Link>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors duration-200 cursor-pointer hidden md:block animate-[fadeIn_0.2s_ease-out]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-center animate-[fadeIn_0.2s_ease-out]">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors duration-200 cursor-pointer hidden md:block"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Links */}
      <nav className="flex-1 py-6 px-2 space-y-1.5 overflow-y-auto custom-scrollbar bg-white">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center transition-all duration-200 relative group cursor-pointer ${
                isCollapsed
                  ? "w-11 h-11 justify-center rounded-xl mx-auto"
                  : "gap-3 px-3 py-2.5 mx-2 rounded-xl"
              } ${
                isActive
                  ? "bg-[#8f5c38] text-white shadow-sm shadow-[#8f5c38]/15"
                  : "text-slate-500 hover:text-[#8f5c38] hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${isActive ? "text-white" : "text-slate-400 group-hover:text-[#8f5c38]"}`} />
              
              {!isCollapsed && (
                <span className="text-sm font-semibold tracking-wide font-sans">{item.label}</span>
              )}

              {/* Tooltip when collapsed */}
              {isCollapsed && (
                <div className="absolute left-16 bg-slate-800 text-white px-2 py-1 text-xs font-semibold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer (Logout only, as avatar is moved to Header) */}
      <div className="border-t border-slate-100 p-3 bg-white">
        <button
          onClick={handleLogout}
          className={`flex items-center transition-all duration-200 relative group cursor-pointer ${
            isCollapsed
              ? "w-11 h-11 justify-center rounded-xl mx-auto"
              : "w-full gap-3 px-3 py-2.5 rounded-xl"
          } text-slate-500 hover:text-red-600 hover:bg-red-50`}
        >
          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500 flex-shrink-0 transition-colors duration-200" />
          {!isCollapsed && <span className="text-sm font-semibold font-sans">Đăng xuất</span>}
          
          {isCollapsed && (
            <div className="absolute left-16 bg-slate-800 text-red-400 px-2 py-1 text-xs font-semibold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
              Đăng xuất
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}

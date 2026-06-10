"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authStorage } from "@/lib/auth-storage";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { ShieldAlert, Bell, Search } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [adminAvatar, setAdminAvatar] = useState("");

  useEffect(() => {
    setMounted(true);
    const user = authStorage.getUser() as any;
    const token = authStorage.getToken();

    if (token && user && user.role === "admin") {
      setIsAdmin(true);
      setAdminName(user.fullName || "CocoFly Admin");
      setAdminAvatar(user.avatarUrl || "");
    } else {
      router.push("/login");
    }
  }, [router]);

  const getPageTitle = () => {
    if (pathname === "/admin") return "Dashboard";
    if (pathname.startsWith("/admin/users")) return "Người dùng";
    if (pathname.startsWith("/admin/auctions")) return "Đấu giá";
    if (pathname.startsWith("/admin/payments")) return "Thanh toán";
    if (pathname.startsWith("/admin/disputes")) return "Tranh chấp";
    if (pathname.startsWith("/admin/categories")) return "Danh mục";
    if (pathname.startsWith("/admin/config")) return "Cấu hình";
    if (pathname.startsWith("/admin/audit-logs")) return "Nhật ký";
    return "Dashboard";
  };

  // Loading state to prevent hydration flashes and unauthorized view leaks
  if (!mounted || !isAdmin) {
    return (
      <div className="min-h-dvh bg-[#f4f6f9] flex flex-col items-center justify-center text-slate-700 select-none">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <ShieldAlert className="w-12 h-12 text-emerald-500" />
          <p className="font-sans font-bold text-xl tracking-wider uppercase text-slate-800">Xác thực quyền quản trị...</p>
          <div className="w-48 h-[2px] bg-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-emerald-500 animate-[loading_1.5s_infinite_ease-in-out]" />
          </div>
        </div>
        
        {/* Inline CSS animation for loader bar */}
        <style jsx global>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(150%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#f4f6f9] text-slate-800 antialiased font-sans">
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Outer Container */}
      <div
        className={`min-h-dvh transition-all duration-300 ${
          isCollapsed ? "pl-16" : "pl-60"
        }`}
      >
        {/* Top Header with dynamic title & search */}
        <header className="h-16 border-b border-slate-100 bg-white sticky top-0 z-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            {/* Search bar grouped next to the bell */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 w-60 transition-all focus-within:bg-white focus-within:border-slate-200">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full bg-transparent border-none outline-none text-xs text-slate-600 placeholder-slate-400"
              />
            </div>

            {/* Notification Bell */}
            <div className="relative p-1.5 hover:bg-slate-50 rounded-full cursor-pointer text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5.5 h-5.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </div>

            {/* Profile Avatar & Info */}
            <div className="flex items-center gap-2.5 border-l border-slate-100 pl-6">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-500 font-mono text-sm">
                {adminAvatar ? (
                  <img src={adminAvatar} alt={adminName} className="w-full h-full object-cover" />
                ) : (
                  adminName.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">{adminName}</p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">Quản trị viên</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="p-6 md:p-8 max-w-7xl mx-auto animate-[fadeIn_0.4s_ease-out] min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

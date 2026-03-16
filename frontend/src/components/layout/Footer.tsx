import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-background-dark border-t border-primary/10 px-6 lg:px-20 py-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2">
          <Image src="/logo.jpeg" alt="CocoFly" width={32} height={32} className="rounded" />
          <span className="font-bold text-primary">CocoFly</span>
          <span className="text-sm text-slate-400 ml-4 hidden sm:inline-block">© {new Date().getFullYear()} Nền tảng đấu giá trực tuyến hàng đầu</span>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link className="text-sm font-medium text-slate-500 hover:text-primary transition-colors" href="/privacy">Chính sách bảo mật</Link>
          <Link className="text-sm font-medium text-slate-500 hover:text-primary transition-colors" href="/terms">Điều khoản sử dụng</Link>
          <Link className="text-sm font-medium text-slate-500 hover:text-primary transition-colors" href="/contact">Liên hệ</Link>
        </div>
      </div>
    </footer>
  );
}

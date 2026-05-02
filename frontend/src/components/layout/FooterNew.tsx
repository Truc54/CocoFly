import Link from "next/link";
import Image from "next/image";

const FOOTER_LINKS = {
  about: {
    title: "Về chúng tôi",
    links: [
      { label: "Giới thiệu COCOFLY", href: "/about" },
      { label: "Điều khoản sử dụng", href: "/terms" },
      { label: "Chính sách bảo mật", href: "/privacy" },
      { label: "Quy chế hoạt động", href: "/regulations" },
    ],
  },
  support: {
    title: "Hỗ trợ",
    links: [
      { label: "Câu hỏi thường gặp", href: "/faq" },
      { label: "Hướng dẫn đấu giá", href: "/how-it-works" },
      { label: "Cách hoạt động", href: "/how-it-works" },
      { label: "Liên hệ hỗ trợ", href: "/contact" },
    ],
  },
};

export default function FooterNew() {
  return (
    <footer className="bg-slate-900 text-white">
      {/* Main footer */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.jpeg"
                alt="COCOFLY Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="brand-text text-2xl text-white">COCOFLY</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Nền tảng đấu giá trực tuyến hàng đầu Việt Nam. Mua bán sản phẩm
              chất lượng với giá tốt nhất.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: "M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z", label: "Twitter" },
                { icon: "M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z", label: "Facebook" },
              ].map(({ icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-primary transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d={icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: About */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
              {FOOTER_LINKS.about.title}
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.about.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Support */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
              {FOOTER_LINKS.support.title}
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.support.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
              Liên hệ
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary text-lg mt-0.5">mail</span>
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <a href="mailto:support@cocofly.vn" className="text-sm text-slate-300 hover:text-white transition-colors">
                    support@cocofly.vn
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary text-lg mt-0.5">call</span>
                <div>
                  <p className="text-xs text-slate-500">Hotline</p>
                  <a href="tel:1900xxxx" className="text-sm text-slate-300 hover:text-white transition-colors">
                    1900 xxxx
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary text-lg mt-0.5">location_on</span>
                <div>
                  <p className="text-xs text-slate-500">Địa chỉ</p>
                  <p className="text-sm text-slate-300">TP. Hồ Chí Minh, Việt Nam</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4">
          <p className="text-center text-xs text-slate-500">
            © {new Date().getFullYear()} COCOFLY. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}

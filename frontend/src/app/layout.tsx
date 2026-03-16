import { Poppins, Manrope } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata = {
  title: "CocoFly - Nền tảng đấu giá trực tuyến",
  description: "Khám phá những phiên đấu giá hấp dẫn nhất và sở hữu sản phẩm yêu thích với giá cực hời.",
  icons: {
    icon: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${poppins.variable} ${manrope.variable} font-body antialiased bg-background-light dark:bg-background-dark text-text-main dark:text-slate-100 flex min-h-screen flex-col transition-colors duration-300`}
      >
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

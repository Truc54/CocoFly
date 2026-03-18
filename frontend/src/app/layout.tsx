import { Bebas_Neue, Roboto_Flex } from "next/font/google";
import AppChrome from "@/components/layout/AppChrome";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: ["400"],
});

const roboto = Roboto_Flex({
  variable: "--font-roboto",
  subsets: ["latin"],
});

export const metadata = {
  title: "COCOFLY - Nền tảng đấu giá trực tuyến",
  description: "Khám phá những phiên đấu giá hấp dẫn nhất và sở hữu sản phẩm yêu thích với giá cực hời.",
  icons: {
    icon: [
      { url: "/logo.jpeg", type: "image/jpeg" },
      { url: "/logo.jpeg", rel: "shortcut icon" },
    ],
    shortcut: "/logo.jpeg",
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
        <link rel="icon" href="/logo.jpeg" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${bebasNeue.variable} ${roboto.variable} font-body font-medium antialiased bg-background-light dark:bg-background-dark text-text-main dark:text-slate-100 flex min-h-screen flex-col transition-colors duration-300`}
      >
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}

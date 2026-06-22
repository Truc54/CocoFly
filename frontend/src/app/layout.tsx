import { Oswald, Roboto_Flex } from "next/font/google";
import AppChrome from "@/components/layout/AppChrome";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const roboto = Roboto_Flex({
  variable: "--font-roboto",
  subsets: ["latin"],
});

export const metadata = {
  title: "CocoFly",
  description: "Khám phá những phiên đấu giá hấp dẫn nhất và sở hữu sản phẩm yêu thích với giá cực hời.",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/logo.png", rel: "shortcut icon" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
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
        <link rel="icon" href="/logo.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${oswald.variable} ${roboto.variable} font-body font-medium antialiased bg-background-light dark:bg-background-dark text-text-main dark:text-slate-100 flex min-h-screen flex-col transition-colors duration-300`}
      >
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}

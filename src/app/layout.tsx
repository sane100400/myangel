import type { Metadata } from "next";
import { Cormorant_Garamond, Gowun_Batang, Gothic_A1, Libre_Bodoni } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  preload: false,
});

const serifKr = Gowun_Batang({
  variable: "--font-serif-kr",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

const sans = Gothic_A1({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
  display: "swap",
});

const logo = Libre_Bodoni({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyAngel — AI 이미지 생성 & 프롬프트 마켓",
  description:
    "트렌드에 맞는 프롬프트 큐레이팅으로 나만의 이미지를 만들고, 취향 담긴 프롬프트를 사고팔아요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${serif.variable} ${serifKr.variable} ${sans.variable} ${logo.variable} font-sans antialiased`}
      >
        <Navbar />
        <main className="min-h-[calc(100vh-4.5rem)]">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}

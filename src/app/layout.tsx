import type { Metadata } from "next";
import { Libre_Bodoni } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const logo = Libre_Bodoni({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["700"],
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${logo.variable} font-sans antialiased`}
      >
        <Navbar />
        <main className="min-h-[calc(100vh-4.5rem)]">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}

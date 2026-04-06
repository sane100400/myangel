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
  title: "MyAngel — 인터랙티브 프롬프트 최적화 AI 이미지 스튜디오",
  description:
    "간단한 입력을 오브젝트 단위로 분해하고, 추상적 표현을 강화하여 최적화된 프롬프트로 AI 이미지를 생성하세요.",
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

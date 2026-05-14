import type { Metadata } from "next";
import { Inter, Libre_Bodoni } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { ErrorReporterMount } from "@/components/error-reporter-mount";
import "./globals.css";

const logo = Libre_Bodoni({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  preload: false,
});

const english = Inter({
  variable: "--font-en",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "MyAngel — AI 이미지 생성·부분 수정·공유",
  description:
    "문장이나 참고 이미지로 만들고, 원하는 부분만 다시 고친 뒤, 완성본을 저장하고 공유하는 AI 이미지 스튜디오입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${english.variable} ${logo.variable} font-sans antialiased`}
      >
        <a href="#main-content" data-skip-link>
          본문으로 건너뛰기
        </a>
        <Navbar />
        <main id="main-content" className="min-h-[calc(100vh-4.5rem)]">
          {children}
        </main>
        <Footer />
        <Toaster />
        <ErrorReporterMount />
      </body>
    </html>
  );
}

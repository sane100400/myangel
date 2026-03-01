"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AngelLogo } from "@/components/ui/angel-logo";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/generate", label: "Generate" },
  { href: "/discover", label: "Discover" },
  { href: "/boards", label: "Mypage" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 lace-bottom">
      {/* Background — mobile: opaque (no blur), desktop: glassmorphism */}
      <div className="absolute inset-0 bg-[#f0f4fb] md:bg-[#f0f4fb]/85 md:backdrop-blur-xl" />

      <nav className="relative mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:h-[72px] md:px-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <AngelLogo size={32} priority className="transition-transform duration-300 group-hover:scale-110" />
          <span className="text-base tracking-[0.1em] text-[var(--angel-text)] font-heading md:text-lg">
            My<span className="text-[var(--angel-blue)]">Angel</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link flex flex-col items-center gap-0.5 px-4 py-1 text-[12px] tracking-[0.08em] ${
                  isActive
                    ? "nav-link-active text-[var(--angel-text)]"
                    : "text-[var(--angel-text-soft)]"
                }`}
              >
                <span className={`text-[10px] text-[var(--angel-lavender)] transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-0"}`}>
                  ✦
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Auth */}
        <div className="hidden items-center md:flex">
          <Link
            href="/auth/login"
            className="rounded-full border border-[var(--angel-text)]/20 bg-white/50 px-5 py-1.5 text-[11px] tracking-[0.08em] text-[var(--angel-text)] transition-all hover:bg-white/80 hover:border-[var(--angel-blue)]/40 hover:text-[var(--angel-blue)]"
          >
            Login
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors active:bg-white/50 md:hidden"
          aria-label="메뉴"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-[var(--angel-text-soft)]">
            {mobileOpen ? (
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            ) : (
              <>
                <path d="M2 4H14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M4 8H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M2 12H14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="relative border-t border-white/20 bg-[#edf1fa]/95 backdrop-blur-xl px-5 pb-4 pt-2 md:hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 py-3 text-[14px] tracking-[0.06em] transition-colors ${
                  isActive
                    ? "text-[var(--angel-text)] font-medium"
                    : "text-[var(--angel-text-soft)]"
                }`}
              >
                <span className={`text-[8px] text-[var(--angel-lavender)] ${isActive ? "opacity-100" : "opacity-30"}`}>✦</span>
                {item.label}
              </Link>
            );
          })}
          <div className="mt-2 pt-3 border-t border-white/20">
            <Link
              href="/auth/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center py-2.5 rounded-xl border border-[var(--angel-text)]/15 bg-white/50 text-[13px] tracking-[0.06em] text-[var(--angel-text-soft)]"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

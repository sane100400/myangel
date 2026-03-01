"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AngelLogo } from "@/components/ui/angel-logo";
import { GothicCross } from "@/components/ui/gothic-cross";

const NAV_ITEMS = [
  { href: "/discover", label: "Discover" },
  { href: "/moodboard", label: "Moodboard" },
  { href: "/boards", label: "My Board" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 lace-bottom">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-[#f0f4fb]/85 backdrop-blur-xl" />

      <nav className="relative mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <AngelLogo size={36} className="transition-transform duration-300 group-hover:scale-110" />
          <span
            className="text-lg tracking-[0.1em] text-[var(--angel-text)]"
            style={{ fontFamily: "var(--font-logo), 'Libre Bodoni', serif", fontWeight: 700 }}
          >
            My<span className="text-[var(--angel-blue)]">Angel</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative px-4 py-1.5 text-[12px] tracking-[0.08em] transition-all duration-300 ${
                pathname === item.href
                  ? "text-[var(--angel-text)]"
                  : "text-[var(--angel-text-soft)] hover:text-[var(--angel-text)]"
              }`}
            >
              {item.label}
              {pathname === item.href && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-gradient-to-r from-[var(--angel-blue)] to-[var(--angel-lavender)]" />
              )}
            </Link>
          ))}
        </div>

        {/* Auth + decorative */}
        <div className="hidden items-center gap-3 md:flex">
          <span className="text-[8px] text-[var(--angel-lavender)] opacity-50">✦</span>
          <Link
            href="/auth/login"
            className="angel-btn-secondary rounded-full px-5 py-1.5 text-[11px] tracking-[0.08em]"
          >
            Login
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/50 md:hidden"
          aria-label="메뉴"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--angel-text-soft)]">
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
        <div className="relative border-t border-white/20 bg-[#edf1fa]/90 backdrop-blur-xl px-5 pb-4 pt-2 md:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 py-2.5 text-[12px] tracking-[0.08em] transition-colors ${
                pathname === item.href
                  ? "text-[var(--angel-text)]"
                  : "text-[var(--angel-text-soft)]"
              }`}
            >
              <span className="text-[8px] text-[var(--angel-lavender)] opacity-40">✦</span>
              {item.label}
            </Link>
          ))}
          <div className="mt-2 pt-2 border-t border-white/15">
            <Link
              href="/auth/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-2.5 text-[12px] tracking-[0.08em] text-[var(--angel-text-soft)]"
            >
              <GothicCross size={16} color="var(--angel-lavender)" />
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

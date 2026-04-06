import Link from "next/link";
import { AngelLogo } from "@/components/ui/angel-logo";
import { GothicCross } from "@/components/ui/gothic-cross";

export function Footer() {
  return (
    <footer className="relative lace-top">
      <div className="absolute inset-0 bg-gradient-to-b from-[#e8ecf6] to-[#e2e7f2]" />

      <div className="relative mx-auto max-w-5xl px-4 pt-10 pb-6 md:px-5 md:pt-14 md:pb-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-5 md:gap-3 md:mb-6">
          <AngelLogo size={26} />
          <span className="text-sm tracking-[0.12em] text-[var(--angel-text)] font-heading md:text-base">
            My<span className="text-[var(--angel-blue)]">Angel</span>
          </span>
          <p className="text-[9px] tracking-[0.25em] text-[var(--angel-text-faint)] uppercase">
            interactive prompt optimization studio
          </p>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 mb-5 md:mb-6">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--angel-lavender)]/30 md:w-16" />
          <GothicCross size={12} color="var(--angel-lavender)" />
          <span className="text-[8px] text-[var(--angel-lavender)]/40 twinkle">✦</span>
          <GothicCross size={12} color="var(--angel-lavender)" />
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--angel-lavender)]/30 md:w-16" />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 text-[11px] tracking-[0.08em] text-[var(--angel-text-soft)] mb-5 md:gap-6 md:mb-6">
          <Link href="/" className="transition-colors hover:text-[var(--angel-text)]">Home</Link>
          <span className="text-[8px] text-[var(--angel-lavender)]/30">✟</span>
          <Link href="/generate" className="transition-colors hover:text-[var(--angel-text)]">Studio</Link>
          <span className="text-[8px] text-[var(--angel-lavender)]/30">✟</span>
          <Link href="/discover" className="transition-colors hover:text-[var(--angel-text)]">Discover</Link>
          <span className="text-[8px] text-[var(--angel-lavender)]/30">✟</span>
          <Link href="/boards" className="transition-colors hover:text-[var(--angel-text)]">Mypage</Link>
        </div>

        {/* Copyright */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-[7px] text-[var(--angel-lavender)]/30">✦</span>
          <p className="text-[9px] tracking-[0.12em] text-[var(--angel-text-faint)]">
            &copy; 2026 MyAngel
          </p>
          <span className="text-[7px] text-[var(--angel-lavender)]/30">✦</span>
        </div>
      </div>
    </footer>
  );
}

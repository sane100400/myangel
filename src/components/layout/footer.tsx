import Link from "next/link";
import { AngelLogo } from "@/components/ui/angel-logo";
import { GothicCross } from "@/components/ui/gothic-cross";

export function Footer() {
  return (
    <footer className="relative lace-top">
      {/* Slightly darker bg than header to differentiate */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#e8ecf6] to-[#e2e7f2]" />

      <div className="relative mx-auto max-w-5xl px-5 pt-14 pb-8">
        {/* Top: Logo centered with decorative line */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <AngelLogo size={28} />
          <span className="text-base tracking-[0.12em] text-[var(--angel-text)] font-heading">
            My<span className="text-[var(--angel-blue)]">Angel</span>
          </span>
          <p className="text-[9px] tracking-[0.25em] text-[var(--angel-text-faint)] uppercase">
            your angelic mood curator
          </p>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--angel-lavender)]/30" />
          <GothicCross size={14} color="var(--angel-lavender)" />
          <span className="text-[8px] text-[var(--angel-lavender)]/40 twinkle">✦</span>
          <GothicCross size={14} color="var(--angel-lavender)" />
          <span className="h-px w-16 bg-gradient-to-l from-transparent to-[var(--angel-lavender)]/30" />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-6 text-[11px] tracking-[0.08em] text-[var(--angel-text-soft)] mb-6">
          <Link href="/discover" className="transition-colors hover:text-[var(--angel-text)]">
            Discover
          </Link>
          <span className="text-[8px] text-[var(--angel-lavender)]/30">✟</span>
          <Link href="/moodboard" className="transition-colors hover:text-[var(--angel-text)]">
            Moodboard
          </Link>
          <span className="text-[8px] text-[var(--angel-lavender)]/30">✟</span>
          <Link href="/boards" className="transition-colors hover:text-[var(--angel-text)]">
            Mypage
          </Link>
        </div>

        {/* Bottom: copyright with tiny ornament */}
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

import Link from "next/link";
import { AngelLogo } from "@/components/ui/angel-logo";
import { GothicCross } from "@/components/ui/gothic-cross";

export function Footer() {
  return (
    <footer className="relative lace-top">
      {/* Glass background */}
      <div className="absolute inset-0 bg-[#f0f4fb]/85 backdrop-blur-md" />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-5 py-12 text-[11px] text-[var(--angel-text-soft)] md:flex-row md:justify-between">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2">
          <AngelLogo size={28} />
          <span
            className="text-base tracking-[0.1em] text-[var(--angel-text)]"
            style={{ fontFamily: "var(--font-logo), 'Libre Bodoni', serif", fontWeight: 700 }}
          >
            My<span className="text-[var(--angel-blue)]">Angel</span>
          </span>
          <p className="text-[10px] tracking-[0.1em] text-[var(--angel-text-faint)]">
            ✦ your angelic mood curator ✦
          </p>
        </div>

        {/* Nav */}
        <div className="flex items-center gap-6 tracking-[0.08em]">
          <Link href="/discover" className="transition-colors hover:text-[var(--angel-text)]">
            Discover
          </Link>
          <GothicCross size={16} color="var(--angel-lavender)" />
          <Link href="/moodboard" className="transition-colors hover:text-[var(--angel-text)]">
            Moodboard
          </Link>
          <GothicCross size={16} color="var(--angel-lavender)" />
          <Link href="/boards" className="transition-colors hover:text-[var(--angel-text)]">
            My Board
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-[10px] tracking-wider text-[var(--angel-text-faint)]">
          &copy; 2026 MyAngel
        </p>
      </div>
    </footer>
  );
}

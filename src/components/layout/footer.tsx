import Link from "next/link";
import { AngelLogo } from "@/components/ui/angel-logo";

export function Footer() {
  return (
    <footer className="border-t border-[var(--angel-border)] bg-[var(--angel-surface)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-5">
        <div className="flex items-center gap-3">
          <AngelLogo size={26} />
          <div>
            <span lang="en" className="text-sm text-[var(--angel-text)] font-heading md:text-base">
              My<span className="text-[var(--angel-blue)]">Angel</span>
            </span>
            <p lang="en" className="font-en mt-0.5 text-[12px] text-[var(--angel-text-faint)]">
              Bilingual AI image studio
            </p>
          </div>
        </div>

        <nav lang="en" className="font-en flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-bold text-[var(--angel-text-soft)]">
          <Link href="/" prefetch={false} className="transition-colors hover:text-[var(--angel-text)]">
            Home
          </Link>
          <Link href="/generate" prefetch={false} className="transition-colors hover:text-[var(--angel-text)]">
            Studio
          </Link>
          <Link href="/discover" prefetch={false} className="transition-colors hover:text-[var(--angel-text)]">
            Discover
          </Link>
          <Link href="/boards" prefetch={false} className="transition-colors hover:text-[var(--angel-text)]">
            Mypage
          </Link>
          <Link href="/terms" prefetch={false} className="transition-colors hover:text-[var(--angel-text)]">
            Terms
          </Link>
        </nav>

        <p lang="en" className="font-en text-[12px] text-[var(--angel-text-faint)]">&copy; 2026 MyAngel</p>
      </div>
    </footer>
  );
}

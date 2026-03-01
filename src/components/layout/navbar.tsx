"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AngelLogo } from "@/components/ui/angel-logo";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/generate", label: "Generate" },
  { href: "/discover", label: "Discover" },
  { href: "/boards", label: "Mypage" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // 초기 유저 로드
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // auth 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setLoggingOut(false);
    router.refresh();
  };

  // 아바타 URL (Google/Kakao 프로필 이미지)
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayEmail = user?.email ? (user.email.length > 18 ? user.email.slice(0, 15) + "..." : user.email) : "";

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

        {/* Auth — Desktop */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {avatarUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-7 w-7 rounded-full border border-[var(--angel-border)] object-cover"
                />
              )}
              <span className="text-[11px] text-[var(--angel-text-soft)] max-w-[120px] truncate">
                {displayEmail}
              </span>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-full border border-[var(--angel-text)]/20 bg-white/50 px-4 py-1.5 text-[11px] tracking-[0.08em] text-[var(--angel-text-soft)] transition-all hover:bg-white/80 hover:border-red-300 hover:text-red-500 disabled:opacity-50"
              >
                {loggingOut ? "..." : "Logout"}
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-full border border-[var(--angel-text)]/20 bg-white/50 px-5 py-1.5 text-[11px] tracking-[0.08em] text-[var(--angel-text)] transition-all hover:bg-white/80 hover:border-[var(--angel-blue)]/40 hover:text-[var(--angel-blue)]"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile: Login + Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {!user && (
            <Link
              href="/auth/login"
              className="rounded-full border border-[var(--angel-text)]/20 bg-white/50 px-3.5 py-1.5 text-[11px] tracking-[0.06em] text-[var(--angel-text-soft)] transition-all active:bg-white/80"
            >
              Login
            </Link>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors active:bg-white/50"
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
        </div>
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
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {avatarUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-7 w-7 rounded-full border border-[var(--angel-border)] object-cover shrink-0"
                    />
                  )}
                  <span className="text-[12px] text-[var(--angel-text-soft)] truncate">
                    {displayEmail}
                  </span>
                </div>
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  disabled={loggingOut}
                  className="shrink-0 rounded-xl border border-[var(--angel-text)]/15 bg-white/50 px-4 py-2 text-[12px] text-red-400 transition-colors hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center py-2.5 rounded-xl border border-[var(--angel-text)]/15 bg-white/50 text-[13px] tracking-[0.06em] text-[var(--angel-text-soft)]"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

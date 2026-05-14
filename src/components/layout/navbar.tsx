"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AngelLogo } from "@/components/ui/angel-logo";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { User } from "@supabase/supabase-js";
import { Menu, X } from "lucide-react";

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
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    void import("@/lib/supabase/client").then(({ createClient }) => {
      if (!mounted) return;
      const supabase = createClient();

      // 초기 유저 로드
      supabase.auth.getUser().then(({ data }) => {
        if (mounted) setUser(data.user);
      });

      // auth 상태 변경 구독
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (mounted) setUser(session?.user ?? null);
        }
      );
      unsubscribe = () => subscription.unsubscribe();
    });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setLoggingOut(false);
    router.refresh();
  };

  // 아바타 URL (Google/Kakao 프로필 이미지)
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayEmail = user?.email ? (user.email.length > 18 ? user.email.slice(0, 15) + "..." : user.email) : "";
  const displayName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--angel-border)] bg-[var(--angel-surface)]/94 backdrop-blur-md">
      <nav className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16 md:px-5">
        {/* Logo */}
        <Link href="/" prefetch={false} className="flex items-center gap-2 group">
          <AngelLogo size={28} priority className="transition-transform duration-200 group-hover:scale-[1.04]" />
          <span lang="en" className="text-base text-[var(--angel-text)] font-heading md:text-lg">
            My<span className="text-[var(--angel-blue)]">Angel</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 rounded-lg border border-[var(--angel-border)] bg-[var(--angel-surface-muted)] p-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/generate" && pathname === "/edit");
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                lang="en"
                className={`nav-link font-en flex min-h-8 items-center rounded-md px-3 text-[13px] font-bold ${
                  isActive
                    ? "bg-[var(--angel-surface)] text-[var(--angel-blue)] shadow-[0_1px_0_rgba(53,111,165,0.08)]"
                    : "text-[var(--angel-text-soft)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Auth — Desktop */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <UserAvatar
                src={avatarUrl}
                name={displayName}
                className="h-7 w-7"
                fallbackClassName="text-[11px]"
              />
              <span className="text-[13px] text-[var(--angel-text-soft)] max-w-[120px] truncate">
                {displayEmail}
              </span>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="secondary-action min-h-8 px-3 text-[12px] disabled:opacity-50"
              >
                <span lang="en" className="font-en">{loggingOut ? "..." : "Logout"}</span>
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              prefetch={false}
              className="secondary-action min-h-8 px-4 text-[12px]"
            >
              <span lang="en" className="font-en">Login</span>
            </Link>
          )}
        </div>

        {/* Mobile: Login + Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {!user && (
            <Link
              href="/auth/login"
              prefetch={false}
              className="secondary-action min-h-8 px-3 text-[12px]"
            >
              <span lang="en" className="font-en">Login</span>
            </Link>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--angel-border)] bg-[var(--angel-surface)] text-[var(--angel-text-soft)] transition-colors active:bg-[var(--angel-bg-soft)]"
            aria-label="메뉴"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="relative border-t border-[var(--angel-border)] bg-[var(--angel-surface)] px-5 pb-4 pt-2 md:hidden">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/generate" && pathname === "/edit");
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={() => setMobileOpen(false)}
                lang="en"
                className={`font-en flex items-center gap-3 rounded-md px-2 py-3 text-[14px] font-bold transition-colors ${
                  isActive
                    ? "bg-[var(--angel-surface-muted)] text-[var(--angel-blue)]"
                    : "text-[var(--angel-text-soft)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="mt-2 border-t border-[var(--angel-border)] pt-3">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar
                    src={avatarUrl}
                    name={displayName}
                    className="h-7 w-7"
                    fallbackClassName="text-[11px]"
                  />
                  <span className="text-[14px] text-[var(--angel-text-soft)] truncate">
                    {displayEmail}
                  </span>
                </div>
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  disabled={loggingOut}
                  className="secondary-action shrink-0 text-red-500"
                >
                  <span lang="en" className="font-en">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                prefetch={false}
                onClick={() => setMobileOpen(false)}
                className="secondary-action flex w-full"
              >
                <span lang="en" className="font-en">Login</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

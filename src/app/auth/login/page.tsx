"use client";

import { createClient } from "@/lib/supabase/client";
import { AngelLogo } from "@/components/ui/angel-logo";
import { GothicCross } from "@/components/ui/gothic-cross";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleKakaoLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="relative flex min-h-[60vh] items-center justify-center px-5 star-bg">
      {/* Background */}
      <div className="absolute inset-0 gradient-mesh" />

      <div className="relative glass-card w-full max-w-sm rounded-3xl p-8">
        {/* Cross top */}
        <div className="cross-deco text-center mb-4 flex justify-center"><GothicCross size={22} /></div>

        <div className="text-center mb-8">
          <AngelLogo size={56} className="mx-auto mb-4 float-gentle" />
          <h1
            className="text-2xl font-medium tracking-[0.08em] text-[var(--angel-text)]"
            style={{ fontFamily: "var(--font-serif-kr), var(--font-serif), 'Gowun Batang', 'Cormorant Garamond', serif" }}
          >
            My<span className="shimmer-text">Angel</span>
          </h1>
          <p className="mt-2 text-[12px] text-[var(--angel-text-soft)]">
            로그인하면 무드보드를 저장할 수 있어요
          </p>

          {/* Celestial divider */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/30" />
            <span className="text-[8px] text-[var(--angel-lavender)] twinkle">✦ ✧ ✦</span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/30" />
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 py-3 text-[12px] tracking-[0.06em] text-[var(--angel-text)] transition-all hover:bg-white/80 hover:shadow-[0_0_16px_rgba(126,184,216,0.1)]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 계속하기
          </button>

          <button
            onClick={handleKakaoLogin}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-[#FEE500]/80 backdrop-blur-sm border border-[#FEE500]/40 py-3 text-[12px] tracking-[0.06em] text-[#3C1E1E] transition-all hover:bg-[#FEE500] hover:shadow-[0_0_16px_rgba(254,229,0,0.15)]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#3C1E1E"
                d="M12 3C6.477 3 2 6.463 2 10.691c0 2.72 1.804 5.106 4.516 6.467l-1.147 4.243a.37.37 0 0 0 .56.398l4.89-3.225a13.17 13.17 0 0 0 1.181.052c5.523 0 10-3.463 10-7.735S17.523 3 12 3z"
              />
            </svg>
            카카오로 계속하기
          </button>
        </div>

        {/* Cross bottom */}
        <div className="cross-deco text-center mt-6 flex justify-center"><GothicCross size={22} /></div>
      </div>
    </div>
  );
}

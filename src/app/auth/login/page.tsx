"use client";

import { createClient } from "@/lib/supabase/client";
import { AngelLogo } from "@/components/ui/angel-logo";

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
    <div className="flex min-h-[70vh] items-center justify-center px-5 pt-10">
      <div className="w-full max-w-sm rounded-2xl border border-[#d0d8e8] bg-white/80 backdrop-blur-sm p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        {/* Logo */}
        <div className="text-center mb-8">
          <AngelLogo size={48} className="mx-auto mb-4" />
          <h1 className="font-heading text-2xl tracking-[0.08em] text-[var(--angel-text)]">
            My<span className="text-[var(--angel-blue)]">Angel</span>
          </h1>
          <p className="mt-2 text-[13px] text-[var(--angel-text-soft)]">
            로그인하면 무드보드를 저장할 수 있어요
          </p>
        </div>

        {/* Login Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white border border-[#d0d8e8] py-3 text-[13px] text-[var(--angel-text)] transition-all hover:bg-[#f8f9fc] hover:shadow-sm"
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
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#FEE500] border border-[#FEE500] py-3 text-[13px] text-[#3C1E1E] transition-all hover:bg-[#FFEB3B] hover:shadow-sm"
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

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-[var(--angel-text-soft)]">
          계속 진행하면 이용약관에 동의하는 것으로 간주합니다
        </p>
      </div>
    </div>
  );
}

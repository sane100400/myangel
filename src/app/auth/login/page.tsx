"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AngelLogo } from "@/components/ui/angel-logo";

const JUDGE_LOGIN = process.env.NEXT_PUBLIC_JUDGE_LOGIN ?? "";
const JUDGE_EMAIL = process.env.NEXT_PUBLIC_JUDGE_EMAIL ?? "";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(JUDGE_LOGIN || JUDGE_EMAIL);
  const [password, setPassword] = useState("");
  const [isEmailSigningIn, setIsEmailSigningIn] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password || isEmailSigningIn) return;
    setIsEmailSigningIn(true);
    setEmailError(null);
    const supabase = createClient();
    const loginValue = email.trim();
    const loginEmail =
      JUDGE_LOGIN && JUDGE_EMAIL && loginValue.toLowerCase() === JUDGE_LOGIN.toLowerCase()
        ? JUDGE_EMAIL
        : loginValue;
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    setIsEmailSigningIn(false);
    if (error) {
      setEmailError("아이디 또는 비밀번호를 확인해주세요.");
      return;
    }
    router.push("/generate");
    router.refresh();
  };

  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-5 pt-10 pb-10">
      <div className="surface-panel w-full max-w-sm p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <AngelLogo size={48} className="mx-auto mb-4" />
          <h1 lang="en" className="font-heading text-2xl text-[var(--angel-text)]">
            My<span className="text-[var(--angel-blue)]">Angel</span>
          </h1>
          <p className="mt-2 text-[15px] text-[var(--angel-text-soft)]">
            로그인하고 나만의 이미지와 프롬프트를 관리하세요
          </p>
        </div>

        {/* Login Buttons */}
        <div className="space-y-3">
          <div className="rounded-lg border border-[var(--angel-border)] bg-[var(--angel-surface-muted)] p-3">
            <p className="mb-3 text-[13px] font-bold text-[var(--angel-text)]">
              심사용 계정
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="아이디 또는 이메일"
                className="h-11 w-full rounded-lg border border-[var(--angel-border)] bg-white px-3 text-[14px] outline-none focus:border-[var(--angel-blue)]"
                autoComplete="username"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleEmailLogin();
                }}
                placeholder="비밀번호"
                className="h-11 w-full rounded-lg border border-[var(--angel-border)] bg-white px-3 text-[14px] outline-none focus:border-[var(--angel-blue)]"
                autoComplete="current-password"
              />
              {emailError && (
                <p className="text-[12px] font-medium text-red-500">{emailError}</p>
              )}
              <button
                type="button"
                onClick={() => {
                  void handleEmailLogin();
                }}
                disabled={!email.trim() || !password || isEmailSigningIn}
                className="primary-action min-h-11 w-full disabled:opacity-45"
              >
                {isEmailSigningIn ? "로그인 중..." : "이메일로 로그인"}
              </button>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="secondary-action min-h-12 w-full gap-3 text-[15px] text-[var(--angel-text)]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 계속하기
          </button>

        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[13px] text-[var(--angel-text-soft)]">
          계속 진행하면{" "}
          <Link href="/terms" className="font-bold text-[var(--angel-blue)] hover:underline">
            이용약관
          </Link>
          에 동의하는 것으로 간주합니다
        </p>
      </div>
    </div>
  );
}

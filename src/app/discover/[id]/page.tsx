"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";
import { SEED_MOOD_IMAGES, getImageUrl } from "@/lib/seed-data";

export default function DiscoverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const item = useMemo(
    () => SEED_MOOD_IMAGES.find((img) => img.id === id),
    [id]
  );

  if (!item) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
        <div className="text-2xl text-[var(--angel-lavender)] twinkle mb-3">✦</div>
        <p className="text-[13px] text-[var(--angel-text-soft)]">이미지를 찾을 수 없어요</p>
        <Link href="/discover" className="mt-4 angel-btn angel-btn-secondary text-[12px]">
          Discover로 돌아가기
        </Link>
      </div>
    );
  }

  const isPremium = "is_premium" in item && item.is_premium;

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 pb-16 md:px-5 md:pt-24">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-[12px] text-[var(--angel-text-soft)] hover:text-[var(--angel-blue)] transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        뒤로가기
      </button>

      <div className="flex flex-col md:flex-row gap-6 md:gap-10">
        {/* Image */}
        <div className="md:w-1/2 shrink-0">
          <div className="glass-card rounded-2xl p-2 relative">
            {isPremium && (
              <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-[#ffd700]/90 px-2.5 py-1 shadow-md">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" stroke="#b8860b" strokeWidth="1">
                  <path d="M3 18h18V8l-4 4-5-6-5 6-4-4v10z" />
                </svg>
                <span className="text-[10px] font-medium text-white">프리미엄</span>
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getImageUrl(item.id, "full")}
              alt={item.title || "무드 이미지"}
              className="w-full h-auto rounded-xl"
            />
          </div>
        </div>

        {/* Info */}
        <div className="md:w-1/2 flex flex-col">
          {/* Title */}
          <h1 className="font-heading text-2xl font-medium tracking-[0.06em] text-[var(--angel-text)] md:text-3xl">
            {item.title}
          </h1>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/discover?tag=${encodeURIComponent(tag)}`}
                  className="angel-tag angel-tag-active text-[10px]"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="mt-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/20" />
            <span className="text-[9px] text-[var(--angel-lavender)] twinkle">✦</span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/20" />
          </div>

          {/* Prompt section */}
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-1.5">
              <span className="text-[9px] text-[var(--angel-lavender)]">✦</span>
              <span className="text-[11px] font-medium text-[var(--angel-text-soft)] tracking-wider uppercase">
                Prompt
              </span>
            </div>

            {"prompt" in item && item.prompt ? (
              isPremium ? (
                <div className="glass-card rounded-xl p-4 relative overflow-hidden">
                  <p className="text-[13px] leading-[1.9] text-[var(--angel-text)] blur-[5px] select-none [word-break:keep-all]">
                    {item.prompt}
                  </p>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffd700" stroke="#b8860b" strokeWidth="1">
                      <path d="M3 18h18V8l-4 4-5-6-5 6-4-4v10z" />
                    </svg>
                    <p className="mt-2 text-[12px] font-medium text-[#b8860b]">프리미엄 프롬프트</p>
                    <p className="mt-1 text-[10px] text-[var(--angel-text-soft)]">구매 후 전체 프롬프트를 확인할 수 있어요</p>
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-xl p-4">
                  <p className="text-[13px] leading-[1.9] text-[var(--angel-text)] [word-break:keep-all]">
                    {item.prompt}
                  </p>
                </div>
              )
            ) : (
              <p className="text-[12px] text-[var(--angel-text-faint)]">프롬프트 정보가 없어요</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 space-y-3">
            {isPremium ? (
              <button className="w-full angel-btn py-3 text-[13px] font-medium bg-gradient-to-r from-[#ffd700] to-[#f0c030] text-white border-none shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] transition-shadow rounded-xl flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="#b8860b" strokeWidth="0.5">
                  <path d="M3 18h18V8l-4 4-5-6-5 6-4-4v10z" />
                </svg>
                프리미엄 프롬프트 구매하기
              </button>
            ) : (
              <Link
                href={`/generate?prompt=${encodeURIComponent(("prompt" in item && item.prompt) || "")}`}
                className="w-full angel-btn angel-btn-primary py-3 text-[13px] flex items-center justify-center gap-2"
              >
                <span className="text-[10px]">✦</span>
                이 프롬프트로 이미지 생성하기
              </Link>
            )}

            <button
              onClick={() => {
                if ("prompt" in item && item.prompt && !isPremium) {
                  navigator.clipboard.writeText(item.prompt);
                }
              }}
              disabled={isPremium}
              className="w-full angel-btn angel-btn-secondary py-2.5 text-[12px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {isPremium ? "프롬프트 복사 (프리미엄)" : "프롬프트 복사하기"}
            </button>
          </div>

          {/* Style info */}
          <div className="mt-6 glass-card rounded-xl p-4">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--angel-text-soft)]">스타일</span>
              <span className="text-[var(--angel-text)]">{item.tags?.[0] || "-"}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-[var(--angel-text-soft)]">등급</span>
              <span className={isPremium ? "text-[#b8860b] font-medium" : "text-[var(--angel-text)]"}>
                {isPremium ? "프리미엄" : "무료"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

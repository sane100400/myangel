"use client";

import { useState } from "react";
import { BrandCard } from "@/components/moodboard/brand-card";
import type { Brand } from "@/lib/brands";

interface GenerateResult {
  image: string;
  style_tags: string[];
  brands: Brand[];
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "이미지 생성에 실패했습니다.");
      }
      const data: GenerateResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.image) return;
    const link = document.createElement("a");
    link.href = result.image;
    link.download = `myangel-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-16 md:px-5 md:pt-24">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl font-medium tracking-[0.08em] text-[var(--angel-text)]">
          Generate
        </h1>
        <p className="mt-2 text-[13px] text-[var(--angel-text-soft)]">
          원하는 느낌을 설명하면 AI가 이미지를 만들어줘요
        </p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/30" />
          <span className="text-[9px] text-[var(--angel-lavender)] twinkle">✦ ✧ ✦</span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/30" />
        </div>
      </div>

      {/* Prompt Input */}
      <div className="mb-4">
        <textarea
          placeholder={"원하는 이미지를 설명해주세요\n예: 천사 날개를 단 파스텔 블루 드레스 소녀, 구름 위에서 앉아있는 모습"}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleGenerate();
            }
          }}
          disabled={isLoading}
          rows={3}
          className="w-full rounded-xl bg-white/70 border border-[var(--angel-border)] px-4 py-3 text-[14px] text-[var(--angel-text)] placeholder-[var(--angel-text-soft)]/60 outline-none transition-all resize-none focus:bg-white focus:border-[var(--angel-blue)]/50 focus:shadow-[0_0_20px_rgba(126,184,216,0.15)]"
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isLoading}
        className="w-full angel-btn angel-btn-primary py-3 text-[13px] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="twinkle text-[10px]">✦</span>
            AI가 이미지를 그리고 있어요...
            <span className="twinkle text-[10px]" style={{ animationDelay: "0.5s" }}>✦</span>
          </span>
        ) : (
          <>
            <span className="text-[10px]">✦</span>
            이미지 생성하기
          </>
        )}
      </button>

      {/* Loading Animation */}
      {isLoading && (
        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="relative h-40 w-40">
            <div className="absolute inset-0 rounded-2xl bg-[var(--angel-blue)]/5 pulse-glow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-3xl twinkle">✦</div>
            </div>
          </div>
          <p className="text-[12px] text-[var(--angel-text-soft)]">잠시만 기다려주세요...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-[13px] text-red-600 text-center">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-10 space-y-10">
          {/* Generated Image */}
          <div className="text-center">
            <div className="celestial-divider mb-6">
              <span className="text-[10px] tracking-[0.3em] text-[var(--angel-lavender)]">RESULT</span>
            </div>
            <div className="glass-card rounded-2xl p-3 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.image}
                alt="생성된 이미지"
                className="max-w-full rounded-xl"
                style={{ maxHeight: "512px" }}
              />
            </div>

            {/* Style tags */}
            {result.style_tags.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {result.style_tags.map((tag) => (
                  <span key={tag} className="angel-tag angel-tag-active text-[11px]">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Download button */}
            <div className="mt-5 flex justify-center gap-3">
              <button onClick={handleDownload} className="angel-btn angel-btn-secondary text-[12px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                다운로드
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setPrompt("");
                }}
                className="angel-btn angel-btn-secondary text-[12px]"
              >
                새로 만들기
              </button>
            </div>
          </div>

          {/* Brand Recommendations */}
          {result.brands.length > 0 && (
            <div>
              <div className="mb-6 celestial-divider">
                <span className="text-[10px] tracking-[0.3em] text-[var(--angel-lavender)]">BRANDS</span>
              </div>
              <h3 className="font-heading mb-2 text-center text-xl font-medium tracking-[0.08em] text-[var(--angel-text)]">
                Recommended Brands
              </h3>
              <p className="mb-6 text-center text-[12px] text-[var(--angel-text-soft)]">
                이 스타일에 어울리는 아이템을 만날 수 있는 브랜드예요
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.brands.map((brand) => (
                  <BrandCard key={brand.id} brand={brand} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

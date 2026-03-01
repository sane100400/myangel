"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { MoodboardGrid } from "@/components/moodboard/moodboard-grid";
import { BrandCard } from "@/components/moodboard/brand-card";
import { AnalysisResult } from "@/components/analyze/analysis-result";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalysisElements } from "@/types";
import type { Brand } from "@/lib/brands";

function generatePlaceholderImages(queries: string[]): string[] {
  return queries.map(
    (q, i) =>
      `https://source.unsplash.com/400x400/?${encodeURIComponent(q)}&sig=${i}`
  );
}

interface AnalysisData {
  elements: AnalysisElements;
  style_tags: string[];
  search_queries: string[];
  suggested_tags: string[];
  brands: Brand[];
}

function MoodboardContent() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get("image") || "";

  const [imageUrl, setImageUrl] = useState(initialUrl);
  const [centerImage, setCenterImage] = useState<string | null>(initialUrl || null);
  const [surroundingImages, setSurroundingImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCenterImage(dataUrl);
      setImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = async () => {
    if (!centerImage) return;
    setIsLoading(true);
    setError(null);
    setData(null);
    setSurroundingImages([]);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: centerImage,
          prompt: prompt.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "분석에 실패했습니다.");
      }
      const result: AnalysisData = await res.json();
      setData(result);
      if (result.search_queries?.length > 0) {
        setSurroundingImages(generatePlaceholderImages(result.search_queries));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCenterClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileUpload(file);
    };
    input.click();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 pb-10 md:px-5 md:pt-24">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1
          className="font-heading text-3xl font-medium tracking-[0.08em] text-[var(--angel-text)]"
        >
          Moodboard
        </h1>
        <p className="mt-2 text-[13px] text-[var(--angel-text-soft)]">
          코디 사진 한 장이면 AI가 비슷한 무드로 보드를 완성해줘요
        </p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/30" />
          <span className="text-[9px] text-[var(--angel-lavender)] twinkle">✦ ✧ ✦</span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/30" />
        </div>
      </div>

      {/* Upload Area */}
      <div className="mx-auto max-w-2xl mb-6 md:mb-10">
        {/* Image Input Row */}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            placeholder="이미지 URL을 붙여넣기..."
            value={imageUrl.startsWith("data:") ? "" : imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              if (e.target.value.startsWith("http")) {
                setCenterImage(e.target.value);
              }
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-white/70 border border-[var(--angel-border)] px-4 py-3 text-[14px] text-[var(--angel-text)] placeholder-[var(--angel-text-soft)]/60 outline-none transition-all focus:bg-white focus:border-[var(--angel-blue)]/50 focus:shadow-[0_0_20px_rgba(126,184,216,0.15)]"
          />
          <button
            onClick={handleCenterClick}
            className="shrink-0 rounded-xl border border-[var(--angel-border)] bg-white/70 px-4 py-3 text-[13px] text-[var(--angel-text-soft)] transition-all hover:bg-white hover:border-[var(--angel-blue)]/40 hover:text-[var(--angel-blue)]"
          >
            파일 업로드
          </button>
        </div>

        {/* Prompt Input */}
        <textarea
          placeholder="원하는 무드를 설명해주세요 (선택) &#10;예: 봄에 어울리는 파스텔톤 로리타 느낌, 귀여우면서 청순한..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          rows={2}
          className="w-full rounded-xl bg-white/70 border border-[var(--angel-border)] px-4 py-3 text-[13px] text-[var(--angel-text)] placeholder-[var(--angel-text-soft)]/60 outline-none transition-all resize-none focus:bg-white focus:border-[var(--angel-blue)]/50 focus:shadow-[0_0_20px_rgba(126,184,216,0.15)]"
        />

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={!centerImage || isLoading}
          className="mt-3 w-full angel-btn angel-btn-primary py-3 text-[13px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="twinkle text-[10px]">✦</span>
              AI가 무드를 분석하고 있어요...
              <span className="twinkle text-[10px]" style={{ animationDelay: "0.5s" }}>✦</span>
            </span>
          ) : (
            "무드보드 생성"
          )}
        </button>
      </div>

      {/* 3x3 Grid */}
      <div
        className="mb-10"
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("ring-2", "ring-[var(--angel-blue)]/30", "rounded-2xl"); }}
        onDragLeave={(e) => { e.currentTarget.classList.remove("ring-2", "ring-[var(--angel-blue)]/30", "rounded-2xl"); }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("ring-2", "ring-[var(--angel-blue)]/30", "rounded-2xl");
          const file = e.dataTransfer.files[0];
          if (file) handleFileUpload(file);
        }}
      >
        <MoodboardGrid
          centerImage={centerImage}
          surroundingImages={surroundingImages}
          onCenterClick={handleCenterClick}
        />
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="space-y-3">
            <Skeleton className="h-5 w-32 mx-auto rounded-full" />
            <div className="flex justify-center gap-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-18 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-[13px] text-red-600 max-w-md mx-auto text-center">
          {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="mt-10 space-y-12 max-w-3xl mx-auto">
          {/* Divider */}
          <div className="celestial-divider">
            <span className="text-[10px] tracking-[0.3em] text-[var(--angel-lavender)]">ANALYSIS</span>
          </div>

          {/* Style Tags */}
          {data.style_tags.length > 0 && (
            <div className="text-center">
              <div className="flex flex-wrap justify-center gap-2">
                {data.style_tags.map((tag) => (
                  <span key={tag} className="angel-tag angel-tag-active">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Elements */}
          <div className="glass-card rounded-2xl p-6">
            <AnalysisResult elements={data.elements} />
          </div>

          {/* Suggested Tags */}
          {data.suggested_tags.length > 0 && (
            <div className="text-center">
              <p className="mb-3 text-[10px] tracking-[0.15em] uppercase text-[var(--angel-text-faint)]">
                ✦ Tags
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {data.suggested_tags.map((tag) => (
                  <span key={tag} className="angel-tag text-[10px]">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Brand Recommendations */}
          {data.brands.length > 0 && (
            <div>
              <div className="mb-8 celestial-divider">
                <span className="text-[10px] tracking-[0.3em] text-[var(--angel-lavender)]">BRANDS</span>
              </div>
              <h3
                className="font-heading mb-2 text-center text-xl font-medium tracking-[0.08em] text-[var(--angel-text)]"
              >
                Recommended Brands
              </h3>
              <p className="mb-8 text-center text-[12px] text-[var(--angel-text-soft)]">
                이 무드에 어울리는 아이템을 만날 수 있는 브랜드예요
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.brands.map((brand) => (
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

export default function MoodboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-5 py-10 text-center">
          <Skeleton className="h-8 w-40 mx-auto rounded-full" />
        </div>
      }
    >
      <MoodboardContent />
    </Suspense>
  );
}

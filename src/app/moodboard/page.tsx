"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GothicCross } from "@/components/ui/gothic-cross";
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
        body: JSON.stringify({ image_url: centerImage }),
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
    <div className="mx-auto max-w-5xl px-5 py-10">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="cross-deco mb-3 flex justify-center"><GothicCross size={22} /></div>
        <h1
          className="text-3xl font-medium tracking-[0.08em] text-[var(--angel-text)]"
          style={{ fontFamily: "var(--font-serif-kr), var(--font-serif), 'Gowun Batang', 'Cormorant Garamond', serif" }}
        >
          Moodboard
        </h1>
        <p className="mt-2 text-[12px] text-[var(--angel-text-soft)]">
          중심에 이미지를 놓으면 AI가 비슷한 무드로 보드를 완성해줘요
        </p>

        {/* Celestial divider */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/30" />
          <span className="text-[9px] text-[var(--angel-lavender)] twinkle">✦ ✧ ✦</span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/30" />
        </div>
      </div>

      {/* URL Input */}
      <div className="mb-8 flex gap-2 max-w-md mx-auto">
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
          className="flex-1 rounded-full bg-white/50 backdrop-blur-sm border border-[var(--angel-border)] px-5 py-2.5 text-[12px] text-[var(--angel-text)] placeholder-[var(--angel-text-faint)] outline-none transition-all focus:bg-white/70 focus:border-[var(--angel-blue)]/40 focus:shadow-[0_0_16px_rgba(126,184,216,0.1)]"
        />
        <button
          onClick={handleAnalyze}
          disabled={!centerImage || isLoading}
          className="angel-btn angel-btn-primary shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? "분석 중..." : "무드보드 생성"}
        </button>
      </div>

      {/* 3x3 Grid */}
      <div
        className="mb-10"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
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

      {/* Loading */}
      {isLoading && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="text-center text-[12px] text-[var(--angel-lavender)] animate-pulse flex items-center justify-center gap-2">
            <span className="twinkle text-[10px]">✦</span>
            AI가 무드를 분석하고 있어요...
            <span className="twinkle text-[10px]" style={{ animationDelay: "0.5s" }}>✦</span>
          </div>
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
        <div className="mt-4 glass-card rounded-2xl p-4 text-[12px] text-[var(--destructive)] max-w-md mx-auto text-center border-[var(--destructive)]/20">
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
              <div className="cross-deco text-center mb-2 flex justify-center"><GothicCross size={22} /></div>
              <h3
                className="mb-2 text-center text-xl font-medium tracking-[0.08em] text-[var(--angel-text)]"
                style={{ fontFamily: "var(--font-serif-kr), var(--font-serif), 'Gowun Batang', 'Cormorant Garamond', serif" }}
              >
                Recommended Brands
              </h3>
              <p className="mb-8 text-center text-[11px] text-[var(--angel-text-faint)]">
                이 무드에 맞는 브랜드의 공식 스토어
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

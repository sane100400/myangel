"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MoodCard } from "./mood-card";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 8;

interface MoodImage {
  id: string;
  image_url: string; // image ID (not a URL path)
  title?: string | null;
  tags?: string[];
  prompt?: string;
}

interface MoodGalleryProps {
  images: MoodImage[];
}

export function MoodGallery({ images }: MoodGalleryProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const hasMore = visibleCount < images.length;

  // Reset when images change (e.g. tag filter)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [images]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    // Small delay for UX feedback
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, images.length));
      setIsLoadingMore(false);
    }, 300);
  }, [hasMore, isLoadingMore, images.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--angel-blue)]/8">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--angel-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <p className="text-[15px] font-medium text-[var(--angel-text)]">아직 공유된 이미지가 없어요</p>
        <p className="mt-2 text-[13px] text-[var(--angel-text-soft)] max-w-xs">
          Studio에서 이미지를 생성하고 공유하면 여기에 표시돼요
        </p>
        <a href="/generate" className="mt-6 angel-btn angel-btn-primary text-[13px]">
          <span className="text-[11px]">✦</span>
          이미지 만들러 가기
        </a>
      </div>
    );
  }

  const visibleImages = images.slice(0, visibleCount);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visibleImages.map((image, index) => (
          <MoodCard
            key={image.id}
            id={image.id}
            title={image.title}
            tags={image.tags}
            index={index}
          />
        ))}
      </div>

      {/* Sentinel + loading indicator */}
      {hasMore ? (
        <div ref={sentinelRef} className="mt-6">
          {isLoadingMore && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="mb-3 h-48 rounded-xl" />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/30" />
            <span className="text-[12px] text-[var(--angel-lavender)] twinkle">✦ ✧ ✦</span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/30" />
          </div>
          <p className="text-[13px] text-[var(--angel-text-soft)]">모든 이미지를 불러왔어요</p>
        </div>
      )}
    </div>
  );
}

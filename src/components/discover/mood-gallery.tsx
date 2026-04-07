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
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-2xl text-[var(--angel-lavender)] twinkle mb-3">✦</div>
        <p className="text-[14px] text-[var(--angel-text-soft)]">아직 이 태그의 무드 이미지가 없어요.</p>
        <div className="mt-4 flex justify-center">
          <span className="text-[12px] text-[var(--angel-lavender)]">✦ ✧ ✦</span>
        </div>
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

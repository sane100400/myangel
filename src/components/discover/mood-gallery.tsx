"use client";

import { useEffect, useRef } from "react";
import { MoodCard } from "./mood-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImagePlus } from "lucide-react";

interface MoodImage {
  id: string;
  image_url: string;       // full image URL (Supabase Storage)
  thumb_url?: string;
  title?: string | null;
  prompt?: string;
}

interface MoodGalleryProps {
  images: MoodImage[];
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

export function MoodGallery({
  images,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: MoodGalleryProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg border border-[var(--angel-border)] bg-[var(--angel-surface-muted)]">
          <ImagePlus size={28} className="text-[var(--angel-blue)]" />
        </div>
        <p className="text-[15px] font-medium text-[var(--angel-text)]">아직 공유된 이미지가 없어요</p>
        <p className="mt-2 text-[13.5px] text-[var(--angel-text-soft)] max-w-xs leading-[1.7] [word-break:keep-all]">
          이미지를 생성·편집하고 공유하면 여기에 표시돼요
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <a href="/generate" className="primary-action discover-empty-action">
            이미지 생성
          </a>
          <a href="/edit" className="secondary-action discover-empty-action">
            이미지 편집
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <MoodCard
            key={image.id}
            id={image.id}
            imageUrl={image.image_url}
            thumbUrl={image.thumb_url}
            title={image.title}
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
                <Skeleton key={i} className="mb-3 h-48 rounded-lg" />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center gap-2 border-t border-[var(--angel-border)] pt-6 text-center">
          <p className="text-[13px] text-[var(--angel-text-soft)]">모든 이미지를 불러왔어요</p>
        </div>
      )}
    </div>
  );
}

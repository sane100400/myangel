"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TrendingTags } from "@/components/discover/trending-tags";
import { MoodGallery } from "@/components/discover/mood-gallery";
import { SEED_MOOD_IMAGES, SEED_TAGS } from "@/lib/seed-data";
import { Skeleton } from "@/components/ui/skeleton";

function DiscoverContent() {
  const searchParams = useSearchParams();
  const initialTag = searchParams.get("tag");
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag);

  const filteredImages = useMemo(() => {
    if (!selectedTag) return SEED_MOOD_IMAGES;
    return SEED_MOOD_IMAGES.filter((img) =>
      img.tags?.some((t) => t === selectedTag)
    );
  }, [selectedTag]);

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 pb-10 md:px-5 md:pt-24">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1
          className="font-heading text-3xl font-medium tracking-[0.08em] text-[var(--angel-text)]"
        >
          Discover
        </h1>
        <p className="mt-2 text-[12px] text-[var(--angel-text-soft)]">
          마음에 드는 무드를 찾아보세요
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/30" />
          <span className="text-[9px] text-[var(--angel-lavender)] twinkle">✦ ✧ ✦</span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/30" />
        </div>
      </div>

      {/* Trending Tags */}
      <div className="mb-8 mx-auto max-w-2xl">
        <TrendingTags
          tags={SEED_TAGS}
          selectedTag={selectedTag}
          onTagClick={setSelectedTag}
        />
      </div>

      {/* Gallery */}
      <MoodGallery images={filteredImages} />
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Skeleton className="h-8 w-40 mb-8 mx-auto" />
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-full" />
            ))}
          </div>
          <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="mb-4 h-48 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}

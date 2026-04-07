"use client";

import { useState, useEffect } from "react";
import { Suspense } from "react";
import { MoodGallery } from "@/components/discover/mood-gallery";
import { Skeleton } from "@/components/ui/skeleton";

interface DiscoverImage {
  id: string;
  image_url: string;
  title?: string | null;
  tags?: string[];
  prompt?: string;
}

function DiscoverContent() {
  const [images, setImages] = useState<DiscoverImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchImages() {
      try {
        const res = await fetch("/api/discover/images");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled && Array.isArray(data.images)) {
          setImages(data.images);
        }
      } catch {
        if (!cancelled) setImages([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchImages();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 pb-10 md:px-5 md:pt-24">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="font-heading text-3xl font-medium tracking-[0.08em] text-[var(--angel-text)]">
          Discover
        </h1>
        <p className="mt-2 text-[14px] text-[var(--angel-text-soft)]">
          다른 사람들이 만든 AI 이미지를 구경하세요
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/30" />
          <span className="text-[11px] text-[var(--angel-lavender)] twinkle">✦ ✧ ✦</span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/30" />
        </div>
      </div>

      {/* Gallery */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      ) : (
        <MoodGallery images={images} />
      )}
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-8">
          <Skeleton className="h-8 w-40 mb-8 mx-auto" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}

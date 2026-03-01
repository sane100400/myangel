"use client";

import { MoodCard } from "./mood-card";
import { GothicCross } from "@/components/ui/gothic-cross";

interface MoodImage {
  id: string;
  image_url: string;
  title?: string | null;
  tags?: string[];
}

interface MoodGalleryProps {
  images: MoodImage[];
}

export function MoodGallery({ images }: MoodGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-2xl text-[var(--angel-lavender)] twinkle mb-3">✦</div>
        <p className="text-[12px] text-[var(--angel-text-soft)]">아직 이 태그의 무드 이미지가 없어요.</p>
        <div className="cross-deco mt-4 flex justify-center"><GothicCross size={22} /></div>
      </div>
    );
  }

  return (
    <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
      {images.map((image) => (
        <MoodCard
          key={image.id}
          id={image.id}
          imageUrl={image.image_url}
          title={image.title}
          tags={image.tags}
        />
      ))}
    </div>
  );
}

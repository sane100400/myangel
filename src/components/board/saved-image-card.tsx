"use client";

import type { SavedImage } from "@/lib/saved-images";

interface SavedImageCardProps {
  image: SavedImage;
  onClick: () => void;
}

export function SavedImageCard({ image, onClick }: SavedImageCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-card rounded-2xl overflow-hidden text-left w-full transition-shadow hover:shadow-md"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.image}
        alt={image.prompt}
        className="w-full aspect-square object-cover"
      />
      <div className="p-3">
        <p className="text-[13px] text-[var(--angel-text)] line-clamp-2 leading-[1.6] [word-break:keep-all]">
          {image.prompt}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          {image.style_tags.slice(0, 2).map((tag) => (
            <span key={tag} className="angel-tag text-[11px]">#{tag}</span>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--angel-text-faint)]">
          {new Date(image.created_at).toLocaleDateString("ko-KR")}
        </p>
      </div>
    </button>
  );
}

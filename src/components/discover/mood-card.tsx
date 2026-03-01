"use client";

interface MoodCardProps {
  id: string;
  imageUrl: string;
  title?: string | null;
  tags?: string[];
}

export function MoodCard({ imageUrl, title, tags }: MoodCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl break-inside-avoid mb-3 glass-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={title || "무드 이미지"}
        className="w-full object-cover"
        loading="lazy"
      />

      {/* Overlay — 태그/타이틀만 표시 */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#1a1a2e]/60 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {title && (
          <p className="mb-1.5 text-[11px] font-medium text-white/90 tracking-[0.04em]">{title}</p>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/15 backdrop-blur-sm px-2 py-0.5 text-[9px] text-white/80 border border-white/10"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

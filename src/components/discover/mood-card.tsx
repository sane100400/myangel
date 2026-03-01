"use client";

import Link from "next/link";

interface MoodCardProps {
  id: string;
  imageUrl: string;
  title?: string | null;
  tags?: string[];
}

export function MoodCard({ imageUrl, title, tags }: MoodCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl break-inside-avoid mb-4 glass-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={title || "무드 이미지"}
        className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        loading="lazy"
      />

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#1a1a2e]/70 via-[#1a1a2e]/20 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {title && (
          <p className="mb-1.5 text-[11px] font-medium text-white/90 tracking-[0.04em]">{title}</p>
        )}
        {tags && tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
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
        <Link href={`/moodboard?image=${encodeURIComponent(imageUrl)}`}>
          <button className="w-full rounded-full bg-white/15 backdrop-blur-md border border-white/20 py-1.5 text-[10px] tracking-[0.06em] text-white transition-all hover:bg-white/25">
            <span className="mr-1 text-[8px]">✦</span>
            이 무드로 보드 만들기
          </button>
        </Link>
      </div>
    </div>
  );
}

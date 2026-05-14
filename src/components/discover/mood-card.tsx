"use client";

import Link from "next/link";

interface MoodCardProps {
  id: string;
  imageUrl: string;        // full image URL (Supabase Storage)
  thumbUrl?: string;       // thumbnail URL — falls back to full
  title?: string | null;
  index?: number;
}

export function MoodCard({ id, imageUrl, thumbUrl, title, index = 0 }: MoodCardProps) {
  const isEager = index < 4;
  const src = thumbUrl || imageUrl;
  return (
    <Link
      href={`/discover/${id}`}
      className="result-card group block transition-[border-color,box-shadow] duration-200 hover:border-[var(--angel-blue-light)]"
    >
      <div className="aspect-[3/4] overflow-hidden bg-[var(--angel-surface-muted)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={title || "공유 이미지"}
          loading={isEager ? "eager" : "lazy"}
          decoding="async"
          {...(isEager ? { fetchPriority: "high" as const } : {})}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
          style={{ backgroundColor: "var(--angel-bg-soft, #e8ecf4)" }}
        />
      </div>

      <div className="min-h-[78px] border-t border-[var(--angel-border)] bg-[var(--angel-surface)] p-3">
        <p className="line-clamp-2 text-[13px] font-bold leading-snug text-[var(--angel-text)] [word-break:keep-all]">
          {title || "공유 이미지"}
        </p>
      </div>
    </Link>
  );
}

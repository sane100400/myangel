"use client";

import Link from "next/link";

interface MoodCardProps {
  id: string;
  imageUrl: string;        // full image URL (Supabase Storage)
  thumbUrl?: string;       // thumbnail URL — falls back to full
  title?: string | null;
  tags?: string[];
  index?: number;
}

export function MoodCard({ id, imageUrl, thumbUrl, title, tags, index = 0 }: MoodCardProps) {
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
        {tags && tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-[var(--angel-border)] bg-[var(--angel-surface-muted)] px-2 py-0.5 text-[10.5px] text-[var(--angel-text-soft)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

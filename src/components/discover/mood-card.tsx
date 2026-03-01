"use client";

import Link from "next/link";
import { getImageUrl } from "@/lib/seed-data";

interface MoodCardProps {
  id: string;
  title?: string | null;
  tags?: string[];
  isPremium?: boolean;
}

export function MoodCard({ id, title, tags, isPremium }: MoodCardProps) {
  return (
    <Link
      href={`/discover/${id}`}
      className="group relative overflow-hidden rounded-xl break-inside-avoid mb-3 glass-card block"
    >
      {/* Premium crown badge */}
      {isPremium && (
        <div className="absolute top-2 right-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-[#ffd700]/90 shadow-md">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M3 18h18V8l-4 4-5-6-5 6-4-4v10z" fill="#fff" />
            <path d="M3 18h18V8l-4 4-5-6-5 6-4-4v10z" stroke="#b8860b" strokeWidth="1" />
          </svg>
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getImageUrl(id, "thumb")}
        alt={title || "무드 이미지"}
        loading="lazy"
        className="w-full h-auto object-cover"
        style={{ backgroundColor: "var(--angel-bg-soft, #e8ecf4)" }}
      />

      {/* Hover overlay — tags/title */}
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
    </Link>
  );
}

"use client";

import Link from "next/link";
import { getImageUrl } from "@/lib/seed-data";

interface MoodCardProps {
  id: string;
  title?: string | null;
  tags?: string[];
  index?: number;
}

export function MoodCard({ id, title, tags, index = 0 }: MoodCardProps) {
  const isEager = index < 2;
  return (
    <Link
      href={`/discover/${id}`}
      className="group relative overflow-hidden rounded-xl glass-card block aspect-[3/4]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getImageUrl(id, "thumb")}
        srcSet={`${getImageUrl(id, "thumb_sm")} 200w, ${getImageUrl(id, "thumb")} 400w`}
        sizes="(max-width: 640px) 50vw, 25vw"
        alt={title || "무드 이미지"}
        loading={isEager ? "eager" : "lazy"}
        decoding="async"
        {...(isEager ? { fetchPriority: "high" as const } : {})}
        className="w-full h-full object-cover absolute inset-0"
        style={{ backgroundColor: "var(--angel-bg-soft, #e8ecf4)" }}
      />

      {/* Hover overlay — tags/title */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#1a1a2e]/60 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {title && (
          <p className="mb-1.5 text-[13px] font-medium text-white/90 tracking-[0.04em]">{title}</p>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/15 backdrop-blur-sm px-2 py-0.5 text-[11px] text-white/80 border border-white/10"
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

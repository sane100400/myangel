"use client";

import { useState } from "react";
import Image from "next/image";

interface MoodCardProps {
  id: string;
  imageUrl: string;
  title?: string | null;
  tags?: string[];
  prompt?: string;
  isPremium?: boolean;
}

export function MoodCard({ imageUrl, title, tags, prompt, isPremium }: MoodCardProps) {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <div
      className="group relative overflow-hidden rounded-xl break-inside-avoid mb-3 glass-card cursor-pointer"
      onClick={() => setShowPrompt((v) => !v)}
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

      <Image
        src={imageUrl}
        alt={title || "무드 이미지"}
        width={400}
        height={500}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="w-full h-auto object-cover"
        style={{ backgroundColor: "var(--angel-bg-soft, #e8ecf4)" }}
      />

      {/* Default overlay — tags/title on hover */}
      <div
        className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#1a1a2e]/60 via-transparent to-transparent p-3 transition-opacity duration-300 ${
          showPrompt ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"
        }`}
      >
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

      {/* Prompt overlay — shown on click */}
      {showPrompt && prompt && (
        <div className="absolute inset-0 z-10 flex flex-col justify-end bg-gradient-to-t from-[#1a1a2e]/80 via-[#1a1a2e]/40 to-transparent p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="text-[9px] text-[var(--angel-lavender)]">✦</span>
            <span className="text-[9px] font-medium text-white/70 tracking-wider uppercase">Prompt</span>
          </div>
          {isPremium ? (
            <div className="relative">
              <p className="text-[11px] leading-[1.7] text-white/90 blur-[4px] select-none">
                {prompt}
              </p>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-full bg-[#ffd700]/90 px-3 py-1 text-[10px] font-medium text-white shadow-md">
                  프리미엄 프롬프트
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] leading-[1.7] text-white/90">{prompt}</p>
          )}
          {title && (
            <p className="mt-2 text-[10px] text-white/60">{title}</p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { STYLE_PRESETS } from "@/lib/seed-data";

export function StylePresetGrid() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredPreset = hoveredId
    ? STYLE_PRESETS.find((p) => p.id === hoveredId)
    : null;

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2.5 mb-4">
        {STYLE_PRESETS.map((preset) => (
          <Link
            key={preset.id}
            href="/generate"
            className="glass-card rounded-full px-5 py-2.5 text-[13px] font-medium tracking-[0.04em] text-[var(--angel-text)] font-heading transition-all hover:border-[var(--angel-blue)] hover:text-[var(--angel-blue)] hover:bg-[var(--angel-blue-pale)] hover:transform hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(91,155,213,0.2)]"
            onMouseEnter={() => setHoveredId(preset.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <span className="mr-1.5">{preset.emoji}</span>
            {preset.label}
          </Link>
        ))}
      </div>

      {/* 호버 시 관련 해시태그 표시 */}
      <div className="h-8 flex items-center justify-center">
        {hoveredPreset ? (
          <div className="flex items-center gap-2 animate-in fade-in duration-200">
            {hoveredPreset.hashtags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] text-[var(--angel-blue)] tracking-[0.02em]"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-[var(--angel-text-faint)]">
            스타일에 마우스를 올려보세요
          </p>
        )}
      </div>
    </div>
  );
}

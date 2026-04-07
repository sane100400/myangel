"use client";

import { useRef, useEffect } from "react";
import type { EnhancementSuggestion } from "@/types";

interface SuggestionPopoverProps {
  suggestions: EnhancementSuggestion[];
  onSelect: (suggestion: EnhancementSuggestion) => void;
  onClose: () => void;
  anchorRect: DOMRect | null;
}

export function SuggestionPopover({
  suggestions,
  onSelect,
  onClose,
  anchorRect,
}: SuggestionPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!anchorRect) return null;

  return (
    <div
      ref={ref}
      className="fixed z-50 w-72 rounded-xl border border-[var(--angel-border)] bg-white/95 backdrop-blur-sm shadow-lg"
      style={{
        top: anchorRect.bottom + 6,
        left: Math.max(8, anchorRect.left - 40),
      }}
    >
      <div className="p-2">
        <p className="px-2 py-1 text-[12px] text-[var(--angel-text-faint)]">
          더 구체적인 표현을 선택하세요
        </p>
        <div className="mt-1 space-y-0.5">
          {suggestions.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--angel-blue)]/8"
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-[var(--angel-text)]">
                  {s.text}
                </span>
                <span className="text-[11px] text-[var(--angel-text-faint)]">
                  {Math.round(s.confidence * 100)}%
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-[var(--angel-text-soft)]">
                {s.reasoning}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

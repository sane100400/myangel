"use client";

import { useState, useRef, useCallback } from "react";
import type { WeakSpan, EnhancementSuggestion } from "@/types";
import { SuggestionPopover } from "./suggestion-popover";

interface PromptEnhancerProps {
  prompt: string;
  weakSpans: WeakSpan[];
  onSelectAlternative: (spanText: string, suggestion: EnhancementSuggestion) => void;
  selectedAlternatives: Record<string, string>;
  isLoading: boolean;
  onReanalyze: () => void;
}

export function PromptEnhancer({
  prompt,
  weakSpans,
  onSelectAlternative,
  selectedAlternatives,
  isLoading,
  onReanalyze,
}: PromptEnhancerProps) {
  const [activeSpan, setActiveSpan] = useState<WeakSpan | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSpanClick = useCallback(
    (span: WeakSpan, e: React.MouseEvent<HTMLSpanElement>) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setAnchorRect(rect);
      setActiveSpan(span);
    },
    []
  );

  const handleSelect = useCallback(
    (suggestion: EnhancementSuggestion) => {
      if (activeSpan) {
        onSelectAlternative(activeSpan.text, suggestion);
        setActiveSpan(null);
        setAnchorRect(null);
      }
    },
    [activeSpan, onSelectAlternative]
  );

  // Build rendered text with highlights
  const renderPrompt = () => {
    if (weakSpans.length === 0) {
      return (
        <span className="text-[15px] text-[var(--angel-text)]">{prompt}</span>
      );
    }

    // Sort spans by start position
    const sorted = [...weakSpans].sort((a, b) => a.start - b.start);
    const parts: React.ReactNode[] = [];
    let lastEnd = 0;

    for (const span of sorted) {
      // Text before this span
      if (span.start > lastEnd) {
        parts.push(
          <span key={`text-${lastEnd}`} className="text-[15px] text-[var(--angel-text)]">
            {prompt.slice(lastEnd, span.start)}
          </span>
        );
      }

      const isReplaced = selectedAlternatives[span.text];

      parts.push(
        <span
          key={`span-${span.start}`}
          onClick={(e) => !isReplaced && handleSpanClick(span, e)}
          className={`relative inline text-[15px] rounded px-0.5 transition-colors ${
            isReplaced
              ? "bg-emerald-100/70 text-emerald-700 cursor-default"
              : "bg-amber-100/70 text-amber-700 cursor-pointer hover:bg-amber-200/70"
          }`}
          title={isReplaced ? `원본: ${span.text}` : span.reason}
        >
          {isReplaced || span.text}
        </span>
      );

      lastEnd = span.end;
    }

    // Remaining text
    if (lastEnd < prompt.length) {
      parts.push(
        <span key={`text-${lastEnd}`} className="text-[15px] text-[var(--angel-text)]">
          {prompt.slice(lastEnd)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div ref={containerRef}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-medium text-[var(--angel-text)]">
          프롬프트 강화
        </h3>
        <button
          onClick={onReanalyze}
          disabled={isLoading}
          className="text-[13px] text-[var(--angel-blue)] hover:underline disabled:opacity-40"
        >
          다시 분석
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[var(--angel-border)] bg-white/50 p-6">
          <span className="twinkle text-[12px] text-[var(--angel-lavender)]">
            ✦
          </span>
          <span className="text-[14px] text-[var(--angel-text-soft)]">
            추상적 표현을 분석하고 있어요...
          </span>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-[var(--angel-border)] bg-white/70 p-4 leading-relaxed">
            {renderPrompt()}
          </div>

          {weakSpans.length > 0 && (
            <div className="mt-2 flex items-center gap-3 text-[12px] text-[var(--angel-text-faint)]">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded bg-amber-100/70" />
                개선 가능한 표현
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded bg-emerald-100/70" />
                개선된 표현
              </span>
            </div>
          )}

          {weakSpans.length === 0 && (
            <p className="mt-2 text-[13px] text-[var(--angel-text-faint)]">
              추상적인 표현이 발견되지 않았어요. 프롬프트가 이미 구체적이에요!
            </p>
          )}
        </>
      )}

      {activeSpan && (
        <SuggestionPopover
          suggestions={activeSpan.alternatives}
          onSelect={handleSelect}
          onClose={() => {
            setActiveSpan(null);
            setAnchorRect(null);
          }}
          anchorRect={anchorRect}
        />
      )}
    </div>
  );
}

"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import type { WeakSpan, EnhancementSuggestion } from "@/types";

interface InlineEnhancerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function InlineEnhancer({
  value,
  onChange,
  disabled = false,
  placeholder = "원하는 이미지를 설명해주세요",
}: InlineEnhancerProps) {
  const [weakSpans, setWeakSpans] = useState<WeakSpan[]>([]);
  const [activeSpan, setActiveSpan] = useState<WeakSpan | null>(null);
  const [bubblePos, setBubblePos] = useState<{ top: number; left: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedText, setAnalyzedText] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync scroll between textarea and highlight layer
  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Debounced analysis — trigger after user stops typing for 1.5s
  const triggerAnalysis = useCallback(
    async (text: string) => {
      if (text.trim().length < 4) {
        setWeakSpans([]);
        setAnalyzedText("");
        return;
      }

      setIsAnalyzing(true);
      try {
        const res = await fetch("/api/enhance-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text, objects: [] }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        // Only apply if text hasn't changed during analysis
        setWeakSpans(data.weakSpans || []);
        setAnalyzedText(text);
      } catch {
        // Silently fail — don't disrupt typing
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = e.target.value;
      onChange(newVal);

      // Clear active bubble
      setActiveSpan(null);
      setBubblePos(null);

      // Debounce analysis
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => triggerAnalysis(newVal), 1500);
    },
    [onChange, triggerAnalysis]
  );

  // Manual re-analyze
  const handleReanalyze = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    triggerAnalysis(value);
  }, [value, triggerAnalysis]);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Close bubble on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        bubbleRef.current &&
        !bubbleRef.current.contains(e.target as Node)
      ) {
        setActiveSpan(null);
        setBubblePos(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle clicking a highlighted span
  const handleSpanClick = useCallback(
    (span: WeakSpan, e: React.MouseEvent) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const containerRect = highlightRef.current?.parentElement?.getBoundingClientRect();
      if (!containerRect) return;

      const spanRect = target.getBoundingClientRect();
      setBubblePos({
        top: spanRect.bottom - containerRect.top + 6,
        left: Math.max(0, spanRect.left - containerRect.left - 20),
      });
      setActiveSpan(span);
    },
    []
  );

  // Select an alternative — replace in text
  const handleSelectAlternative = useCallback(
    (suggestion: EnhancementSuggestion) => {
      if (!activeSpan) return;

      const before = value.slice(0, activeSpan.start);
      const after = value.slice(activeSpan.end);
      const newValue = before + suggestion.text + after;
      onChange(newValue);

      // Adjust remaining spans
      const diff = suggestion.text.length - activeSpan.text.length;
      setWeakSpans((prev) =>
        prev
          .filter((s) => s.start !== activeSpan.start)
          .map((s) =>
            s.start > activeSpan.start
              ? { ...s, start: s.start + diff, end: s.end + diff }
              : s
          )
      );

      setActiveSpan(null);
      setBubblePos(null);
    },
    [activeSpan, value, onChange]
  );

  // Build highlighted HTML from current text and spans
  // Only show highlights if the analyzed text matches current text
  const validSpans = useMemo(() => {
    if (analyzedText !== value) return [];
    return [...weakSpans]
      .filter((s) => s.start >= 0 && s.end <= value.length && value.slice(s.start, s.end) === s.text)
      .sort((a, b) => a.start - b.start);
  }, [weakSpans, value, analyzedText]);

  const renderHighlightLayer = () => {
    if (validSpans.length === 0) {
      // Still render text (invisible) to match layout, but no highlights
      return <span className="invisible whitespace-pre-wrap break-words">{value || placeholder} </span>;
    }

    const parts: React.ReactNode[] = [];
    let lastEnd = 0;

    for (const span of validSpans) {
      if (span.start > lastEnd) {
        parts.push(
          <span key={`t-${lastEnd}`} className="invisible">
            {value.slice(lastEnd, span.start)}
          </span>
        );
      }

      parts.push(
        <span
          key={`h-${span.start}`}
          onClick={(e) => handleSpanClick(span, e)}
          className="relative cursor-pointer rounded-sm bg-amber-200/60 text-transparent transition-colors hover:bg-amber-300/70"
          title={span.reason}
        >
          {span.text}
          <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 text-[7px] text-white font-bold leading-none">
            !
          </span>
        </span>
      );

      lastEnd = span.end;
    }

    if (lastEnd < value.length) {
      parts.push(
        <span key={`t-${lastEnd}`} className="invisible">
          {value.slice(lastEnd)}
        </span>
      );
    }

    // Trailing space to match textarea line height
    parts.push(<span key="trail" className="invisible"> </span>);

    return parts;
  };

  return (
    <div className="relative">
      {/* Container */}
      <div className="relative rounded-xl border border-[var(--angel-border)] transition-all focus-within:border-[var(--angel-blue)]/50 focus-within:shadow-[0_0_20px_rgba(126,184,216,0.15)]">
        {/* Highlight layer (behind textarea) */}
        <div
          ref={highlightRef}
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl px-4 py-3 text-[14px] leading-[1.8] whitespace-pre-wrap break-words"
          aria-hidden="true"
        >
          {/* Re-enable pointer events only on highlight spans */}
          <div className="pointer-events-auto">
            {renderHighlightLayer()}
          </div>
        </div>

        {/* Actual textarea (transparent text over highlight layer) */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onScroll={handleScroll}
          disabled={disabled}
          placeholder={placeholder}
          rows={4}
          className="relative z-10 w-full rounded-xl bg-transparent px-4 py-3 text-[14px] leading-[1.8] text-[var(--angel-text)] placeholder-[var(--angel-text-soft)]/60 outline-none resize-none caret-[var(--angel-blue)]"
          style={{
            // Make text transparent when we have valid highlights, so highlight layer shows through
            color: validSpans.length > 0 ? "var(--angel-text)" : undefined,
          }}
        />

        {/* Speech bubble */}
        {activeSpan && bubblePos && (
          <div
            ref={bubbleRef}
            className="absolute z-50 w-72 animate-in fade-in slide-in-from-top-1 duration-150"
            style={{ top: bubblePos.top, left: bubblePos.left }}
          >
            {/* Arrow */}
            <div className="ml-8 h-2 w-2 rotate-45 bg-white border-l border-t border-[var(--angel-border)] -mb-1 relative z-10" />

            {/* Bubble body */}
            <div className="rounded-xl border border-[var(--angel-border)] bg-white shadow-lg overflow-hidden">
              {/* Header */}
              <div className="px-3 pt-2.5 pb-1.5 border-b border-[var(--angel-border)]/50">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[var(--angel-text)]">
                    &ldquo;{activeSpan.text}&rdquo;
                  </span>
                  <button
                    onClick={() => {
                      setActiveSpan(null);
                      setBubblePos(null);
                    }}
                    className="text-[var(--angel-text-faint)] hover:text-[var(--angel-text-soft)] transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <p className="text-[10px] text-amber-600 mt-0.5">
                  {activeSpan.reason}
                </p>
              </div>

              {/* Suggestions */}
              <div className="p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
                {activeSpan.alternatives.map((alt) => (
                  <button
                    key={alt.id}
                    onClick={() => handleSelectAlternative(alt)}
                    className="w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--angel-blue)]/8 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-[var(--angel-blue)] group-hover:text-[var(--angel-text)]">
                        {alt.text}
                      </span>
                      <span className="text-[9px] text-[var(--angel-text-faint)] tabular-nums">
                        {Math.round(alt.confidence * 100)}%
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-[var(--angel-text-soft)] leading-snug">
                      {alt.reasoning}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="mt-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {isAnalyzing && (
            <span className="flex items-center gap-1.5 text-[10px] text-[var(--angel-lavender)]">
              <span className="twinkle">✦</span>
              분석 중...
            </span>
          )}
          {!isAnalyzing && validSpans.length > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] text-amber-600">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-300" />
              {validSpans.length}개 표현 개선 가능
            </span>
          )}
          {!isAnalyzing && value.trim().length >= 4 && validSpans.length === 0 && analyzedText === value && (
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-600">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-300" />
              프롬프트가 구체적이에요
            </span>
          )}
        </div>
        {value.trim().length >= 4 && (
          <button
            onClick={handleReanalyze}
            disabled={isAnalyzing || disabled}
            className="text-[10px] text-[var(--angel-text-faint)] hover:text-[var(--angel-blue)] transition-colors disabled:opacity-40"
          >
            다시 분석
          </button>
        )}
      </div>
    </div>
  );
}

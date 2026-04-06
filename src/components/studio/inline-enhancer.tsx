"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
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
  const [spans, setSpans] = useState<WeakSpan[]>([]);
  const [activeSpan, setActiveSpan] = useState<WeakSpan | null>(null);
  const [bubblePos, setBubblePos] = useState<{ top: number; left: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedText, setAnalyzedText] = useState("");
  const [replacedWords, setReplacedWords] = useState<Record<string, string>>({});
  const [isRewriting, setIsRewriting] = useState(false);
  const [originalInput, setOriginalInput] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced analysis
  const triggerAnalysis = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setSpans([]);
      setAnalyzedText("");
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSpans(data.weakSpans || []);
      setAnalyzedText(text);
    } catch {
      // Silent fail
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = e.target.value;
      onChange(newVal);
      setActiveSpan(null);
      setBubblePos(null);

      // Reset analyzed state when text changes
      if (newVal !== analyzedText) {
        // Don't clear spans immediately — keep showing until new analysis
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => triggerAnalysis(newVal), 1500);
    },
    [onChange, triggerAnalysis, analyzedText]
  );

  const handleManualAnalyze = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    triggerAnalysis(value);
  }, [value, triggerAnalysis]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Close bubble on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        setActiveSpan(null);
        setBubblePos(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Handle chip click — show bubble
  const handleChipClick = useCallback(
    (span: WeakSpan, e: React.MouseEvent) => {
      const chip = e.currentTarget as HTMLElement;
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const chipRect = chip.getBoundingClientRect();
      setBubblePos({
        top: chipRect.bottom - containerRect.top + 8,
        left: Math.max(0, Math.min(
          chipRect.left - containerRect.left,
          containerRect.width - 288 // 288 = bubble width (w-72)
        )),
      });
      setActiveSpan(span);
    },
    []
  );

  // Rewrite sentence naturally after word replacement
  const rewriteSentence = useCallback(
    async (original: string, modified: string) => {
      setIsRewriting(true);
      try {
        const res = await fetch("/api/rewrite-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ original, modified }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.rewritten && data.rewritten !== modified) {
          onChange(data.rewritten);
          // Re-analyze the rewritten text
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => triggerAnalysis(data.rewritten), 1500);
        }
      } catch {
        // Keep the raw replacement if rewrite fails
      } finally {
        setIsRewriting(false);
      }
    },
    [onChange, triggerAnalysis]
  );

  // Select alternative — replace in text, then auto-rewrite
  const handleSelect = useCallback(
    (suggestion: EnhancementSuggestion) => {
      if (!activeSpan) return;

      const currentText = activeSpan.text;
      const idx = value.indexOf(currentText);
      if (idx === -1) {
        setActiveSpan(null);
        setBubblePos(null);
        return;
      }

      // Save original input on first replacement
      const origInput = originalInput || value;
      if (!originalInput) setOriginalInput(value);

      const before = value.slice(0, idx);
      const after = value.slice(idx + currentText.length);
      const newValue = before + suggestion.text + after;
      onChange(newValue);

      // Track replacement
      setReplacedWords((prev) => ({
        ...prev,
        [currentText]: suggestion.text,
      }));

      // Clear spans and bubble
      setSpans([]);
      setAnalyzedText("");
      setActiveSpan(null);
      setBubblePos(null);

      // Auto-rewrite for natural flow, then re-analyze
      rewriteSentence(origInput, newValue);
    },
    [activeSpan, value, onChange, originalInput, rewriteSentence]
  );

  // Valid spans that match current text
  const validSpans = spans.filter(
    (s) => value.includes(s.text) && s.alternatives && s.alternatives.length > 0
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Textarea */}
      <textarea
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-xl bg-white/70 border border-[var(--angel-border)] px-4 py-3 text-[14px] leading-[1.8] text-[var(--angel-text)] placeholder-[var(--angel-text-soft)]/60 outline-none transition-all resize-none focus:bg-white focus:border-[var(--angel-blue)]/50 focus:shadow-[0_0_20px_rgba(126,184,216,0.15)]"
      />

      {/* Word chips — shown below textarea */}
      {validSpans.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-[var(--angel-text-faint)]">
              단어를 클릭하면 더 구체적인 표현을 추천해줘요
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {validSpans.map((span, i) => {
              const isReplaced = !!replacedWords[span.text] || Object.values(replacedWords).includes(span.text);
              const isActive = activeSpan?.text === span.text;

              return (
                <button
                  key={`${span.text}-${i}`}
                  onClick={(e) => handleChipClick(span, e)}
                  className={`relative rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all ${
                    isActive
                      ? "bg-[var(--angel-blue)]/15 text-[var(--angel-blue)] border border-[var(--angel-blue)]/30 shadow-sm"
                      : isReplaced
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50 hover:bg-emerald-100/70"
                      : "bg-amber-50 text-amber-700 border border-amber-200/50 hover:bg-amber-100/70 hover:border-amber-300/50"
                  }`}
                >
                  {span.text}
                  {!isReplaced && (
                    <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400/80 text-[8px] text-white font-bold">
                      +
                    </span>
                  )}
                  {isReplaced && (
                    <span className="ml-1 text-[10px] text-emerald-500">
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="inline">
                        <polyline points="3 8 7 12 13 4" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Speech bubble */}
      {activeSpan && bubblePos && (
        <div
          ref={bubbleRef}
          className="absolute z-50 w-72"
          style={{ top: bubblePos.top, left: bubblePos.left }}
        >
          {/* Arrow */}
          <div className="ml-6 h-2.5 w-2.5 rotate-45 bg-white border-l border-t border-[var(--angel-border)] -mb-1.5 relative z-10" />

          {/* Bubble body */}
          <div className="rounded-xl border border-[var(--angel-border)] bg-white shadow-lg overflow-hidden">
            {/* Header */}
            <div className="px-3.5 pt-3 pb-2 border-b border-[var(--angel-border)]/50 bg-gradient-to-r from-[var(--angel-blue)]/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[var(--angel-text)]">
                    &ldquo;{activeSpan.text}&rdquo;
                  </span>
                </div>
                <button
                  onClick={() => {
                    setActiveSpan(null);
                    setBubblePos(null);
                  }}
                  className="text-[var(--angel-text-faint)] hover:text-[var(--angel-text-soft)] transition-colors p-0.5"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-[var(--angel-text-soft)] mt-0.5 leading-snug">
                {activeSpan.reason}
              </p>
            </div>

            {/* Alternatives */}
            <div className="p-1.5 max-h-64 overflow-y-auto">
              <p className="px-2 py-1 text-[9px] text-[var(--angel-text-faint)] uppercase tracking-wider">
                이렇게 바꿔보세요
              </p>
              {activeSpan.alternatives.map((alt) => (
                <button
                  key={alt.id}
                  onClick={() => handleSelect(alt)}
                  className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--angel-blue)]/6 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-[var(--angel-blue)] group-hover:text-[var(--angel-text)]">
                      {alt.text}
                    </span>
                    <span className="shrink-0 text-[9px] text-[var(--angel-text-faint)] tabular-nums bg-[var(--angel-bg-soft)] rounded-full px-1.5 py-0.5">
                      {Math.round(alt.confidence * 100)}%
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-[var(--angel-text-soft)] leading-snug">
                    {alt.reasoning}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="mt-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {isRewriting && (
            <span className="flex items-center gap-1.5 text-[10px] text-[var(--angel-blue)]">
              <span className="twinkle">✦</span>
              문장을 다듬고 있어요...
            </span>
          )}
          {!isRewriting && isAnalyzing && (
            <span className="flex items-center gap-1.5 text-[10px] text-[var(--angel-lavender)]">
              <span className="twinkle">✦</span>
              단어를 분석하고 있어요...
            </span>
          )}
          {!isAnalyzing && validSpans.length > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] text-[var(--angel-text-soft)]">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-300" />
              {validSpans.length}개 단어 강화 가능
            </span>
          )}
        </div>
        {value.trim().length >= 2 && (
          <button
            onClick={handleManualAnalyze}
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

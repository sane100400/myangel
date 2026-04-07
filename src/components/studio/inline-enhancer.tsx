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

      // Clear stale spans when text changes significantly
      if (analyzedText && newVal !== analyzedText) {
        const noOverlap = !newVal.includes(analyzedText) && !analyzedText.includes(newVal);
        if (noOverlap) {
          setSpans([]);
          setAnalyzedText("");
          setReplacedWords({});
          setOriginalInput("");
        }
      }

      // Auto-analyze when no valid analysis exists
      if (newVal.trim().length >= 2) {
        const needsAnalysis = !analyzedText || !newVal.includes(analyzedText) && !analyzedText.includes(newVal);
        if (needsAnalysis) {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => triggerAnalysis(newVal), 1500);
        }
      }
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
      const isMobile = containerRect.width < 400;
      const bubbleWidth = isMobile ? containerRect.width : 288;
      setBubblePos({
        top: chipRect.bottom - containerRect.top + 8,
        left: isMobile ? 0 : Math.max(0, Math.min(
          chipRect.left - containerRect.left,
          containerRect.width - bubbleWidth
        )),
      });
      setActiveSpan(span);
    },
    []
  );

  // Manual rewrite — only called when user clicks "문장 다듬기"
  const handleRewrite = useCallback(async () => {
    if (!originalInput || isRewriting) return;
    setIsRewriting(true);
    try {
      const res = await fetch("/api/rewrite-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original: originalInput, modified: value }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.rewritten && data.rewritten !== value) {
        onChange(data.rewritten);
        setSpans([]);
        setAnalyzedText("");
        setOriginalInput("");
        setReplacedWords({});
      }
    } catch {
      // Keep raw replacement
    } finally {
      setIsRewriting(false);
    }
  }, [originalInput, value, onChange, isRewriting]);

  // Select alternative — local text replacement only, no API call
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

      // Update spans locally (adjust positions, mark this one as replaced)
      const diff = suggestion.text.length - currentText.length;
      setSpans((prev) =>
        prev.map((s) => {
          if (s.text === currentText) {
            return { ...s, text: suggestion.text, start: idx, end: idx + suggestion.text.length };
          }
          if (s.start > idx) {
            return { ...s, start: s.start + diff, end: s.end + diff };
          }
          return s;
        })
      );
      setAnalyzedText(newValue);

      setActiveSpan(null);
      setBubblePos(null);
    },
    [activeSpan, value, onChange, originalInput]
  );

  const hasReplacements = Object.keys(replacedWords).length > 0;

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

      {/* Enhancement panel — shown below textarea */}
      {validSpans.length > 0 && (
        <div className="mt-3 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 via-white/60 to-orange-50/40 p-3 shadow-sm md:mt-4 md:p-4">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/20">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-amber-800">
                프롬프트 강화
              </p>
              <p className="text-[11px] text-amber-600/80">
                {validSpans.filter((s) => !replacedWords[s.text] && !Object.values(replacedWords).includes(s.text)).length}개 표현을 더 구체적으로 바꿀 수 있어요
              </p>
            </div>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2">
            {validSpans.map((span, i) => {
              const isReplaced = !!replacedWords[span.text] || Object.values(replacedWords).includes(span.text);
              const isActive = activeSpan?.text === span.text;

              return (
                <button
                  key={`${span.text}-${i}`}
                  onClick={(e) => handleChipClick(span, e)}
                  className={`relative rounded-xl px-3 py-1.5 text-[12px] font-medium transition-all md:px-3.5 md:py-2 md:text-[13px] ${
                    isActive
                      ? "bg-[var(--angel-blue)]/15 text-[var(--angel-blue)] border-2 border-[var(--angel-blue)]/40 shadow-md scale-[1.03]"
                      : isReplaced
                      ? "bg-emerald-100/80 text-emerald-700 border border-emerald-300/60 hover:bg-emerald-100"
                      : "bg-white text-amber-800 border border-amber-300/70 shadow-sm hover:bg-amber-50 hover:border-amber-400/70 hover:shadow-md hover:scale-[1.02]"
                  }`}
                >
                  {span.text}
                  {!isReplaced && (
                    <span className="ml-1.5 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-amber-400 text-[9px] text-white font-bold shadow-sm">
                      +
                    </span>
                  )}
                  {isReplaced && (
                    <span className="ml-1.5 text-emerald-500">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="inline">
                        <polyline points="3 8 7 12 13 4" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-[10px] text-amber-600/60 text-center">
            단어를 클릭하면 AI가 더 구체적인 표현을 추천해줘요
          </p>
        </div>
      )}

      {/* Speech bubble */}
      {activeSpan && bubblePos && (
        <div
          ref={bubbleRef}
          className="absolute z-50 w-full md:w-72"
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

      {/* Rewrite button — shown after replacements */}
      {hasReplacements && !isRewriting && (
        <div className="mt-3">
          <button
            onClick={handleRewrite}
            className="w-full rounded-xl border border-[var(--angel-blue)]/30 bg-[var(--angel-blue)]/6 py-2.5 text-[12px] font-medium text-[var(--angel-blue)] transition-all hover:bg-[var(--angel-blue)]/12 hover:border-[var(--angel-blue)]/50"
          >
            <span className="text-[10px]">✦</span>
            {" "}문장 다듬기
          </button>
          <p className="mt-1 text-center text-[10px] text-[var(--angel-text-faint)]">
            선택한 표현을 반영하여 문장을 자연스럽게 다듬어요
          </p>
        </div>
      )}

      {/* Status bar */}
      <div className="mt-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {isRewriting && (
            <span className="flex items-center gap-2 text-[11px] text-[var(--angel-blue)] font-medium">
              <span className="twinkle">✦</span>
              문장을 다듬고 있어요...
            </span>
          )}
          {!isRewriting && isAnalyzing && (
            <span className="flex items-center gap-2 rounded-full bg-[var(--angel-lavender)]/10 px-3 py-1.5 text-[11px] text-[var(--angel-lavender)] font-medium">
              <span className="twinkle">✦</span>
              프롬프트를 분석하고 있어요...
            </span>
          )}
          {!isAnalyzing && !isRewriting && validSpans.length === 0 && analyzedText && (
            <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-600 font-medium">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 8 7 12 13 4" /></svg>
              프롬프트가 이미 구체적이에요!
            </span>
          )}
        </div>
        {value.trim().length >= 2 && !isRewriting && (
          <button
            onClick={handleManualAnalyze}
            disabled={isAnalyzing || disabled}
            className="rounded-full bg-[var(--angel-bg-soft)] px-3 py-1.5 text-[11px] text-[var(--angel-text-soft)] hover:text-[var(--angel-blue)] hover:bg-[var(--angel-blue)]/8 transition-all disabled:opacity-40"
          >
            다시 분석
          </button>
        )}
      </div>
    </div>
  );
}

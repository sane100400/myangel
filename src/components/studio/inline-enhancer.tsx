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
  const [spans, setSpans] = useState<WeakSpan[]>([]);
  const [activeSpan, setActiveSpan] = useState<WeakSpan | null>(null);
  const [bubblePos, setBubblePos] = useState<{ top: number; left: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedText, setAnalyzedText] = useState("");
  const [replacedWords, setReplacedWords] = useState<Record<string, string>>({});
  const [isRewriting, setIsRewriting] = useState(false);
  const [originalInput, setOriginalInput] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
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

      if (analyzedText && newVal !== analyzedText) {
        const noOverlap = !newVal.includes(analyzedText) && !analyzedText.includes(newVal);
        if (noOverlap) {
          setSpans([]);
          setAnalyzedText("");
          setReplacedWords({});
          setOriginalInput("");
        }
      }

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

  // Handle highlighted word click — show bubble
  const handleWordClick = useCallback(
    (span: WeakSpan, e: React.MouseEvent) => {
      const el = e.currentTarget as HTMLElement;
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const elRect = el.getBoundingClientRect();
      const isMobile = containerRect.width < 400;
      const bubbleWidth = isMobile ? containerRect.width : 288;
      setBubblePos({
        top: elRect.bottom - containerRect.top + 8,
        left: isMobile ? 0 : Math.max(0, Math.min(
          elRect.left - containerRect.left,
          containerRect.width - bubbleWidth
        )),
      });
      setActiveSpan(span);
    },
    []
  );

  // Manual rewrite
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

  // Select alternative
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

      if (!originalInput) setOriginalInput(value);

      const before = value.slice(0, idx);
      const after = value.slice(idx + currentText.length);
      const newValue = before + suggestion.text + after;
      onChange(newValue);

      setReplacedWords((prev) => ({
        ...prev,
        [currentText]: suggestion.text,
      }));

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

  const unresolvedCount = validSpans.filter(
    (s) => !replacedWords[s.text] && !Object.values(replacedWords).includes(s.text)
  ).length;

  // ── Build highlighted text preview ──
  const highlightedPreview = useMemo(() => {
    if (validSpans.length === 0 || !value) return null;

    // Sort spans by position in text
    const sorted = [...validSpans]
      .map((s) => ({ ...s, idx: value.indexOf(s.text) }))
      .filter((s) => s.idx !== -1)
      .sort((a, b) => a.idx - b.idx);

    if (sorted.length === 0) return null;

    const parts: { text: string; span: WeakSpan | null; isReplaced: boolean }[] = [];
    let cursor = 0;

    for (const s of sorted) {
      if (s.idx < cursor) continue; // overlapping span
      if (s.idx > cursor) {
        parts.push({ text: value.slice(cursor, s.idx), span: null, isReplaced: false });
      }
      const isReplaced = !!replacedWords[s.text] || Object.values(replacedWords).includes(s.text);
      parts.push({ text: s.text, span: s, isReplaced });
      cursor = s.idx + s.text.length;
    }
    if (cursor < value.length) {
      parts.push({ text: value.slice(cursor), span: null, isReplaced: false });
    }

    return parts;
  }, [value, validSpans, replacedWords]);

  return (
    <div ref={containerRef} className="relative">
      {/* Textarea — hidden when preview is active */}
      <div className="relative">
        {highlightedPreview ? (
          <>
            {/* Hidden textarea for input */}
            <textarea
              value={value}
              onChange={handleChange}
              disabled={disabled || isAnalyzing}
              placeholder={placeholder}
              rows={4}
              className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10 resize-none"
              style={{ caretColor: "var(--angel-text)" }}
            />
            {/* Grammarly-style highlighted preview */}
            <div
              ref={previewRef}
              className={`w-full rounded-xl bg-white border border-[var(--angel-blue)]/30 px-4 py-3 text-[14px] leading-[1.8] text-[var(--angel-text)] min-h-[120px] shadow-[0_0_0_3px_rgba(91,155,213,0.08)] ${isAnalyzing ? "opacity-60" : ""}`}
            >
              {highlightedPreview.map((part, i) =>
                part.span ? (
                  <span
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWordClick(part.span!, e);
                    }}
                    className={`relative cursor-pointer transition-all ${
                      part.isReplaced
                        ? "text-emerald-700 bg-emerald-50 rounded px-0.5 decoration-emerald-400 underline decoration-2 underline-offset-[3px]"
                        : activeSpan?.text === part.text
                        ? "text-amber-800 bg-amber-100 rounded px-0.5 decoration-amber-500 underline decoration-wavy decoration-2 underline-offset-[3px]"
                        : "text-amber-800 bg-amber-50/80 rounded px-0.5 decoration-amber-400 underline decoration-wavy decoration-2 underline-offset-[3px] hover:bg-amber-100 hover:decoration-amber-500"
                    }`}
                  >
                    {part.text}
                  </span>
                ) : (
                  <span key={i}>{part.text}</span>
                )
              )}
            </div>
          </>
        ) : (
          <textarea
            value={value}
            onChange={handleChange}
            disabled={disabled || isAnalyzing}
            placeholder={placeholder}
            rows={4}
            className={`w-full rounded-xl bg-white/70 border border-[var(--angel-border)] px-4 py-3 text-[14px] leading-[1.8] text-[var(--angel-text)] placeholder-[var(--angel-text-soft)]/60 outline-none transition-all resize-none focus:bg-white focus:border-[var(--angel-blue)]/50 focus:shadow-[0_0_20px_rgba(126,184,216,0.15)] ${isAnalyzing ? "opacity-60" : ""}`}
          />
        )}

        {/* Analyzing overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/70 backdrop-blur-[2px] z-20">
            <div className="flex items-center gap-2.5 rounded-full bg-[var(--angel-lavender)]/12 border border-[var(--angel-lavender)]/25 px-5 py-2.5 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--angel-lavender)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span className="text-[14px] font-medium text-[var(--angel-lavender)]">
                프롬프트를 강화하고 있어요...
              </span>
            </div>
          </div>
        )}

        {/* Rewriting overlay */}
        {isRewriting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/70 backdrop-blur-[2px] z-20">
            <div className="flex items-center gap-2.5 rounded-full bg-[var(--angel-blue)]/12 border border-[var(--angel-blue)]/25 px-5 py-2.5 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--angel-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span className="text-[14px] font-medium text-[var(--angel-blue)]">
                문장을 다듬고 있어요...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Issue counter badge (Grammarly-style) ── */}
      {validSpans.length > 0 && !isAnalyzing && (
        <div className="mt-3 flex items-center gap-3">
          <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium ${
            unresolvedCount > 0
              ? "bg-amber-50 border border-amber-200/60 text-amber-800"
              : "bg-emerald-50 border border-emerald-200/60 text-emerald-700"
          }`}>
            {unresolvedCount > 0 ? (
              <>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[11px] font-bold text-white">
                  {unresolvedCount}
                </span>
                개선할 수 있는 표현
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 8 7 12 13 4" /></svg>
                모든 표현이 개선되었어요
              </>
            )}
          </div>
          <span className="text-[12px] text-[var(--angel-text-faint)]">
            밑줄 친 단어를 클릭하세요
          </span>
        </div>
      )}

      {/* ── Speech bubble (popup on click) ── */}
      {activeSpan && bubblePos && (
        <div
          ref={bubbleRef}
          className="absolute z-50 w-full md:w-80"
          style={{ top: bubblePos.top, left: bubblePos.left }}
        >
          {/* Arrow */}
          <div className="ml-6 h-2.5 w-2.5 rotate-45 bg-white border-l border-t border-[var(--angel-border)] -mb-1.5 relative z-10" />

          {/* Bubble body */}
          <div className="rounded-xl border border-[var(--angel-border)] bg-white shadow-xl overflow-hidden">
            {/* Header — strikethrough original */}
            <div className="px-4 pt-3.5 pb-2.5 border-b border-[var(--angel-border)]/50 bg-gradient-to-r from-amber-50/80 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white">!</span>
                  <span className="text-[15px] font-semibold text-amber-800">
                    &ldquo;{activeSpan.text}&rdquo;
                  </span>
                </div>
                <button
                  onClick={() => { setActiveSpan(null); setBubblePos(null); }}
                  className="text-[var(--angel-text-faint)] hover:text-[var(--angel-text-soft)] transition-colors p-1"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <p className="text-[13px] text-amber-700/70 mt-1 leading-snug">
                {activeSpan.reason}
              </p>
            </div>

            {/* Alternatives */}
            <div className="p-2 max-h-64 overflow-y-auto">
              <p className="px-2 py-1 text-[11px] text-[var(--angel-text-faint)] uppercase tracking-wider font-medium">
                추천 대안
              </p>
              {activeSpan.alternatives.map((alt) => (
                <button
                  key={alt.id}
                  onClick={() => handleSelect(alt)}
                  className="w-full rounded-lg px-3 py-2.5 text-left transition-all hover:bg-emerald-50 group border border-transparent hover:border-emerald-200/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 8 7 12 13 4" /></svg>
                      </span>
                      <span className="text-[15px] font-medium text-[var(--angel-text)] group-hover:text-emerald-700">
                        {alt.text}
                      </span>
                    </div>
                    <span className="shrink-0 text-[11px] text-[var(--angel-text-faint)] tabular-nums bg-[var(--angel-bg-soft)] rounded-full px-2 py-0.5">
                      {Math.round(alt.confidence * 100)}%
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-[var(--angel-text-soft)] leading-snug pl-5">
                    {alt.reasoning}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rewrite button */}
      {hasReplacements && !isRewriting && (
        <div className="mt-3">
          <button
            onClick={handleRewrite}
            className="w-full rounded-xl border border-[var(--angel-blue)]/30 bg-[var(--angel-blue)]/6 py-2.5 text-[14px] font-medium text-[var(--angel-blue)] transition-all hover:bg-[var(--angel-blue)]/12 hover:border-[var(--angel-blue)]/50"
          >
            <span className="text-[12px]">✦</span>
            {" "}문장 다듬기
          </button>
          <p className="mt-1 text-center text-[12px] text-[var(--angel-text-faint)]">
            선택한 표현을 반영하여 문장을 자연스럽게 다듬어요
          </p>
        </div>
      )}

      {/* Status bar */}
      <div className="mt-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {!isAnalyzing && !isRewriting && validSpans.length === 0 && analyzedText && (
            <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[13px] text-emerald-600 font-medium">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 8 7 12 13 4" /></svg>
              프롬프트가 이미 구체적이에요!
            </span>
          )}
        </div>
        {value.trim().length >= 2 && !isRewriting && !isAnalyzing && (
          <button
            onClick={handleManualAnalyze}
            disabled={isAnalyzing || disabled}
            className="rounded-full bg-[var(--angel-bg-soft)] px-3 py-1.5 text-[13px] text-[var(--angel-text-soft)] hover:text-[var(--angel-blue)] hover:bg-[var(--angel-blue)]/8 transition-all disabled:opacity-40"
          >
            다시 분석
          </button>
        )}
      </div>
    </div>
  );
}

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
          debounceRef.current = setTimeout(() => triggerAnalysis(newVal), 700);
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

  const showSuccessHint =
    !isAnalyzing && !isRewriting && validSpans.length === 0 && !!analyzedText;
  const showManualBtn =
    value.trim().length >= 2 && !isRewriting && !isAnalyzing;

  return (
    <div ref={containerRef} className="relative">
      {/* ══ Editor card — Grammarly-style writing surface ══ */}
      <div className="group relative overflow-hidden rounded-2xl border border-[var(--angel-blue)]/25 bg-white shadow-[0_1px_2px_rgba(30,58,95,0.04),0_16px_40px_-20px_rgba(91,155,213,0.45)] transition-all duration-300 focus-within:border-[var(--angel-blue)]/55 focus-within:shadow-[0_1px_2px_rgba(30,58,95,0.04),0_24px_56px_-22px_rgba(91,155,213,0.55),0_0_0_4px_rgba(91,155,213,0.1)]">
        {/* Top lavender hairline */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[var(--angel-lavender)]/55 to-transparent" />

        {/* Header toolbar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1.5">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--angel-text-faint)]">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 3 Q 14 4, 9 9 Q 4 14, 3 21 Q 10 20, 15 15 Q 20 10, 20 3 Z" />
              <path d="M3 21 L 10 14" />
            </svg>
            <span>Prompt</span>
            <span className="text-[var(--angel-lavender)]/75 twinkle">✦</span>
          </div>
          <div className="flex items-center gap-1.5 tabular-nums text-[11px] text-[var(--angel-text-faint)]">
            <span className="text-[var(--angel-text-soft)]/80">{value.length}</span>
            <span className="text-[var(--angel-text-faint)]/55">chars</span>
          </div>
        </div>

        {/* Input surface */}
        <div className="relative">
          {highlightedPreview ? (
            <>
              {/* textarea sits BEHIND the highlight layer (z-0, opacity-0) so
                  that span clicks reach the preview. Preview is on top with
                  pointer-events-none on non-span text — clicks on empty text
                  fall through to the textarea below. */}
              <textarea
                value={value}
                onChange={handleChange}
                disabled={disabled}
                placeholder={placeholder}
                rows={4}
                className="absolute inset-0 z-0 h-full w-full cursor-text resize-none bg-transparent px-5 pb-4 pt-1 text-[15px] leading-[1.85] opacity-0 outline-none"
                style={{ caretColor: "var(--angel-text)" }}
              />
              <div
                ref={previewRef}
                className="pointer-events-none relative z-10 min-h-[128px] w-full bg-transparent px-5 pb-4 pt-1 text-[15px] leading-[1.85] text-[var(--angel-text)]"
              >
                {highlightedPreview.map((part, i) =>
                  part.span ? (
                    <span
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWordClick(part.span!, e);
                      }}
                      className={`pointer-events-auto relative cursor-pointer transition-all ${
                        part.isReplaced
                          ? "text-sky-700 bg-sky-50 rounded px-0.5 decoration-sky-400 underline decoration-2 underline-offset-[3px]"
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
              disabled={disabled}
              placeholder={placeholder}
              rows={4}
              className="min-h-[128px] w-full resize-none border-0 bg-transparent px-5 pb-4 pt-1 text-[15px] leading-[1.85] text-[var(--angel-text)] outline-none placeholder:text-[var(--angel-text-faint)]/55"
            />
          )}

          {/* Rewriting overlay — rewrite *does* need to block editing, because
              it replaces the entire sentence. Analysis does not. */}
          {isRewriting && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
              <div className="flex items-center gap-2.5 rounded-full border border-[var(--angel-blue)]/25 bg-[var(--angel-blue)]/12 px-5 py-2.5 shadow-sm">
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

        {/* Footer status bar */}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--angel-blue)]/12 bg-gradient-to-b from-white to-[rgba(91,155,213,0.035)] px-5 py-2.5">
          {isAnalyzing ? (
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--angel-lavender)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              약한 표현을 찾고 있어요
            </span>
          ) : showSuccessHint ? (
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-sky-600">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="3 8 7 12 13 4" />
              </svg>
              프롬프트가 이미 구체적이에요
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--angel-text-faint)]">
              <span className="text-[var(--angel-lavender)]/75 twinkle">✦</span>
              <span>약한 표현은 AI가 자동으로 찾아드려요</span>
            </span>
          )}
          {showManualBtn && (
            <button
              onClick={handleManualAnalyze}
              disabled={isAnalyzing || disabled}
              className="shrink-0 rounded-full border border-[var(--angel-blue)]/20 bg-white px-3 py-1 text-[11px] font-medium tracking-wide text-[var(--angel-blue)] transition-all hover:border-[var(--angel-blue)]/45 hover:bg-[var(--angel-blue)]/8 disabled:opacity-40"
            >
              다시 분석
            </button>
          )}
        </div>
      </div>

      {/* ── Issue counter badge (Grammarly-style) ── */}
      {validSpans.length > 0 && !isAnalyzing && (
        <div className="mt-3 flex items-center gap-3">
          <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium ${
            unresolvedCount > 0
              ? "bg-amber-50 border border-amber-200/60 text-amber-800"
              : "bg-sky-50 border border-sky-200/60 text-sky-700"
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
                  className="w-full rounded-lg px-3 py-2.5 text-left transition-all hover:bg-sky-50 group border border-transparent hover:border-sky-200/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 8 7 12 13 4" /></svg>
                      </span>
                      <span className="text-[15px] font-medium text-[var(--angel-text)] group-hover:text-sky-700">
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

    </div>
  );
}

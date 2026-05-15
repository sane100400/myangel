"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import type { WeakSpan, EnhancementSuggestion } from "@/types";
import { Check, Loader2, WandSparkles } from "lucide-react";
import { toast } from "sonner";

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedText, setAnalyzedText] = useState("");
  const [replacedWords, setReplacedWords] = useState<Record<string, string>>({});
  const [isRewriting, setIsRewriting] = useState(false);
  const [originalInput, setOriginalInput] = useState("");

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
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "프롬프트 강화에 실패했어요.");
      }
      const data = await res.json();
      setSpans(data.weakSpans || []);
      setAnalyzedText(text);
      if (!data.weakSpans?.length) {
        toast.info("구체화할 약한 표현을 찾지 못했어요.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "프롬프트 강화에 실패했어요.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = e.target.value;
      onChange(newVal);

      if (analyzedText && newVal !== analyzedText) {
        const noOverlap = !newVal.includes(analyzedText) && !analyzedText.includes(newVal);
        if (noOverlap) {
          setSpans([]);
          setAnalyzedText("");
          setReplacedWords({});
          setOriginalInput("");
        }
      }

      // Auto-debounced analysis disabled — user must click "프롬프트 강화" manually.
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [onChange, analyzedText]
  );

  const handleManualAnalyze = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    triggerAnalysis(value);
  }, [value, triggerAnalysis]);

  useEffect(() => {
    const timeout = debounceRef.current;
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  // Reset analysis when value changes from outside (e.g. template chip click).
  useEffect(() => {
    if (analyzedText && value !== analyzedText) {
      const noOverlap = !value.includes(analyzedText) && !analyzedText.includes(value);
      if (noOverlap) {
        setSpans([]);
        setAnalyzedText("");
        setReplacedWords({});
        setOriginalInput("");
      }
    }
  }, [value, analyzedText]);

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
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "문장 다듬기에 실패했어요.");
      }
      const data = await res.json();
      if (data.rewritten && data.rewritten !== value) {
        onChange(data.rewritten);
        setSpans([]);
        setAnalyzedText("");
        setOriginalInput("");
        setReplacedWords({});
      } else {
        // Even if model returned identical text, treat the polish as accepted
        // and clear replacements so the button hides.
        setReplacedWords({});
        setOriginalInput("");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "문장 다듬기에 실패했어요.");
    } finally {
      setIsRewriting(false);
    }
  }, [originalInput, value, onChange, isRewriting]);

  // Select alternative
  const handleSelect = useCallback(
    (span: WeakSpan, suggestion: EnhancementSuggestion) => {
      const currentText = span.text;
      const idx = value.indexOf(currentText);
      if (idx === -1) return;

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
    },
    [value, onChange, originalInput]
  );

  const hasReplacements = Object.keys(replacedWords).length > 0;

  // Valid spans that match current text
  const validSpans = spans.filter(
    (s) => value.includes(s.text) && s.alternatives && s.alternatives.length > 0
  );

  const unresolvedSpans = validSpans.filter(
    (s) => !replacedWords[s.text] && !Object.values(replacedWords).includes(s.text)
  );
  const unresolvedCount = unresolvedSpans.length;

  const showSuccessHint =
    !isAnalyzing && !isRewriting && validSpans.length === 0 && !!analyzedText;
  const canAnalyze =
    value.trim().length >= 2 && !isRewriting && !isAnalyzing;

  return (
    <div className="relative">
      {/* ══ Editor card — Grammarly-style writing surface ══ */}
      <div className="group relative overflow-hidden rounded-lg border border-[var(--angel-border)] bg-[var(--angel-surface)] shadow-[var(--angel-shadow-soft)] transition-all duration-200 focus-within:border-[var(--angel-blue)]/55 focus-within:shadow-[var(--angel-focus)]">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1.5">
          <div className="flex items-center gap-2 text-[12px] font-bold text-[var(--angel-text-faint)]">
            <WandSparkles size={14} />
            <span>Prompt</span>
          </div>
          <div className="flex items-center gap-1.5 tabular-nums text-[11px] text-[var(--angel-text-faint)]">
            <span className="text-[var(--angel-text-soft)]/80">{value.length}</span>
            <span className="text-[var(--angel-text-faint)]/55">chars</span>
          </div>
        </div>

        {/* Input surface */}
        <div className="relative">
          <textarea
            value={value}
            onChange={handleChange}
            disabled={disabled}
            placeholder={placeholder}
            rows={4}
            className="h-[144px] w-full resize-none overflow-y-auto border-0 bg-transparent px-5 pb-4 pt-1 text-[16px] leading-[1.8] text-[var(--angel-text)] outline-none placeholder:text-[var(--angel-text-faint)]/55 md:h-[132px] md:text-[15px] md:leading-[1.85]"
          />

          {/* Rewriting overlay — rewrite *does* need to block editing, because
              it replaces the entire sentence. Analysis does not. */}
          {isRewriting && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
              <div className="flex items-center gap-2.5 rounded-lg border border-[var(--angel-blue)]/25 bg-[var(--angel-blue-pale)] px-5 py-2.5 shadow-sm">
                <Loader2 size={16} className="animate-spin text-[var(--angel-blue)]" />
                <span className="text-[14px] font-medium text-[var(--angel-blue)]">
                  문장을 다듬고 있어요...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer status bar */}
        <div className="grid min-h-[44px] grid-cols-1 items-center gap-2 border-t border-[var(--angel-border)] bg-[var(--angel-surface-muted)] px-4 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5 sm:py-1.5">
          <div className="min-w-0">
            {isAnalyzing ? (
              <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-medium leading-4 text-[var(--angel-lavender)]">
                <Loader2 size={12} className="shrink-0 animate-spin" />
                <span className="min-w-0 truncate">약한 표현을 찾고 있어요</span>
              </span>
            ) : showSuccessHint ? (
              <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-medium leading-4 text-sky-600">
                <Check size={12} className="shrink-0" />
                <span className="min-w-0 truncate">프롬프트가 이미 구체적이에요</span>
              </span>
            ) : (
              <span className="flex min-w-0 items-center gap-1.5 text-[12px] leading-4 text-[var(--angel-text-faint)]">
                <WandSparkles size={12} className="shrink-0" />
                <span className="min-w-0 truncate sm:hidden">AI가 더 구체적으로 다듬어요</span>
                <span className="hidden min-w-0 truncate sm:inline">약한 표현을 AI가 더 구체적으로 다듬어드려요</span>
              </span>
            )}
          </div>
          <div className="grid w-full shrink-0 grid-cols-2 items-center gap-1.5 sm:flex sm:w-auto">
            <button
              onClick={handleManualAnalyze}
              disabled={!canAnalyze || disabled}
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-md bg-[var(--angel-blue)] px-2 text-[11.5px] font-bold leading-none text-white shadow-[0_1px_0_rgba(53,111,165,0.16)] transition-colors hover:bg-[var(--angel-blue-strong)] disabled:opacity-40 sm:h-7"
            >
              <WandSparkles size={11} />
              {analyzedText ? "다시 강화" : "프롬프트 강화"}
            </button>
            <button
              onClick={handleRewrite}
              disabled={!hasReplacements || isRewriting || disabled}
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-md border border-[var(--angel-border)] bg-white/80 px-2 text-[11.5px] font-bold leading-none text-[var(--angel-text-soft)] transition-colors hover:border-[var(--angel-blue)]/45 hover:text-[var(--angel-blue)] disabled:opacity-40 sm:h-7"
            >
              <WandSparkles size={11} />
              다듬기
            </button>
          </div>
        </div>
      </div>

      {/* ── Issue counter badge (Grammarly-style) ── */}
      {validSpans.length > 0 && !isAnalyzing ? (
        <div className="mt-3 flex min-h-10 items-center gap-3">
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
            아래 추천 표현을 선택하세요
          </span>
        </div>
      ) : (
        <div className="mt-3 hidden min-h-10 items-center gap-3 sm:flex">
          <span aria-hidden="true" className="invisible text-[13px]">상태 자리</span>
        </div>
      )}

      {unresolvedSpans.length > 0 && !isAnalyzing && (
        <div className="grid gap-2">
          {unresolvedSpans.map((span) => (
            <div
              key={`${span.start}-${span.end}-${span.text}`}
              className="rounded-lg border border-amber-200/70 bg-amber-50/45 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-white/80 px-2 py-1 text-[12px] font-bold text-amber-800">
                  {span.text}
                </span>
                <span className="text-[12px] leading-5 text-amber-700/80">
                  {span.reason}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {span.alternatives.slice(0, 3).map((alt) => (
                  <button
                    key={alt.id}
                    type="button"
                    onClick={() => handleSelect(span, alt)}
                    className="rounded-md border border-sky-200/70 bg-white px-2.5 py-1.5 text-[12px] font-bold text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-50"
                  >
                    {alt.text}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

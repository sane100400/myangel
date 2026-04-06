"use client";

import { useState } from "react";

interface PromptComparisonProps {
  originalPrompt: string;
  enhancedPromptKo: string;
  enhancedPromptEn: string;
}

export function PromptComparison({
  originalPrompt,
  enhancedPromptKo,
  enhancedPromptEn,
}: PromptComparisonProps) {
  const [showEnglish, setShowEnglish] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = showEnglish ? enhancedPromptEn : enhancedPromptKo;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-medium text-[var(--angel-text)]">
          프롬프트 비교
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEnglish(!showEnglish)}
            className="text-[10px] text-[var(--angel-blue)] hover:underline"
          >
            {showEnglish ? "한국어로 보기" : "영어 프롬프트 보기"}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-[var(--angel-text-soft)] hover:text-[var(--angel-blue)] transition-colors"
          >
            {copied ? (
              <>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                복사됨
              </>
            ) : (
              <>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                복사
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Original */}
        <div className="rounded-xl border border-[var(--angel-border)] bg-white/50 p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--angel-text-faint)]" />
            <span className="text-[10px] font-medium text-[var(--angel-text-faint)] uppercase tracking-wider">
              Original
            </span>
          </div>
          <p className="text-[12px] leading-relaxed text-[var(--angel-text-soft)]">
            {originalPrompt}
          </p>
        </div>

        {/* Enhanced */}
        <div className="rounded-xl border border-[var(--angel-blue)]/30 bg-[var(--angel-blue)]/5 p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--angel-blue)]" />
            <span className="text-[10px] font-medium text-[var(--angel-blue)] uppercase tracking-wider">
              Enhanced
            </span>
          </div>
          <p className="text-[12px] leading-relaxed text-[var(--angel-text)]">
            {showEnglish ? enhancedPromptEn : enhancedPromptKo}
          </p>
        </div>
      </div>
    </div>
  );
}

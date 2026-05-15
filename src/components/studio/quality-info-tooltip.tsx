"use client";

import { Info } from "lucide-react";

export function QualityInfoTooltip() {
  return (
    <span className="group relative inline-flex items-center">
      <button
        type="button"
        aria-label="화질 옵션 안내"
        className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-[var(--angel-border)] bg-white text-[var(--angel-text-faint)] transition-colors hover:border-[var(--angel-blue)]/45 hover:text-[var(--angel-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--angel-blue)]/25"
      >
        <Info size={12} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-7 z-40 w-[min(280px,calc(100vw-2rem))] rounded-lg border border-[var(--angel-border)] bg-white px-3 py-2.5 text-left text-[11.5px] font-normal leading-5 text-[var(--angel-text-soft)] opacity-0 shadow-[0_14px_34px_rgba(30,41,59,0.14)] transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 max-sm:fixed max-sm:inset-x-4 max-sm:bottom-20 max-sm:top-auto max-sm:w-auto"
      >
        <span className="block font-bold text-[var(--angel-text)]">화질 옵션 안내</span>
        <span className="mt-1 block">
          Nano Banana Pro는 1K, 2K, 4K를 모델에 직접 요청합니다.
        </span>
        <span className="mt-1 block">
          GPT Image 2의 API quality 값은 low, medium, high, auto입니다. 여기의 1K/2K는 결과 파일의 후처리 해상도이며, 4K는 지원하지 않습니다.
        </span>
      </span>
    </span>
  );
}

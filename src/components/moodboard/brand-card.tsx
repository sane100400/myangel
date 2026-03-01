"use client";

import type { Brand } from "@/lib/brands";

interface BrandCardProps {
  brand: Brand;
}

const PRICE_LABEL: Record<string, { text: string; desc: string }> = {
  low: { text: "¥", desc: "~5,000엔대" },
  mid: { text: "¥¥", desc: "5,000~15,000엔대" },
  high: { text: "¥¥¥", desc: "15,000엔~" },
};

export function BrandCard({ brand }: BrandCardProps) {
  const price = PRICE_LABEL[brand.priceRange];

  return (
    <div className="glass-card rounded-2xl p-5 group flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4
            className="text-[15px] font-medium text-[var(--angel-text)] tracking-[0.04em] font-heading-light"
          >
            {brand.name}
          </h4>
          <p className="text-[10px] text-[var(--angel-text-faint)] tracking-wide">{brand.nameJa}</p>
        </div>
        <span className="text-[10px] text-[var(--angel-text-faint)] shrink-0" title={price.desc}>
          {price.text}
        </span>
      </div>

      {/* Description */}
      <p className="text-[11px] leading-[1.7] text-[var(--angel-text-soft)] mb-3 flex-1">
        {brand.description}
      </p>

      {/* Style tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {brand.styles.slice(0, 3).map((style) => (
          <span key={style} className="angel-tag text-[9px]">
            #{style}
          </span>
        ))}
      </div>

      {/* CTA: Link to brand site */}
      <a
        href={brand.storeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full angel-btn angel-btn-primary text-[11px] tracking-[0.06em]"
      >
        브랜드 사이트로 이동
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M6 3h7v7" />
          <path d="M13 3L6 10" />
        </svg>
      </a>
    </div>
  );
}

"use client";

import type { Brand } from "@/lib/brands";

interface BrandCardProps {
  brand: Brand;
}

const PRICE_LABEL: Record<string, string> = {
  low: "$",
  mid: "$$",
  high: "$$$",
};

export function BrandCard({ brand }: BrandCardProps) {
  return (
    <div className="glass-card rounded-2xl p-5 group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4
            className="text-[14px] font-medium text-[var(--angel-text)] tracking-[0.04em]"
            style={{ fontFamily: "var(--font-serif-kr), var(--font-serif), 'Gowun Batang', 'Cormorant Garamond', serif" }}
          >
            {brand.name}
          </h4>
          <p className="text-[10px] text-[var(--angel-text-faint)] tracking-wide">{brand.nameJa}</p>
        </div>
        <span className="text-[11px] text-[var(--angel-lavender)] font-medium">{PRICE_LABEL[brand.priceRange]}</span>
      </div>

      <p className="text-[11px] leading-[1.7] text-[var(--angel-text-soft)] mb-3">
        {brand.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {brand.styles.slice(0, 3).map((style) => (
          <span key={style} className="angel-tag text-[9px]">
            #{style}
          </span>
        ))}
      </div>

      <a href={brand.storeUrl} target="_blank" rel="noopener noreferrer">
        <button className="w-full angel-btn angel-btn-secondary text-[11px]">
          <span className="text-[8px] text-[var(--angel-lavender)]">✦</span>
          公式ストア
        </button>
      </a>
    </div>
  );
}

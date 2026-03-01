"use client";

interface ShopLinkButtonProps {
  storeUrl: string;
  brandName: string;
}

export function ShopLinkButton({ storeUrl, brandName }: ShopLinkButtonProps) {
  return (
    <a href={storeUrl} target="_blank" rel="noopener noreferrer">
      <button className="angel-btn angel-btn-secondary text-[11px]">
        <span className="text-[8px] text-[var(--angel-lavender)]">✦</span>
        {brandName} 공식 스토어
      </button>
    </a>
  );
}

"use client";

interface ItemCardProps {
  brandName: string;
  brandNameJa: string;
  storeUrl: string;
  description: string;
  styles: string[];
}

export function ItemCard({ brandName, brandNameJa, storeUrl, description, styles }: ItemCardProps) {
  return (
    <div className="glass-card overflow-hidden rounded-2xl p-5">
      <div className="mb-2">
        <h4
          className="font-heading-light text-[14px] font-medium text-[var(--angel-text)] tracking-[0.04em]"
        >
          {brandName}
        </h4>
        <p className="text-[10px] text-[var(--angel-text-faint)] tracking-wide">{brandNameJa}</p>
      </div>
      <p className="text-[11px] leading-[1.7] text-[var(--angel-text-soft)] mb-3">{description}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {styles.slice(0, 3).map((s) => (
          <span key={s} className="angel-tag text-[9px]">
            #{s}
          </span>
        ))}
      </div>
      <a href={storeUrl} target="_blank" rel="noopener noreferrer">
        <button className="w-full angel-btn angel-btn-primary text-[11px]">
          <span className="text-[8px]">✦</span>
          공식 스토어 방문
        </button>
      </a>
    </div>
  );
}

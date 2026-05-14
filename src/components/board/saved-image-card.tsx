"use client";

import { Check, Loader2, PenLine, Share2 } from "lucide-react";
import type { SavedImage } from "@/lib/saved-images";

interface SavedImageCardProps {
  image: SavedImage;
  onClick: () => void;
  onShare: () => void;
  onEdit: () => void;
  index?: number;
  onToggleSelected?: () => void;
  isSharing?: boolean;
  isShared?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
}

export function SavedImageCard({
  image,
  onClick,
  onShare,
  onEdit,
  index = 0,
  onToggleSelected,
  isSharing = false,
  isShared = false,
  selectionMode = false,
  selected = false,
}: SavedImageCardProps) {
  const isEager = index < 4;
  const handleMainClick = () => {
    if (selectionMode && onToggleSelected) {
      onToggleSelected();
      return;
    }
    onClick();
  };

  return (
    <div className="result-card w-full overflow-hidden text-left transition-shadow hover:shadow-md">
      <div className="relative">
        {selectionMode && (
          <button
            type="button"
            onClick={onToggleSelected}
            className={`absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg border shadow-sm ${
              selected
                ? "border-[var(--angel-blue)] bg-[var(--angel-blue)] text-white"
                : "border-white/80 bg-white/90 text-[var(--angel-text-faint)]"
            }`}
            aria-label={selected ? "선택 해제" : "이미지 선택"}
          >
            {selected && <Check size={16} />}
          </button>
        )}
        <button type="button" onClick={handleMainClick} className="block w-full text-left">
        {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.image}
            alt={image.prompt ?? ""}
            loading={isEager ? "eager" : "lazy"}
            decoding="async"
            {...(isEager ? { fetchPriority: "high" as const } : {})}
            className={`aspect-square w-full object-cover ${selected ? "ring-4 ring-inset ring-[var(--angel-blue)]" : ""}`}
          />
        </button>
      </div>
      <button type="button" onClick={handleMainClick} className="block w-full text-left">
        <div className="px-3 pb-2.5 pt-3">
          <p className="line-clamp-2 whitespace-pre-line text-[13px] leading-[1.6] text-[var(--angel-text)] [word-break:keep-all]">
            {image.prompt ?? ""}
          </p>
          <p className="mt-1.5 text-[11px] text-[var(--angel-text-faint)]">
            {new Date(image.created_at).toLocaleDateString("ko-KR")}
          </p>
        </div>
      </button>
      <div className="grid grid-cols-2 gap-1.5 border-t border-[var(--angel-border)]/70 px-2.5 py-2">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-[var(--angel-border)] bg-white px-2 text-[12px] font-bold text-[var(--angel-text-soft)] transition-colors hover:border-[var(--angel-blue)]/45 hover:text-[var(--angel-blue)]"
        >
          <PenLine size={13} />
          편집
        </button>
        <button
          type="button"
          onClick={onShare}
          disabled={isSharing || isShared}
          className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-md border border-[var(--angel-blue)]/25 bg-[var(--angel-blue-pale)] px-2.5 text-[12px] font-bold text-[var(--angel-blue)] transition-colors hover:border-[var(--angel-blue)]/45 hover:bg-white disabled:opacity-55"
        >
          {isSharing ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} />}
          {isShared ? "공유됨" : isSharing ? "공유 중..." : "공유"}
        </button>
      </div>
    </div>
  );
}

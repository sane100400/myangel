"use client";

import type { Board, BoardItem } from "@/types";
import { GothicCross } from "@/components/ui/gothic-cross";

interface BoardDetailProps {
  board: Board;
  items: BoardItem[];
  isOwner: boolean;
}

export function BoardDetail({ board, items, isOwner }: BoardDetailProps) {
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: board.title,
        text: board.description || `${board.title} - MyAngel 보드`,
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <div className="cross-deco mb-2 flex justify-center"><GothicCross size={22} /></div>
          <h1
            className="text-2xl font-medium tracking-[0.08em] text-[var(--angel-text)]"
            style={{ fontFamily: "var(--font-serif-kr), var(--font-serif), 'Gowun Batang', 'Cormorant Garamond', serif" }}
          >
            {board.title}
          </h1>
          {board.description && (
            <p className="mt-2 text-[12px] text-[var(--angel-text-soft)]">
              {board.description}
            </p>
          )}
          <span className="angel-tag text-[9px] mt-2 inline-block">
            {board.is_public ? "공개" : "비공개"}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="angel-btn angel-btn-secondary text-[11px]"
          >
            공유
          </button>
          {isOwner && (
            <button className="angel-btn angel-btn-secondary text-[11px]">
              편집
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 text-2xl text-[var(--angel-lavender)] twinkle">✦</div>
          <p className="text-[12px] text-[var(--angel-text-soft)]">아직 저장된 아이템이 없어요.</p>
          <p className="mt-1 text-[10px] text-[var(--angel-text-faint)]">무드보드에서 브랜드를 추천받고 보드에 저장해보세요.</p>
          <div className="cross-deco mt-6 flex justify-center"><GothicCross size={22} /></div>
        </div>
      ) : (
        <div className="space-y-6">
          {items
            .filter((item) => item.mood_image)
            .map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl glass-card"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.mood_image!.image_url}
                  alt={item.mood_image!.title || "무드 이미지"}
                  className="w-full max-h-[400px] object-cover"
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

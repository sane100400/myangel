"use client";

import Link from "next/link";
import type { Board } from "@/types";

interface BoardCardProps {
  board: Board;
}

export function BoardCard({ board }: BoardCardProps) {
  return (
    <Link href={`/boards/${board.id}`}>
      <div className="glass-card group cursor-pointer overflow-hidden rounded-2xl transition-all duration-300">
        {/* Thumbnail */}
        <div className="aspect-[4/3] bg-gradient-to-br from-[var(--angel-blue-pale)] to-[var(--angel-lavender-pale)]">
          {board.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={board.thumbnail_url}
              alt={board.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-2xl text-[var(--angel-lavender)] twinkle">✦</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3
            className="font-heading-light text-[15px] font-medium text-[var(--angel-text)] tracking-[0.04em]"
          >
            {board.title}
          </h3>
          {board.description && (
            <p className="mt-1 text-[12px] text-[var(--angel-text-soft)] line-clamp-2 leading-relaxed">
              {board.description}
            </p>
          )}
          <div className="mt-2">
            <span className="angel-tag text-[11px]">
              {board.is_public ? "공개" : "비공개"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

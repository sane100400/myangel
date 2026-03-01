"use client";

import { useEffect } from "react";
import type { SavedImage } from "@/lib/saved-images";

interface ImageDetailModalProps {
  image: SavedImage;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function ImageDetailModal({ image, onClose, onDelete }: ImageDetailModalProps) {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = image.image;
    link.download = `myangel-${image.id}.png`;
    link.click();
  };

  const handleDelete = () => {
    onDelete(image.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-card relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white/95 p-5">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--angel-bg-soft)] text-[var(--angel-text-soft)] hover:bg-[var(--angel-border)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.image}
          alt={image.prompt}
          className="w-full rounded-xl mb-4"
        />

        {/* Prompt */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="text-[9px] text-[var(--angel-lavender)]">✦</span>
            <span className="text-[10px] font-medium text-[var(--angel-text-soft)] tracking-wider uppercase">Prompt</span>
          </div>
          <p className="text-[13px] leading-[1.8] text-[var(--angel-text)] [word-break:keep-all]">
            {image.prompt}
          </p>
        </div>

        {/* Tags */}
        {image.style_tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {image.style_tags.map((tag) => (
              <span key={tag} className="angel-tag angel-tag-active text-[10px]">#{tag}</span>
            ))}
          </div>
        )}

        {/* Date */}
        <p className="mb-5 text-[10px] text-[var(--angel-text-faint)]">
          {new Date(image.created_at).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={handleDownload} className="angel-btn angel-btn-secondary text-[12px] flex-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            다운로드
          </button>
          <button onClick={handleDelete} className="angel-btn angel-btn-secondary text-[12px] text-red-400 hover:text-red-500 flex-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

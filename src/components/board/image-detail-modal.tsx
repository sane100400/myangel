"use client";

import { useEffect, useState } from "react";
import type { SavedImage } from "@/lib/saved-images";
import { Download, PenLine, Share2, Trash2, X } from "lucide-react";

interface ImageDetailModalProps {
  image: SavedImage;
  onClose: () => void;
  onDelete: (id: string) => Promise<boolean>;
  onShare: (image: SavedImage) => Promise<boolean>;
  onEdit?: (image: SavedImage) => void;
}

export function ImageDetailModal({ image, onClose, onDelete, onShare, onEdit }: ImageDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

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

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    const ok = await onDelete(image.id);
    setIsDeleting(false);
    if (ok) onClose();
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    await onShare(image);
    setIsSharing(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm md:items-center md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="surface-panel relative w-full max-h-[92dvh] overflow-y-auto rounded-t-lg bg-[var(--angel-surface)] p-5 md:max-w-lg md:max-h-[90vh] md:rounded-lg">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--angel-bg-soft)] text-[var(--angel-text-soft)] hover:bg-[var(--angel-border)] transition-colors md:h-8 md:w-8"
        >
          <X size={16} />
        </button>

        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.image}
          alt={image.prompt ?? ""}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full rounded-lg mb-4"
        />

        {/* Prompt */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="text-[12px] font-bold text-[var(--angel-text-soft)]">Prompt</span>
          </div>
          <p className="whitespace-pre-line text-[15px] leading-[1.8] text-[var(--angel-text)] [word-break:keep-all]">
            {image.prompt ?? ""}
          </p>
        </div>

        {/* Date */}
        <p className="mb-5 text-[12px] text-[var(--angel-text-faint)]">
          {new Date(image.created_at).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {onEdit && (
            <button onClick={() => onEdit(image)} className="secondary-action">
              <PenLine size={14} />
              편집
            </button>
          )}
          <button onClick={handleDownload} className="secondary-action flex-1">
            <Download size={14} />
            다운로드
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="secondary-action flex-1 disabled:opacity-50"
          >
            <Share2 size={14} />
            {isSharing ? "공유 중..." : "공유"}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="secondary-action flex-1 text-red-500 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 size={14} />
            {isDeleting ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}

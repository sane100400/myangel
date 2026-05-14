"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ResultImageModalProps {
  src: string;
  alt?: string;
  title?: string;
  onClose: () => void;
}

export function ResultImageModal({
  src,
  alt = "",
  title = "결과 이미지",
  onClose,
}: ResultImageModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#101827]/72 p-3 backdrop-blur-sm md:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[92dvh] w-full max-w-6xl items-center justify-center">
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-lg bg-white/92 text-[var(--angel-text)] shadow-[var(--angel-shadow-soft)] transition-colors hover:bg-white"
        >
          <X size={18} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="max-h-[92dvh] w-auto max-w-full rounded-lg bg-white object-contain shadow-[0_24px_80px_rgba(16,24,39,0.36)]"
        />
      </div>
    </div>
  );
}

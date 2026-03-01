"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getSavedImages, deleteImage, type SavedImage } from "@/lib/saved-images";
import { SavedImageCard } from "@/components/board/saved-image-card";
import { ImageDetailModal } from "@/components/board/image-detail-modal";

export default function MyPage() {
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<SavedImage | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSavedImages(getSavedImages());
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteImage(id);
    setSavedImages(getSavedImages());
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-[var(--angel-lavender)] twinkle mb-3">✦</div>
          <p className="text-[12px] text-[var(--angel-text-soft)]">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 pb-16 md:px-5 md:pt-24">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl font-medium tracking-[0.08em] text-[var(--angel-text)]">
          Mypage
        </h1>
        <p className="mt-2 text-[12px] text-[var(--angel-text-soft)]">
          저장한 이미지와 프롬프트를 확인하세요
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/30" />
          <span className="text-[9px] text-[var(--angel-lavender)] twinkle">✦ ✧ ✦</span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/30" />
        </div>
      </div>

      {/* Quick action */}
      <div className="mb-6 text-center">
        <Link href="/generate" className="angel-btn angel-btn-secondary text-[12px]">
          <span className="text-[10px] text-[var(--angel-lavender)]">✦</span>
          새 이미지 생성하기
        </Link>
      </div>

      {/* Image count */}
      {savedImages.length > 0 && (
        <div className="mb-6 flex justify-center">
          <div className="glass-card rounded-xl px-5 py-2.5 text-center">
            <span className="text-lg font-heading text-[var(--angel-blue)]">{savedImages.length}</span>
            <span className="ml-2 text-[11px] text-[var(--angel-text-soft)]">저장된 이미지</span>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {savedImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 text-2xl text-[var(--angel-lavender)] twinkle">✦</div>
          <p className="text-[13px] text-[var(--angel-text-soft)]">아직 저장한 이미지가 없어요</p>
          <p className="mt-1.5 text-[11px] text-[var(--angel-text-faint)] [word-break:keep-all]">
            Generate에서 이미지를 만들고 저장하면 여기에 나타나요
          </p>
          <div className="mt-6">
            <Link href="/generate" className="angel-btn angel-btn-primary text-[12px]">
              <span className="text-[10px]">✦</span>
              이미지 생성하러 가기
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {savedImages.map((img) => (
            <SavedImageCard
              key={img.id}
              image={img}
              onClick={() => setSelectedImage(img)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedImage && (
        <ImageDetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

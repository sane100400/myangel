"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";

interface ImageInputProps {
  onSubmit: (imageUrl: string) => void;
  isLoading: boolean;
  initialUrl?: string;
}

export function ImageInput({ onSubmit, isLoading, initialUrl }: ImageInputProps) {
  const [url, setUrl] = useState(initialUrl || "");
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialUrl || null);

  const handleSubmit = () => {
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  const handleFileChange = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPreview(dataUrl);
        setUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileChange(file);
    },
    [handleFileChange]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-[var(--angel-lavender)]">✦</span>
        <h2
          className="font-heading text-lg font-medium tracking-[0.08em] text-[var(--angel-text)]"
        >
          무드 이미지 입력
        </h2>
      </div>

      {/* URL Input */}
      <div className="flex gap-2">
        <Input
          placeholder="이미지 URL을 붙여넣으세요..."
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (e.target.value.startsWith("http")) {
              setPreview(e.target.value);
            }
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={isLoading}
          className="rounded-full border-[var(--angel-border)] bg-white/50 text-[12px] placeholder-[var(--angel-text-faint)] focus:border-[var(--angel-blue)]/40 focus:bg-white/70"
        />
        <button
          onClick={handleSubmit}
          disabled={!url.trim() || isLoading}
          className="angel-btn angel-btn-primary shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? "분석 중..." : "분석하기"}
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex min-h-[200px] cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300 ${
          dragOver
            ? "border-[var(--angel-blue)]/40 bg-[var(--angel-blue-pale)]/30"
            : "border-white/30 hover:border-[var(--angel-blue)]/25 glass-card"
        }`}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) handleFileChange(file);
          };
          input.click();
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="미리보기"
            className="max-h-[300px] rounded-xl object-contain"
          />
        ) : (
          <div className="text-center">
            <div className="mb-3 text-2xl text-[var(--angel-lavender)] twinkle">✦</div>
            <p className="text-[12px] text-[var(--angel-text-soft)]">이미지를 드래그하거나 클릭하여 업로드</p>
            <p className="mt-1 text-[10px] text-[var(--angel-text-faint)]">
              JPG, PNG, WebP 지원
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

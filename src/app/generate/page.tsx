"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { saveImage } from "@/lib/saved-images";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { InlineEnhancer } from "@/components/studio/inline-enhancer";

// ── Reference image types ──

interface RefImage {
  id: string;
  preview: string;
  base64: string;
  mimeType: string;
}

const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

const MAGIC_BYTES: { mime: AllowedType; bytes: number[] }[] = [
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

function detectMimeFromBytes(header: Uint8Array): AllowedType | null {
  for (const { mime, bytes } of MAGIC_BYTES) {
    if (bytes.every((b, i) => header[i] === b)) return mime;
  }
  return null;
}

async function validateAndReadFile(
  file: File
): Promise<{ base64: string; mimeType: AllowedType }> {
  const headerBuf = await file.slice(0, 16).arrayBuffer();
  const header = new Uint8Array(headerBuf);
  const realMime = detectMimeFromBytes(header);
  if (!realMime) throw new Error("지원하지 않는 이미지 형식입니다.");

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const b64 = dataUrl.split(",")[1];
      if (!b64) return reject(new Error("파일을 읽을 수 없습니다."));
      resolve(b64);
    };
    reader.onerror = () => reject(new Error("파일을 읽을 수 없습니다."));
    reader.readAsDataURL(file);
  });

  return { base64, mimeType: realMime };
}

// ── Progress bar ──

const EST_STANDARD = 20;
const EST_PREMIUM = 35;

// ── Component ──

export default function StudioPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [premium, setPremium] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ image: string; promptUsed: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isShared, setIsShared] = useState(false);

  // Reference images
  const [refImages, setRefImages] = useState<RefImage[]>([]);
  const [refError, setRefError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Progress bar
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const estimatedTime = premium ? EST_PREMIUM : EST_STANDARD;
  const progress = Math.min(95, (elapsed / estimatedTime) * 90);
  const remaining = Math.max(0, Math.ceil(estimatedTime - elapsed));

  const startTimer = useCallback(() => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((p) => p + 0.5), 500);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTimer();
      refImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopTimer]);

  // ── Reference image handlers ──

  const refImagesCountRef = useRef(refImages.length);
  refImagesCountRef.current = refImages.length;

  const addRefFiles = useCallback(async (files: File[]) => {
    const available = MAX_IMAGES - refImagesCountRef.current;
    if (available <= 0) return;
    const toProcess = files.slice(0, available);

    for (const file of toProcess) {
      if (!ALLOWED_TYPES.includes(file.type as AllowedType)) {
        setRefError("PNG, JPEG, WebP 이미지만 업로드할 수 있어요.");
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setRefError("이미지 크기는 4MB 이하만 가능해요.");
        continue;
      }
      try {
        const { base64, mimeType } = await validateAndReadFile(file);
        const preview = URL.createObjectURL(file);
        setRefImages((prev) => [
          ...prev,
          { id: `${Date.now()}-${Math.random()}`, preview, base64, mimeType },
        ]);
      } catch {
        setRefError("이미지를 읽는 중 오류가 발생했어요.");
      }
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    await addRefFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isGenerating) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const allowedSet = new Set<string>(ALLOWED_TYPES);
      const imageFiles: File[] = [];
      for (const item of items) {
        if (allowedSet.has(item.type)) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        addRefFiles(imageFiles);
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [addRefFiles, isGenerating]);

  const removeRefImage = (id: string) => {
    setRefImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((img) => img.id !== id);
    });
  };

  // ── Generate (with auto compose) ──

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setIsSaved(false);
    setIsShared(false);
    startTimer();

    try {
      // Step 1: Compose optimized English prompt from current text
      let enhancedEn: string | undefined;
      try {
        const composeRes = await fetch("/api/compose-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            objects: [
              {
                id: "full",
                role: "subject",
                label: "전체",
                description: prompt.trim(),
                attributes: [],
              },
            ],
            selectedAlternatives: {},
          }),
        });
        if (composeRes.ok) {
          const composeData = await composeRes.json();
          enhancedEn = composeData.promptEn;
        }
      } catch {
        // Fall through — generate with original prompt
      }

      // Step 2: Generate image
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          enhancedPromptEn: enhancedEn,
          premium,
          referenceImages: refImages.map((img) => ({
            base64: img.base64,
            mimeType: img.mimeType,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "이미지 생성에 실패했습니다.");
      }
      const data = await res.json();
      setResult({ image: data.image, promptUsed: data.promptUsed });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      stopTimer();
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result?.image) return;
    const link = document.createElement("a");
    link.href = result.image;
    link.download = `myangel-${Date.now()}.png`;
    link.click();
  };

  const handleSave = () => {
    if (!result?.image || isSaved) return;
    saveImage({
      prompt: prompt.trim(),
      style: null,
      image: result.image,
      style_tags: [],
    });
    setIsSaved(true);
  };

  const handleShare = async () => {
    if (!result?.image || isSharing || isShared) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Discover에 공유하려면 로그인이 필요해요.");
      router.push("/auth/login");
      return;
    }
    setIsSharing(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: result.image,
          title: prompt.trim().slice(0, 50) || "AI 생성 이미지",
          tags: [],
          prompt: prompt.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("로그인이 필요해요.");
          router.push("/auth/login");
          return;
        }
        toast.error(data.error || "공유에 실패했어요.");
        return;
      }
      setIsShared(true);
      toast.success("Discover에 공유되었어요!");
    } catch {
      toast.error("공유 중 오류가 발생했어요.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setPrompt("");
    setError(null);
    setIsSaved(false);
    setIsShared(false);
    refImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setRefImages([]);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-16 md:px-5 md:pt-24">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl font-medium tracking-[0.08em] text-[var(--angel-text)]">
          Studio
        </h1>
        <p className="mt-2 text-[13px] text-[var(--angel-text-soft)]">
          프롬프트를 입력하면 AI가 약한 표현을 감지하고 개선해줘요
        </p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/30" />
          <span className="text-[9px] text-[var(--angel-lavender)] twinkle">
            ✦ ✧ ✦
          </span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/30" />
        </div>
      </div>

      {/* Main Input — Inline Enhancer */}
      {!result && (
        <div className="space-y-4">
          <InlineEnhancer
            value={prompt}
            onChange={setPrompt}
            disabled={isGenerating}
            placeholder={"원하는 이미지를 설명해주세요\n예: 하얀 침대가 있는 몽환적인 방, 창문으로 들어오는 부드러운 햇살"}
          />

          {/* Reference images */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--angel-text-soft)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="text-[12px] text-[var(--angel-text-soft)]">
                레퍼런스 이미지{" "}
                <span className="text-[10px] text-[var(--angel-text-faint)]">
                  (붙여넣기 가능)
                </span>
              </span>
              <span className="text-[10px] text-[var(--angel-text-faint)]">
                ({refImages.length}/{MAX_IMAGES})
              </span>
            </div>
            <div className="flex items-start gap-2 flex-wrap">
              {refImages.map((img) => (
                <div key={img.id} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.preview}
                    alt="레퍼런스"
                    className="h-20 w-20 rounded-lg object-cover border border-[var(--angel-border)]"
                  />
                  <button
                    type="button"
                    onClick={() => removeRefImage(img.id)}
                    disabled={isGenerating}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#1a1a2e]/80 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="삭제"
                  >
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M4 4L12 12M12 4L4 12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              ))}
              {refImages.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGenerating}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--angel-border)] bg-white/50 text-[var(--angel-text-faint)] transition-all hover:border-[var(--angel-blue)]/50 hover:bg-white/80 hover:text-[var(--angel-blue)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span className="text-[9px]">추가</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            {refError && (
              <p className="mt-1.5 text-[10px] text-red-500">{refError}</p>
            )}
            {refImages.length > 0 && (
              <p className="mt-1.5 text-[10px] text-[var(--angel-text-faint)]">
                레퍼런스 이미지의 스타일과 분위기를 참고하여 새 이미지를
                생성해요
              </p>
            )}
          </div>

          {/* Premium Toggle */}
          <div className="flex items-center justify-center">
            <div className="group relative">
              <button
                type="button"
                onClick={() => setPremium((v) => !v)}
                disabled={isGenerating}
                className={`glass-card flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium transition-all ${
                  premium
                    ? "bg-[#ffd700]/12 border border-[#ffd700]/30 text-[#b8860b] shadow-[0_0_12px_rgba(255,215,0,0.15)]"
                    : "border border-[var(--angel-border)] text-[var(--angel-text-soft)]"
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 18h18V8l-4 4-5-6-5 6-4-4v10z"
                    fill={premium ? "#ffd700" : "none"}
                    stroke={premium ? "#b8860b" : "currentColor"}
                    strokeWidth="1.5"
                  />
                </svg>
                프리미엄
                <span
                  className={`text-[9px] rounded-full px-1.5 py-0.5 transition-colors ${
                    premium
                      ? "bg-[#ffd700]/25 text-[#b8860b]"
                      : "bg-[var(--angel-bg-soft)] text-[var(--angel-text-faint)]"
                  }`}
                >
                  {premium ? "ON" : "OFF"}
                </span>
              </button>
              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 rounded-xl bg-[#1a1a2e]/90 backdrop-blur-sm px-4 py-3 text-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-30">
                <p className="text-[11px] leading-[1.7] text-white/90">
                  고해상도 2K 이미지를 생성해요.
                  <br />
                  더 선명하고 디테일한 결과물!
                </p>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-[#1a1a2e]/90" />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full angel-btn angel-btn-primary py-3 text-[13px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="twinkle text-[10px]">✦</span>
                이미지를 생성하고 있어요...
                <span
                  className="twinkle text-[10px]"
                  style={{ animationDelay: "0.5s" }}
                >
                  ✦
                </span>
              </span>
            ) : (
              <>
                <span className="text-[10px]">✦</span>
                이미지 생성하기
              </>
            )}
          </button>
        </div>
      )}

      {/* Loading — Progress Bar */}
      {isGenerating && (
        <div className="mt-8 mx-auto max-w-md">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--angel-blue)]/10">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--angel-blue)] to-[var(--angel-lavender)] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{
                width: `${progress}%`,
                animation: "shimmer 1.5s infinite",
              }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--angel-text-soft)]">
            <span>{Math.floor(elapsed)}초 경과</span>
            <span>
              {remaining > 0 ? `약 ${remaining}초 남음` : "거의 완성..."}
            </span>
          </div>
          <div className="mt-5 flex flex-col items-center gap-3">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 rounded-2xl bg-[var(--angel-blue)]/5 pulse-glow" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-2xl twinkle">✦</div>
              </div>
            </div>
            <p className="text-[12px] text-[var(--angel-text-soft)]">
              {elapsed < 3
                ? "프롬프트를 최적화하고 있어요..."
                : elapsed < 8
                ? "영어 프롬프트로 변환 중..."
                : elapsed < estimatedTime * 0.5
                ? "이미지를 그리고 있어요..."
                : elapsed < estimatedTime * 0.8
                ? "디테일을 다듬고 있어요..."
                : "거의 다 됐어요! 조금만 기다려주세요..."}
            </p>
            {premium && (
              <div className="flex items-center gap-1.5 rounded-full bg-[#ffd700]/10 px-3 py-1">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="#ffd700"
                  stroke="#b8860b"
                  strokeWidth="1"
                >
                  <path d="M3 18h18V8l-4 4-5-6-5 6-4-4v10z" />
                </svg>
                <span className="text-[10px] text-[#b8860b]">
                  2K 고해상도로 생성 중
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-[13px] text-red-600 text-center">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-2 space-y-8">
          {/* Generated Image */}
          <div className="text-center">
            <div className="celestial-divider mb-6">
              <span className="text-[10px] tracking-[0.3em] text-[var(--angel-lavender)]">
                RESULT
              </span>
            </div>
            <div className="glass-card rounded-2xl p-3 inline-block relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.image}
                alt="생성된 이미지"
                className="max-w-full rounded-xl"
                style={{ maxHeight: "512px" }}
              />
              {premium && (
                <div className="absolute top-5 right-5 flex items-center gap-1.5 rounded-full bg-[#ffd700]/90 px-2.5 py-1 shadow-md">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="#fff"
                    stroke="#b8860b"
                    strokeWidth="1"
                  >
                    <path d="M3 18h18V8l-4 4-5-6-5 6-4-4v10z" />
                  </svg>
                  <span className="text-[10px] font-medium text-white">
                    2K
                  </span>
                </div>
              )}
            </div>

            {/* Prompt used */}
            <div className="mt-4 mx-auto max-w-md">
              <p className="text-[10px] text-[var(--angel-text-faint)] mb-1">사용된 프롬프트</p>
              <p className="glass-card rounded-lg px-3 py-2 text-[11px] leading-relaxed text-[var(--angel-text-soft)] text-left">
                {prompt}
              </p>
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                onClick={handleDownload}
                className="angel-btn angel-btn-secondary text-[12px]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                다운로드
              </button>
              <button
                onClick={handleSave}
                disabled={isSaved}
                className={`angel-btn text-[12px] ${
                  isSaved ? "angel-btn-primary" : "angel-btn-secondary"
                }`}
              >
                {isSaved ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    저장됨
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                    저장하기
                  </>
                )}
              </button>
              <button
                onClick={handleShare}
                disabled={isSharing || isShared}
                className={`angel-btn text-[12px] ${
                  isShared ? "angel-btn-primary" : "angel-btn-secondary"
                }`}
              >
                {isShared ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    공유됨
                  </>
                ) : isSharing ? (
                  <span className="flex items-center gap-1.5">
                    <span className="twinkle text-[10px]">✦</span>
                    공유 중...
                  </span>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                    Discover에 공유
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                className="angel-btn angel-btn-secondary text-[12px]"
              >
                새로 만들기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

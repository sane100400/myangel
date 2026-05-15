"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveImage } from "@/lib/saved-images";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { InlineEnhancer } from "@/components/studio/inline-enhancer";
import { GenerationProgress, initialProgress, type ProgressState } from "@/components/studio/generation-progress";
import { ResultImageModal } from "@/components/studio/result-image-modal";
import { QualityInfoTooltip } from "@/components/studio/quality-info-tooltip";
import { StudioStepArrow, StudioStepDot } from "@/components/studio/studio-step-indicator";
import { postSSE } from "@/lib/sse-client";
import { buildImageTitle } from "@/lib/image-title";
import { saveEditorTransfer } from "@/lib/editor-transfer";
import {
  normalizeImageQualityForModel,
  supportsImageQuality,
  unsupportedQualityMessage,
  type AspectRatio,
  type ImageModelChoice as ModelChoice,
  type ImageQuality as Quality,
} from "@/lib/image-models";
import {
  Coins,
  Download,
  ImagePlus,
  PenLine,
  Share2,
  Sparkles,
} from "lucide-react";

interface ExamplePrompt {
  label: string;
  prompt: string;
}

const EXAMPLE_PROMPTS: readonly ExamplePrompt[] = [
  {
    label: "자연광 제품 사진",
    prompt:
      "자연광이 들어오는 밝은 책상 위에 무광 세라믹 텀블러를 놓은 제품 사진.\n흰 배경, 부드러운 그림자, 깨끗한 상업용 촬영 느낌, 고해상도.",
  },
  {
    label: "밝은 작업 공간",
    prompt:
      "오전 햇살이 들어오는 정돈된 작업 공간, 노트북과 메모지, 작은 식물이 놓인 장면.\n밝고 차분한 색감, 생산적인 분위기, 실제 사무실 사진처럼 자연스럽게.",
  },
  {
    label: "미니멀 거실",
    prompt:
      "따뜻한 소파와 낮은 원목 테이블이 있는 미니멀 거실 인테리어.\n부드러운 자연광, 정돈된 소품, 잡지 화보 같은 균형 잡힌 구도.",
  },
  {
    label: "스튜디오 인물 사진",
    prompt:
      "밝은 스튜디오에서 촬영한 인물 프로필 사진, 자연스러운 표정과 깔끔한 의상.\n부드러운 키라이트, 얕은 심도, 포트폴리오에 어울리는 고급스러운 톤.",
  },
  {
    label: "흰 배경 제품 컷",
    prompt:
      "흰 배경 위에 신제품 패키지를 중앙에 세운 깨끗한 제품 컷.\n선명한 윤곽, 자연스러운 바닥 그림자, 온라인 스토어 썸네일에 맞는 상업 사진.",
  },
  {
    label: "도시 야경 포스터",
    prompt:
      "비가 그친 밤의 도심 거리와 네온사인이 반사되는 시네마틱 포스터 이미지.\n깊은 대비, 선명한 빛 번짐, 영화 홍보물처럼 강한 분위기.",
  },
  {
    label: "차분한 북카페",
    prompt:
      "나무 책장과 창가 좌석이 있는 조용한 북카페, 커피잔과 펼쳐진 책이 놓인 장면.\n따뜻한 실내 조명, 차분한 색감, 오후의 아늑한 분위기.",
  },
  {
    label: "모던한 앱 목업",
    prompt:
      "스마트폰 화면에 모던한 생산성 앱 UI가 보이는 깔끔한 목업 이미지.\n밝은 배경, 실제 제품 발표 자료 같은 정돈된 구도, 선명한 인터페이스.",
  },
  {
    label: "따뜻한 주방 풍경",
    prompt:
      "아침 햇살이 들어오는 따뜻한 주방, 원목 식탁 위에 빵과 커피가 놓인 장면.\n생활감은 적당히 남기고 전체는 깔끔하게, 부드럽고 편안한 광고 사진 느낌.",
  },
  {
    label: "파란 하늘 여행 사진",
    prompt:
      "파란 하늘 아래 해변 산책로를 따라 여행 가방이 놓인 밝은 여행 사진.\n청량한 색감, 넓은 여백, 여행 브랜드 캠페인에 어울리는 생동감.",
  },
  {
    label: "컬러풀한 패키지",
    prompt:
      "선명한 컬러의 음료 패키지 여러 개가 리듬감 있게 놓인 브랜드 이미지.\n깨끗한 배경, 팝한 조명, SNS 광고에 어울리는 밝고 에너지 있는 스타일.",
  },
  {
    label: "깔끔한 책상 위 소품",
    prompt:
      "정리된 책상 위에 펜, 노트, 작은 오브제가 균형 있게 배치된 플랫레이 사진.\n은은한 자연광, 부드러운 그림자, 미니멀한 라이프스타일 매거진 톤.",
  },
  {
    label: "브랜드 캠페인 컷",
    prompt:
      "신규 라이프스타일 브랜드의 메인 캠페인 컷, 제품과 인물이 자연스럽게 어우러진 장면.\n세련된 색 보정, 넉넉한 여백, 웹사이트 첫 화면에 쓰기 좋은 구성.",
  },
  {
    label: "실내 식물과 의자",
    prompt:
      "밝은 창가 옆 라운지 체어와 큰 실내 식물이 함께 놓인 인테리어 사진.\n깨끗한 벽면, 부드러운 그림자, 편안하고 세련된 홈스타일링 분위기.",
  },
  {
    label: "부드러운 조명 사진",
    prompt:
      "은은한 조명이 피사체를 감싸는 부드러운 분위기의 감성 사진.\n낮은 대비, 자연스러운 피부톤과 질감, 차분한 브랜드 룩북에 어울리는 톤.",
  },
  {
    label: "감각적인 썸네일",
    prompt:
      "콘텐츠 주제가 한눈에 보이는 감각적인 썸네일 이미지, 중앙 오브젝트와 강한 시선 흐름.\n명확한 대비, 읽기 쉬운 여백, 클릭하고 싶게 만드는 시각적 임팩트.",
  },
  {
    label: "커뮤니티 공유 이미지",
    prompt:
      "온라인 커뮤니티에 공유하기 좋은 밝고 친근한 이미지, 핵심 오브젝트가 중앙에 보이는 구성.\n따뜻한 색감, 부담 없는 분위기, 작은 화면에서도 잘 보이는 선명한 디테일.",
  },
  {
    label: "레퍼런스 기반 이미지",
    prompt:
      "업로드한 레퍼런스의 구도와 분위기를 유지하면서 더 완성도 높은 이미지로 재해석.\n원본의 핵심 특징은 살리고, 조명과 질감은 자연스럽게 정리한 결과.",
  },
] as const;

const DEFAULT_EXAMPLE_CHIPS = EXAMPLE_PROMPTS.filter((example) => example.label.length <= 13).slice(0, 4);

function pickExamples(n: number): ExamplePrompt[] {
  const pool = EXAMPLE_PROMPTS.filter((example) => example.label.length <= 13);
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

function createClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface RefImage {
  id: string;
  preview: string;
  base64: string;
  mimeType: string;
}

interface GeneratedResult {
  id: string;
  src: string;
  savedId: string | null;
  saveStatus: "saving" | "saved" | "failed";
  saveError: string | null;
  sharedId: string | null;
  isSharing: boolean;
}

const MODEL_LABEL: Record<ModelChoice, string> = {
  "nano-banana-pro": "Nano Banana Pro",
  "gpt-image-2": "GPT Image 2",
};
const MODEL_HINT: Record<ModelChoice, string> = {
  "gpt-image-2": "OpenAI · 빠른 기본 생성",
  "nano-banana-pro": "Google · 스타일 강함, 더 오래 걸릴 수 있음",
};

const MAX_REFS = 3;
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const SHARE_TITLE_MAX = 32;
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

async function readFile(
  file: File
): Promise<{ base64: string; mimeType: AllowedType }> {
  const headerBuf = await file.slice(0, 16).arrayBuffer();
  const realMime = detectMimeFromBytes(new Uint8Array(headerBuf));
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

function getClipboardImageFiles(event: ClipboardEvent): File[] {
  const data = event.clipboardData;
  if (!data) return [];

  const files = Array.from(data.files ?? []).filter((file) =>
    file.type.startsWith("image/")
  );
  if (files.length > 0) return files;

  return Array.from(data.items ?? [])
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file));
}

function dataUrlToRefImage(dataUrl: string): Omit<RefImage, "id"> | null {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1] as AllowedType;
  const base64 = match[2];
  if (!ALLOWED_TYPES.includes(mimeType)) return null;
  if (!base64 || base64.length > 6 * 1024 * 1024) return null;
  return { preview: dataUrl, base64, mimeType };
}

const QUALITY_LABEL: Record<Quality, string> = {
  "1K": "표준",
  "2K": "고화질",
  "4K": "초고화질",
};
const ASPECT_OPTIONS: Array<{
  value: AspectRatio;
  label: string;
  previewClass: string;
}> = [
  {
    value: "1:1",
    label: "정방형",
    previewClass: "h-8 w-8 sm:h-10 sm:w-10",
  },
  {
    value: "4:3",
    label: "가로형",
    previewClass: "h-7 w-10 sm:h-9 sm:w-[52px]",
  },
  {
    value: "3:4",
    label: "세로형",
    previewClass: "h-10 w-7 sm:h-[52px] sm:w-9",
  },
];

const aspectLabel = (value: AspectRatio): string =>
  ASPECT_OPTIONS.find((option) => option.value === value)?.label ?? "정방형";

export default function GeneratePage() {
  const router = useRouter();

  const [exampleChips, setExampleChips] = useState<ExamplePrompt[]>(DEFAULT_EXAMPLE_CHIPS);

  useEffect(() => {
    setExampleChips(pickExamples(4));
  }, []);

  const [prompt, setPrompt] = useState("");
  const promptEditorRef = useRef<HTMLDivElement>(null);
  const [model, setModel] = useState<ModelChoice>("gpt-image-2");
  const [quality, setQuality] = useState<Quality>("1K");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [count, setCount] = useState(1);
  const [refImages, setRefImages] = useState<RefImage[]>([]);
  const [refError, setRefError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [previewResult, setPreviewResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState>(initialProgress);
  const savePromisesRef = useRef<Map<string, Promise<string | null>>>(new Map());

  const [authed, setAuthed] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [pricing, setPricing] = useState<Record<Quality, number> | null>(null);

  const refreshBalance = useCallback(async () => {
    try {
      const r = await fetch("/api/credits/balance", { cache: "no-store" });
      const d = await r.json();
      setAuthed(Boolean(d.authed));
      setBalance(typeof d.balance === "number" ? d.balance : 0);
      if (d.pricing?.generate) setPricing(d.pricing.generate);
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/credits/balance", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setAuthed(Boolean(d.authed));
        setBalance(typeof d.balance === "number" ? d.balance : 0);
        if (d.pricing?.generate) setPricing(d.pricing.generate);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const cost = pricing ? pricing[quality] * count : count;
  const hasInsufficientCredits = authed && balance !== null && balance < cost;
  const isQualitySupported = supportsImageQuality(model, quality);
  const canGenerate =
    Boolean(prompt.trim()) && !isGenerating && !hasInsufficientCredits && isQualitySupported;

  useEffect(() => {
    if (!isQualitySupported) {
      setQuality(normalizeImageQualityForModel(model, quality));
    }
  }, [isQualitySupported, model, quality]);

  const handleQualitySelect = (nextQuality: Quality) => {
    if (!supportsImageQuality(model, nextQuality)) return;
    setQuality(nextQuality);
  };

  const applyExamplePrompt = useCallback((nextPrompt: string) => {
    setPrompt(nextPrompt);
    window.requestAnimationFrame(() => {
      const editor = promptEditorRef.current;
      editor?.scrollIntoView({ behavior: "smooth", block: "center" });
      editor?.querySelector("textarea")?.focus({ preventScroll: true });
    });
  }, []);

  // 최신 refImages를 ref에 보관 — unmount 시점에 모든 blob URL 해제
  const refImagesRef = useRef<RefImage[]>([]);

  useEffect(() => {
    refImagesRef.current = refImages;
  }, [refImages]);

  useEffect(() => {
    return () => {
      refImagesRef.current.forEach((img) => {
        if (img.preview.startsWith("blob:")) URL.revokeObjectURL(img.preview);
      });
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const promptParam = params.get("prompt");
    if (promptParam) setPrompt(promptParam);

    const rawRef = sessionStorage.getItem("generate:reference");
    if (!rawRef) return;
    sessionStorage.removeItem("generate:reference");
    try {
      const parsed = JSON.parse(rawRef) as { dataUrl?: unknown; prompt?: unknown };
      const storedPrompt = typeof parsed.prompt === "string" ? parsed.prompt.trim() : "";
      if (storedPrompt) {
        setPrompt((cur) => cur || storedPrompt);
      }
      if (typeof parsed.dataUrl !== "string") throw new Error("missing data url");
      const ref = dataUrlToRefImage(parsed.dataUrl);
      if (!ref) throw new Error("invalid reference image");
      setRefImages((prev) => [
        ...prev.slice(0, MAX_REFS - 1),
        { id: `discover-${Date.now()}`, ...ref },
      ]);
      toast.success("Discover 이미지를 레퍼런스로 추가했어요.");
    } catch {
      toast.error("Discover 이미지를 레퍼런스로 불러오지 못했어요.");
    }
  }, []);

  const addFiles = useCallback(async (files: File[], source: "upload" | "paste" = "upload") => {
    const available = MAX_REFS - refImages.length;
    if (available <= 0) {
      toast.error(`레퍼런스는 최대 ${MAX_REFS}장까지 가능해요.`);
      return false;
    }
    let addedCount = 0;
    setRefError(null);
    for (const file of files.slice(0, available)) {
      if (!ALLOWED_TYPES.includes(file.type as AllowedType)) {
        setRefError("PNG, JPEG, WebP만 가능해요.");
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setRefError("이미지 크기는 4MB 이하만 가능해요.");
        continue;
      }
      try {
        const { base64, mimeType } = await readFile(file);
        const preview = URL.createObjectURL(file);
        setRefImages((prev) => [
          ...prev,
          { id: `${Date.now()}-${Math.random()}`, preview, base64, mimeType },
        ]);
        addedCount += 1;
      } catch {
        setRefError("이미지를 읽는 중 오류가 발생했어요.");
      }
    }
    if (source === "paste" && addedCount > 0) {
      toast.success("클립보드 이미지를 레퍼런스로 추가했어요.");
    }
    if (files.length > available) {
      toast.error(`레퍼런스는 최대 ${MAX_REFS}장까지만 추가돼요.`);
    }
    return addedCount > 0;
  }, [refImages.length]);

  useEffect(() => {
    const onPaste = async (event: ClipboardEvent) => {
      const files = getClipboardImageFiles(event);
      if (files.length === 0) return;
      event.preventDefault();
      await addFiles(files, "paste");
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  const removeRef = (id: string) => {
    setRefImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.preview.startsWith("blob:")) URL.revokeObjectURL(target.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    if (!authed) {
      toast.error("로그인이 필요해요.");
      router.push("/auth/login");
      return;
    }
    if (!supportsImageQuality(model, quality)) {
      setQuality(normalizeImageQualityForModel(model, quality));
      return;
    }
    setError(null);
    setResults([]);
    savePromisesRef.current.clear();
    setIsGenerating(true);
    setProgress({
      active: true,
      total: count,
      completed: 0,
      failed: 0,
      startedAt: Date.now(),
      message: "요청 보내는 중",
    });

    const newImages: string[] = [];
    const promptText = prompt.trim();
    let streamErr: string | null = null;
    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    await postSSE(
      "/api/generate",
      {
        prompt: promptText,
        model,
        quality,
        aspectRatio,
        count,
        referenceImages: refImages.map((i) => ({
          base64: i.base64,
          mimeType: i.mimeType,
        })),
      },
      {
        headers: { "Idempotency-Key": idempotencyKey },
        onMessage: (msg) => {
          const data = msg.data as Record<string, unknown>;
          if (msg.event === "stage") {
            setProgress((p) => ({
              ...p,
              total: typeof data.total === "number" ? data.total : p.total,
              message: typeof data.message === "string" ? data.message : p.message,
            }));
          } else if (msg.event === "image") {
            const img = data.image as string;
            const resultId = createClientId();
            newImages.push(img);
            setResults((prev) => [
              ...prev,
              {
                id: resultId,
                src: img,
                savedId: null,
                saveStatus: "saving",
                saveError: null,
                sharedId: null,
                isSharing: false,
              },
            ]);
            setProgress((p) => ({ ...p, completed: p.completed + 1 }));
            // 백그라운드로 마이페이지 저장
            const savePromise = saveImage({
              prompt: promptText,
              image: img,
              source: "generate",
              meta: { model, quality, count, aspectRatio },
            }).then((r) => {
              if (!r.ok) {
                toast.error(`마이페이지 저장 실패: ${r.error}`);
                setResults((prev) =>
                  prev.map((item) =>
                    item.id === resultId
                      ? { ...item, saveStatus: "failed", saveError: r.error }
                      : item
                  )
                );
                return null;
              }
              setResults((prev) =>
                prev.map((item) =>
                  item.id === resultId
                    ? { ...item, savedId: r.item.id, saveStatus: "saved", saveError: null }
                    : item
                )
              );
              return r.item.id;
            }).finally(() => {
              savePromisesRef.current.delete(resultId);
            });
            savePromisesRef.current.set(resultId, savePromise);
          } else if (msg.event === "image_failed") {
            setProgress((p) => ({ ...p, failed: p.failed + 1 }));
          } else if (msg.event === "done") {
            const succ = typeof data.count === "number" ? data.count : newImages.length;
            if (succ > 0) toast.success(`${succ}장 생성 완료`);
            refreshBalance();
          } else if (msg.event === "error") {
            streamErr = typeof data.message === "string" ? data.message : "생성 실패";
          }
        },
        onError: (e) => {
          streamErr = e.message;
        },
        onClose: () => {
          setProgress((p) => ({ ...p, active: false }));
          setIsGenerating(false);
          if (streamErr) setError(streamErr);
        },
      }
    );
  };

  const downloadImage = (src: string, idx: number) => {
    const link = document.createElement("a");
    link.href = src;
    link.download = `myangel-${idx + 1}.png`;
    link.click();
  };

  const sendToEditor = async (src: string) => {
    try {
      const transferId = await saveEditorTransfer({
        base: src,
        quality,
        model,
        sourcePrompt: prompt.trim() || undefined,
      });
      router.push(transferId ? `/edit?transfer=${encodeURIComponent(transferId)}` : "/edit");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "편집기로 보내지 못했어요.");
    }
  };

  const handleShare = async (item: GeneratedResult) => {
    if (item.isSharing) return;
    if (item.sharedId) {
      toast.info("이미 Discover에 공유된 이미지예요.");
      return;
    }

    const toastId = `share-${item.id}`;
    setResults((prev) =>
      prev.map((result) =>
        result.id === item.id ? { ...result, isSharing: true } : result
      )
    );

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Discover에 공유하려면 로그인이 필요해요.", { id: toastId });
      setResults((prev) =>
        prev.map((result) =>
          result.id === item.id ? { ...result, isSharing: false } : result
        )
      );
      router.push("/auth/login");
      return;
    }
    try {
      let savedId = item.savedId;
      if (!savedId) {
        savedId = (await savePromisesRef.current.get(item.id)) ?? null;
      }
      if (!savedId) {
        toast.error("마이페이지 저장이 끝난 뒤 다시 공유해주세요.", { id: toastId });
        return;
      }

      const defaultTitle = buildImageTitle(prompt.trim(), "AI 생성 이미지", SHARE_TITLE_MAX);
      const enteredTitle = window.prompt(
        `Discover에 표시할 제목을 입력해주세요. (최대 ${SHARE_TITLE_MAX}자)`,
        defaultTitle
      );
      if (enteredTitle === null) return;
      const shareTitle = enteredTitle.trim().slice(0, SHARE_TITLE_MAX) || "공유 이미지";

      toast.loading("Discover에 공유하는 중...", { id: toastId });

      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: shareTitle,
          prompt: prompt.trim(),
          sourceGenerationId: savedId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "공유에 실패했어요.", { id: toastId });
        return;
      }
      setResults((prev) =>
        prev.map((result) =>
          result.id === item.id
            ? {
                ...result,
                savedId,
                sharedId: typeof data.id === "string" ? data.id : result.sharedId,
              }
            : result
        )
      );
      if (data.alreadyShared) {
        toast.info(data.message || "이미 Discover에 공유된 이미지예요.", {
          id: toastId,
          description: "Discover에서 확인할 수 있어요.",
        });
      } else {
        toast.success(data.message || "Discover에 공유했어요.", {
          id: toastId,
          description: "공유 탭에서 바로 확인할 수 있어요.",
        });
      }
    } catch {
      toast.error("공유 중 오류가 발생했어요.", { id: toastId });
    } finally {
      setResults((prev) =>
        prev.map((result) =>
          result.id === item.id ? { ...result, isSharing: false } : result
        )
      );
    }
  };

  return (
    <div className="studio-shell">
      {/* ─── Top utility bar: tabs + balance ─── */}
      <div className="mb-6 flex items-center justify-between gap-3 md:mb-8">
        <div className="app-tabs">
          <Link
            href="/generate"
            prefetch={false}
            className="app-tab app-tab-active"
          >
            생성
          </Link>
          <Link
            href="/edit"
            prefetch={false}
            className="app-tab"
          >
            편집
          </Link>
        </div>

        <div className="credit-pill">
          <Coins size={15} className="text-[var(--angel-blue)]" />
          <span className="text-[14px] font-bold tabular-nums text-[var(--angel-blue)]">
            {balance ?? "—"}
          </span>
          <span>크레딧</span>
        </div>
      </div>

      {/* ─── Hero header — claims this is the studio ─── */}
      <div className="page-header">
        <div>
          <p className="page-kicker">AI Image Studio</p>
          <h1 lang="en" className="page-title page-title-en">
            Gener<span className="shimmer-text">ate</span>
          </h1>
          <p className="page-lead">
            한 줄 프롬프트를 다듬고, 모델과 화질을 고른 뒤 바로 결과를 생성합니다.
          </p>
        </div>

        {/* Mini step indicator — reinforces the flow */}
        <div className="flex w-fit items-center gap-2.5 text-[12px] font-medium text-[var(--angel-text-soft)] md:justify-self-end md:gap-3 md:text-[13px]">
          <StudioStepDot n="1" label="입력" active />
          <StudioStepArrow />
          <StudioStepDot n="2" label="강화" />
          <StudioStepArrow />
          <StudioStepDot n="3" label="생성" />
        </div>
      </div>

      <div className="space-y-5 md:space-y-6">
        {/* ─── Prompt — the centerpiece ─── */}
        <div className="surface-panel">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <label className="field-label md:text-[16px]">
              어떤 이미지를 만들어볼까요?
            </label>
          </div>

          <div className="mb-3 min-h-[64px]">
            <div className="mb-1.5 text-[12px] text-[var(--angel-text-faint)]">
              예시 프롬프트
            </div>
            <div className="flex flex-wrap gap-1.5">
              {exampleChips.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => applyExamplePrompt(example.prompt)}
                  className="quiet-chip whitespace-nowrap"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>

          <div ref={promptEditorRef}>
            <InlineEnhancer
              value={prompt}
              onChange={setPrompt}
              placeholder={"원하는 이미지를 묘사해주세요\n예: 자연광이 들어오는 책상 위 제품 사진, 흰 배경, 부드러운 그림자"}
            />
          </div>
        </div>

        {/* Reference images */}
        <div className="surface-panel">
          <div className="mb-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[15px] font-bold text-[var(--angel-text)] md:text-[16px]">
            <span className="whitespace-nowrap">레퍼런스 이미지</span>
            <span className="whitespace-nowrap text-[12px] font-normal text-[var(--angel-text-faint)] sm:text-[12.5px]">
              ({refImages.length}/{MAX_REFS}) · 업로드 또는 붙여넣기
            </span>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            {refImages.map((img) => (
              <div key={img.id} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.preview}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-16 rounded-lg border border-[var(--angel-border)] object-cover md:h-20 md:w-20"
                />
                <button
                  onClick={() => removeRef(img.id)}
                  aria-label="레퍼런스 이미지 삭제"
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-[#1a1a2e]/85 text-white text-[14px] leading-none shadow-md transition-opacity md:opacity-0 md:group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
            {refImages.length < MAX_REFS && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-[var(--angel-border)] bg-[var(--angel-surface-muted)] text-[var(--angel-text-faint)] hover:border-[var(--angel-blue)]/50 hover:text-[var(--angel-blue)] md:h-20 md:w-20"
                aria-label="레퍼런스 이미지 추가"
              >
                <ImagePlus size={18} />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(e) => {
                if (e.target.files) addFiles(Array.from(e.target.files));
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="hidden"
            />
          </div>
          {refError && (
            <p className="mt-1.5 text-[12px] text-red-500">{refError}</p>
          )}
        </div>

        {/* Model picker */}
        <div className="surface-panel">
          <label className="field-label md:text-[16px]">
            모델
          </label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {(["gpt-image-2", "nano-banana-pro"] as const).map((m) => {
              const active = model === m;
              const disabled = !supportsImageQuality(m, quality);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    if (!disabled) setModel(m);
                  }}
                  disabled={disabled}
                  title={disabled ? unsupportedQualityMessage(m, quality) : MODEL_LABEL[m]}
                  className={`min-w-0 rounded-lg border px-4 py-3 text-left transition-all ${
                    active
                      ? "border-[var(--angel-blue)] bg-[var(--angel-blue-pale)]"
                      : "border-[var(--angel-border)] bg-[var(--angel-surface-muted)] hover:border-[var(--angel-blue)]/35"
                  } ${disabled ? "cursor-not-allowed opacity-45 hover:border-[var(--angel-border)]" : ""}`}
                >
                  <div className={`text-[14.5px] font-semibold ${active ? "text-[var(--angel-blue)]" : "text-[var(--angel-text)]"}`}>
                    {MODEL_LABEL[m]}
                  </div>
                  <div className="mt-1 text-[12px] leading-5 text-[var(--angel-text-faint)] [word-break:keep-all]">
                    {disabled ? "4K는 Nano Banana Pro 전용" : MODEL_HINT[m]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Options card — quality (left) + count (right), cost row */}
        <div className="surface-panel">
          <fieldset className="mb-5">
            <legend className="sr-only">캔버스 비율</legend>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[12.5px] font-bold text-[var(--angel-text-soft)]">
                  캔버스 비율
                </div>
                <p className="mt-1 hidden text-[12px] leading-5 text-[var(--angel-text-faint)] sm:block">
                  결과를 어디에 쓸지 기준으로 골라요.
                </p>
              </div>
              <span className="shrink-0 rounded-md border border-[var(--angel-border)] bg-white px-2.5 py-1 font-en text-[11px] font-bold text-[var(--angel-blue)]">
                {aspectLabel(aspectRatio)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-[var(--angel-border)] bg-[var(--angel-surface-muted)] p-1.5">
              {ASPECT_OPTIONS.map(({ value, label, previewClass }) => {
                const active = aspectRatio === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAspectRatio(value)}
                    aria-pressed={active}
                    aria-label={`${label} 캔버스 비율`}
                    title={`${label} 캔버스 비율`}
                    className={`group flex min-h-[76px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-lg border px-1.5 py-2 text-center transition-[border-color,box-shadow,background-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--angel-blue)]/25 sm:min-h-[106px] sm:gap-2 sm:px-3 ${
                      active
                        ? "border-[var(--angel-blue)] bg-white text-[var(--angel-blue)] shadow-[0_8px_20px_rgba(53,111,165,0.12)]"
                        : "border-transparent bg-transparent text-[var(--angel-text-soft)] hover:border-[var(--angel-blue)]/35 hover:bg-white hover:text-[var(--angel-blue)] sm:hover:-translate-y-0.5"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-full shrink-0 items-center justify-center rounded-md sm:h-14 ${
                        active
                          ? "bg-[var(--angel-blue-pale)]"
                          : "bg-white/60"
                      }`}
                    >
                      <span
                        className={`${previewClass} rounded-[5px] border-2 transition-transform duration-200 group-hover:scale-[1.03] ${
                          active
                            ? "border-[var(--angel-blue)] bg-[var(--angel-blue)]/10 shadow-[inset_0_0_0_1px_rgba(53,111,165,0.08)]"
                            : "border-[var(--angel-text-faint)]/45 bg-[var(--angel-surface-muted)]"
                        }`}
                      />
                    </span>
                    <span className="flex min-h-[18px] w-full min-w-0 items-center justify-center gap-1.5">
                      <span className="min-w-0 truncate text-[12.5px] font-bold leading-tight sm:text-[13.5px]">
                        {label}
                      </span>
                      {active && (
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--angel-blue)]"
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-5 border-t border-[var(--angel-border)]/60 pt-5 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-start sm:gap-x-6">
            {/* Quality */}
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <label className="block text-[12.5px] font-bold text-[var(--angel-text-soft)]">
                  Quality
                </label>
                <QualityInfoTooltip />
                <span className="text-[11.5px] leading-4 text-[var(--angel-text-faint)]">
                  4K는 Nano Banana Pro 전용
                </span>
              </div>
              <div className="grid w-full grid-cols-3 gap-1 rounded-lg bg-[var(--angel-bg-soft)] p-1 sm:inline-flex sm:w-auto">
                {(["1K", "2K", "4K"] as const).map((q) => {
                  const active = quality === q;
                  const disabled = !supportsImageQuality(model, q);
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleQualitySelect(q)}
                      disabled={disabled}
                      title={disabled ? unsupportedQualityMessage(model, q) : QUALITY_LABEL[q]}
                      className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 transition-all sm:px-3 ${
                        active
                          ? "bg-[var(--angel-surface)] text-[var(--angel-blue)] shadow-[0_1px_0_rgba(53,111,165,0.08)]"
                          : "text-[var(--angel-text-soft)] hover:text-[var(--angel-blue)]"
                      } ${disabled ? "cursor-not-allowed opacity-45 hover:text-[var(--angel-text-soft)]" : ""}`}
                    >
                      <span className="text-[14px] font-semibold">{QUALITY_LABEL[q]}</span>
                      <span className="text-[11.5px] opacity-65">{q}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Count */}
            <div className="w-full sm:w-[200px]">
              <div className="mb-2 flex items-baseline justify-between">
                <label className="text-[12.5px] font-bold text-[var(--angel-text-soft)]">
                  Count
                </label>
                <span className="text-[17px] font-bold tabular-nums text-[var(--angel-blue)] leading-none">
                  {count}<span className="text-[12px] font-normal text-[var(--angel-text-faint)] ml-0.5">장</span>
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={4}
                step={1}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="compact-range"
              />
              <div className="flex justify-between text-[10px] text-[var(--angel-text-faint)] mt-1">
                <span>1</span><span>2</span><span>3</span><span>4</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--angel-border)]/60 flex items-center justify-between text-[14px]">
            <span className="text-[var(--angel-text-soft)] font-medium">예상 비용</span>
            <span className="inline-flex items-center gap-1.5">
              <Coins size={16} className="text-[var(--angel-blue)]" />
              <span className="font-bold tabular-nums text-[var(--angel-blue)] text-[18px]">{cost}</span>
              <span className="text-[13px] text-[var(--angel-text-faint)]">크레딧</span>
              {hasInsufficientCredits && (
                <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-500">잔액 부족</span>
              )}
            </span>
          </div>
        </div>

        {/* Hero CTA — primary navy, large */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={
            !canGenerate
          }
          className="primary-action w-full min-h-[56px] text-[16px] md:min-h-[64px] md:text-[18px]"
        >
          {isGenerating ? (
            <span className="inline-flex items-center gap-2.5">
              <Sparkles size={18} className="animate-pulse" />
              생성 중입니다…
            </span>
          ) : (
            <span className="inline-flex flex-nowrap items-center justify-center gap-2 md:gap-3 whitespace-nowrap">
              <Sparkles size={18} />
              이미지 생성하기
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2.5 py-0.5 text-[12px] font-medium text-white/85 md:px-3 md:py-1 md:text-[13px]">
                <Coins size={12} />
                <span className="tabular-nums">{cost}</span>
              </span>
            </span>
          )}
        </button>

        <GenerationProgress state={progress} />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-[14.5px] text-red-600">
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="pt-6">
            <h2 className="font-ko-display mb-4 text-[28px] text-[var(--angel-text)] md:text-[34px]">
              결과 <span className="text-[var(--angel-text-faint)] font-normal">({results.length}장)</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map((item, i) => (
                <div
                  key={item.id}
                  className="result-card p-2"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewResult(item)}
                    className="block w-full overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--angel-blue)]/45"
                    aria-label="결과 이미지 크게 보기"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full rounded-md transition-transform duration-200 hover:scale-[1.01]"
                    />
                  </button>
                  <div className="mt-2 flex justify-center">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium ${
                        item.saveStatus === "saved"
                          ? "bg-emerald-50 text-emerald-700"
                          : item.saveStatus === "failed"
                          ? "bg-rose-50 text-rose-600"
                          : "bg-sky-50 text-sky-700"
                      }`}
                      title={item.saveError ?? undefined}
                    >
                      {item.saveStatus === "saving" ? (
                        <Sparkles size={11} className="animate-pulse" />
                      ) : (
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          {item.saveStatus === "failed" ? (
                            <path d="M4 4l8 8M12 4l-8 8" />
                          ) : (
                            <polyline points="3 8 7 12 13 4" />
                          )}
                        </svg>
                      )}
                      {item.saveStatus === "saved"
                        ? "Mypage 저장됨"
                        : item.saveStatus === "failed"
                        ? "저장 실패"
                        : "Mypage 저장 중"}
                    </span>
                  </div>
	                  <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
	                    <button
	                      onClick={() => void sendToEditor(item.src)}
	                      className="secondary-action bg-[var(--angel-blue)] text-white hover:text-white"
                    >
                      <PenLine size={13} />
                      편집
	                    </button>
	                    <button
	                      onClick={() => downloadImage(item.src, i)}
	                      className="secondary-action"
                    >
                      <Download size={13} />
                      다운로드
	                    </button>
	                    <button
	                      onClick={() => handleShare(item)}
	                      disabled={item.isSharing || Boolean(item.sharedId)}
	                      className="secondary-action disabled:opacity-55"
	                    >
	                      <Share2 size={13} />
	                      {item.sharedId ? "공유됨" : item.isSharing ? "공유 중..." : "공유"}
	                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {previewResult && (
        <ResultImageModal
          src={previewResult.src}
          alt={prompt}
          title="생성 결과"
          onClose={() => setPreviewResult(null)}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useCallback, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveImage } from "@/lib/saved-images";
import { GenerationProgress, initialProgress, type ProgressState } from "@/components/studio/generation-progress";
import { ResultImageModal } from "@/components/studio/result-image-modal";
import { QualityInfoTooltip } from "@/components/studio/quality-info-tooltip";
import { StudioStepArrow, StudioStepDot } from "@/components/studio/studio-step-indicator";
import { postSSE } from "@/lib/sse-client";
import { createClient } from "@/lib/supabase/client";
import { buildImageTitle } from "@/lib/image-title";
import { clampMarkerCenter, clampMarkerRadius } from "@/lib/marker-geometry";
import { loadEditorTransfer } from "@/lib/editor-transfer";
import {
  normalizeImageQualityForModel,
  supportsImageQuality,
  unsupportedQualityMessage,
  type ImageModelChoice as EditModel,
  type ImageQuality as Quality,
} from "@/lib/image-models";
import {
  CircleDot,
  ClipboardPaste,
  Coins,
  Download,
  Eraser,
  ImagePlus,
  ListOrdered,
  MousePointerClick,
  Move,
  Plus,
  Redo2,
  Replace,
  RotateCcw,
  Share2,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  X,
} from "lucide-react";

type Op = "replace" | "add" | "remove";

interface Marker {
  id: string;
  op: Op;
  cx: number;
  cy: number;
  r: number;
  refIndex?: number;
  note?: string;
}

interface ImgData {
  base64: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  dataUrl: string;
}

interface EditResult {
  id: string;
  src: string;
  prompt: string;
  savedId: string | null;
  saveStatus: "saving" | "saved" | "failed";
  saveError: string | null;
  sharedId: string | null;
  isSharing: boolean;
}

const MAX_MARKERS = 3;
const MAX_REFS = 3;
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const SHARE_TITLE_MAX = 32;

const OP_COLOR: Record<Op, string> = {
  replace: "#3877ea",
  add: "#22c55e",
  remove: "#ef4444",
};
const OP_LABEL: Record<Op, string> = {
  replace: "교체",
  add: "추가",
  remove: "제거",
};
const OP_ORDER: Op[] = ["replace", "add", "remove"];
const OP_HELP: Record<Op, { action: string; detail: string }> = {
  replace: {
    action: "선택 영역을 다른 모습으로 바꿈",
    detail: "색, 재질, 물체를 바꿀 때",
  },
  add: {
    action: "빈 공간에 새 요소를 넣음",
    detail: "조명, 소품, 장식 추가",
  },
  remove: {
    action: "선택 영역을 자연스럽게 지움",
    detail: "불필요한 물체 제거",
  },
};
const QUALITY_LABEL: Record<Quality, string> = {
  "1K": "표준",
  "2K": "고화질",
  "4K": "초고화질",
};
const EDIT_MODEL_LABEL: Record<EditModel, string> = {
  "nano-banana-pro": "Nano Banana Pro",
  "gpt-image-2": "GPT Image 2",
};
const EDIT_MODEL_HINT: Record<EditModel, string> = {
  "gpt-image-2": "OpenAI · 빠른 기본 편집",
  "nano-banana-pro": "Google · 스타일 반영 강함, 더 오래 걸릴 수 있음",
};

function MarkerOpIcon({ op, size = 16 }: { op: Op; size?: number }) {
  if (op === "replace") return <Replace size={size} />;
  if (op === "add") return <Plus size={size} />;
  return <Eraser size={size} />;
}

async function fileToImg(file: File): Promise<ImgData> {
  if (file.size > MAX_FILE_SIZE) throw new Error("이미지 크기는 4MB 이하만 가능해요.");
  const mime = file.type;
  if (mime !== "image/png" && mime !== "image/jpeg" && mime !== "image/webp") {
    throw new Error("PNG, JPEG, WebP만 가능해요.");
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read fail"));
    r.readAsDataURL(file);
  });
  const base64 = dataUrl.split(",")[1] ?? "";
  return { base64, mimeType: mime, dataUrl };
}

function dataUrlToImg(dataUrl: string): ImgData {
  const [head, base64] = dataUrl.split(",");
  const m = /data:(image\/[a-z]+)/.exec(head ?? "");
  const mime = (m?.[1] as ImgData["mimeType"]) || "image/png";
  return { base64: base64 ?? "", mimeType: mime, dataUrl };
}

async function blobToImgData(blob: Blob): Promise<ImgData> {
  const mime = blob.type;
  if (mime !== "image/png" && mime !== "image/jpeg" && mime !== "image/webp") {
    throw new Error("PNG, JPEG, WebP만 가능해요.");
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("이미지를 읽지 못했어요."));
    reader.readAsDataURL(blob);
  });
  const base64 = dataUrl.split(",")[1] ?? "";
  return { base64, mimeType: mime, dataUrl };
}

async function loadImageUrlForEditor(url: string): Promise<ImgData> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("이미지를 불러오지 못했어요.");
  return await blobToImgData(await res.blob());
}

function getClipboardImageFiles(event: ClipboardEvent): File[] {
  const data = event.clipboardData;
  if (!data) return [];

  const directFiles = Array.from(data.files).filter((file) =>
    file.type.startsWith("image/")
  );
  if (directFiles.length > 0) return directFiles;

  return Array.from(data.items)
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file));
}

let markerIdSeq = 0;

function createClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function EditPage() {
  const router = useRouter();

  const [base, setBase] = useState<ImgData | null>(null);
  const [refs, setRefs] = useState<ImgData[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  // ── Undo/Redo 스택 (마커 변경 단위) ──
  const undoStack = useRef<Marker[][]>([]);
  const redoStack = useRef<Marker[][]>([]);
  const [, forceRender] = useState(0);
  const pushHistory = useCallback((snapshot: Marker[]) => {
    undoStack.current.push(snapshot);
    if (undoStack.current.length > 30) undoStack.current.shift();
    redoStack.current = [];
    forceRender((x) => x + 1);
  }, []);
  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;
  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    setMarkers((cur) => {
      redoStack.current.push(cur);
      const prev = undoStack.current.pop()!;
      forceRender((x) => x + 1);
      return prev;
    });
  }, []);
  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    setMarkers((cur) => {
      undoStack.current.push(cur);
      const next = redoStack.current.pop()!;
      forceRender((x) => x + 1);
      return next;
    });
  }, []);

  // 키보드 단축키 (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA"))
        return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const [quality, setQuality] = useState<Quality>("1K");
  const [count, setCount] = useState(1);
  const [model, setModel] = useState<EditModel>("nano-banana-pro");
  const [pendingOp, setPendingOp] = useState<Op | null>(null);
  const [placementPreview, setPlacementPreview] = useState<{ cx: number; cy: number } | null>(null);
  const [sourcePrompt, setSourcePrompt] = useState("");

  const [mood, setMood] = useState("");
  const [lighting, setLighting] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [moodIntensity, setMoodIntensity] = useState(60);
  const [lightingIntensity, setLightingIntensity] = useState(60);

  const hasGlobalAdjust = !!(mood.trim() || lighting.trim() || adjustNote.trim());

  const [isEditing, setIsEditing] = useState(false);
  const [progress, setProgress] = useState<ProgressState>(initialProgress);
  const [results, setResults] = useState<EditResult[]>([]);
  const [previewResult, setPreviewResult] = useState<EditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const savePromisesRef = useRef<Map<string, Promise<string | null>>>(new Map());

  const [authed, setAuthed] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [pricing, setPricing] = useState<Record<Quality, number> | null>(null);

  // Image natural dimensions (for accurate aspect-preserving SVG overlay)
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);

  const baseFileRef = useRef<HTMLInputElement>(null);
  const refFileRef = useRef<HTMLInputElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const pendingAutoBind = useRef<{ markerId: string; beforeCount: number } | null>(null);

  const syncImageDims = useCallback((img: HTMLImageElement | null = imageRef.current) => {
    if (!img || img.naturalWidth <= 0 || img.naturalHeight <= 0) return;
    setImgDims({ w: img.naturalWidth, h: img.naturalHeight });
  }, []);

  useEffect(() => {
    setImgDims(null);
    const frame = requestAnimationFrame(() => syncImageDims());
    return () => cancelAnimationFrame(frame);
  }, [base?.dataUrl, syncImageDims]);

  const getImageRect = useCallback(() => {
    return imageRef.current?.getBoundingClientRect() ?? canvasWrapRef.current?.getBoundingClientRect() ?? null;
  }, []);

  const getClampedImagePoint = useCallback(
    (clientX: number, clientY: number) => {
      const rect = getImageRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return null;
      return {
        cx: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
        cy: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
      };
    },
    [getImageRect]
  );

  const refreshBalance = useCallback(async () => {
    try {
      const r = await fetch("/api/credits/balance", { cache: "no-store" });
      const d = await r.json();
      setAuthed(Boolean(d.authed));
      setBalance(typeof d.balance === "number" ? d.balance : 0);
      if (d.pricing?.edit) setPricing(d.pricing.edit);
    } catch {}
  }, []);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  // /generate, /boards, /discover에서 "편집" 버튼으로 넘어온 경우 base 자동 세팅
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const transfer = await loadEditorTransfer();
        if (!transfer || cancelled) return;
        const nextBase = transfer.base
          ? dataUrlToImg(transfer.base)
          : transfer.baseUrl
            ? await loadImageUrlForEditor(transfer.baseUrl)
            : null;
        if (!nextBase || cancelled) return;
        setBase(nextBase);
        if (transfer.quality) setQuality(transfer.quality);
        if (transfer.model) setModel(transfer.model);
        if (transfer.sourcePrompt) setSourcePrompt(transfer.sourcePrompt);
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "편집 이미지를 불러오지 못했어요.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cost = pricing ? pricing[quality] * count : count * 2;
  const hasInsufficientCredits = authed && balance !== null && balance < cost;
  const isQualitySupported = supportsImageQuality(model, quality);

  useEffect(() => {
    if (!isQualitySupported) {
      setQuality(normalizeImageQualityForModel(model, quality));
    }
  }, [isQualitySupported, model, quality]);

  const handleQualitySelect = (nextQuality: Quality) => {
    if (!supportsImageQuality(model, nextQuality)) return;
    setQuality(nextQuality);
  };

  const buildEditSummary = useCallback(() => {
    const lines: string[] = [];
    if (markers.length > 0) {
      lines.push("마커 편집:");
      markers.forEach((m, i) => {
        const note = m.note?.trim();
        lines.push(`- ${i + 1}. ${OP_LABEL[m.op]}${note ? `: ${note}` : ""}`);
      });
    }
    if (mood.trim()) lines.push(`Mood: ${mood.trim()} ${moodIntensity}%`);
    if (lighting.trim()) lines.push(`Lighting: ${lighting.trim()} ${lightingIntensity}%`);
    if (adjustNote.trim()) lines.push(`Note: ${adjustNote.trim()}`);
    return lines.join("\n") || "(편집 결과)";
  }, [adjustNote, lighting, lightingIntensity, markers, mood, moodIntensity]);

  const buildEditResultPrompt = useCallback(() => {
    const editSummary = buildEditSummary();
    const original = sourcePrompt.trim();
    if (!original) return editSummary;
    return `원본 프롬프트:\n${original}\n\n편집 내용:\n${editSummary}`;
  }, [buildEditSummary, sourcePrompt]);

  // ── Marker manipulation ──

  // 툴바의 "+ 추가" 버튼: 즉시 마커를 추가하지 않고 placement 모드 진입.
  // 다음 캔버스 클릭 위치에 마커가 배치됨.
  const startPlacingMarker = (op: Op) => {
    if (markers.length >= MAX_MARKERS) {
      toast.error(`마커는 최대 ${MAX_MARKERS}개까지 가능해요.`);
      return;
    }
    if (!base) {
      toast.error("먼저 베이스 이미지를 선택해주세요.");
      return;
    }
    setPendingOp((cur) => {
      const next = cur === op ? null : op;
      if (!next) setPlacementPreview(null);
      return next;
    });
  };

  const placeMarkerAt = (cx: number, cy: number) => {
    if (!pendingOp) return;
    if (markers.length >= MAX_MARKERS) {
      setPendingOp(null);
      return;
    }
    pushHistory(markers);
    const id = `m${++markerIdSeq}`;
    setMarkers((prev) => [
      ...prev,
      { id, op: pendingOp, cx, cy, r: 0.15 },
    ]);
    setSelected(id);
    setPendingOp(null);
    setPlacementPreview(null);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pendingOp) return;
    const point = getClampedImagePoint(e.clientX, e.clientY);
    if (!point) return;
    placeMarkerAt(point.cx, point.cy);
  };

  const updatePlacementPreview = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pendingOp || dragRef.current) return;
    const point = getClampedImagePoint(e.clientX, e.clientY);
    if (!point) return;
    setPlacementPreview(point);
  };

  const updateMarker = useCallback((id: string, patch: Partial<Marker>) => {
    setMarkers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const removeMarker = (id: string) => {
    pushHistory(markers);
    setMarkers((prev) => prev.filter((m) => m.id !== id));
    if (selected === id) setSelected(null);
  };

  // ── Drag handlers (move + resize) ──
  const dragRef = useRef<{
    id: string;
    mode: "move" | "resize";
    startX: number;
    startY: number;
    startCx: number;
    startCy: number;
    startR: number;
    startPointerDistancePx: number;
  } | null>(null);

  const dragSnapshot = useRef<Marker[] | null>(null);
  const markersRef = useRef<Marker[]>(markers);
  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);
  const onPointerDown = (e: React.PointerEvent, id: string, mode: "move" | "resize") => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const rect = getImageRect();
    if (!rect) return;
    const m = markers.find((x) => x.id === id);
    if (!m) return;
    const centerX = m.cx * rect.width;
    const centerY = m.cy * rect.height;
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;
    setSelected(id);
    dragSnapshot.current = markers; // undo용 스냅샷
    dragRef.current = {
      id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startCx: m.cx,
      startCy: m.cy,
      startR: m.r,
      startPointerDistancePx: Math.hypot(pointerX - centerX, pointerY - centerY),
    };
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      const rect = getImageRect();
      if (!d || !rect) return;
      const dx = (e.clientX - d.startX) / rect.width;
      const dy = (e.clientY - d.startY) / rect.height;
      if (d.mode === "move") {
        const { cx, cy } = clampMarkerCenter(
          { cx: d.startCx + dx, cy: d.startCy + dy }
        );
        updateMarker(d.id, { cx, cy });
      } else {
        const minSide = Math.min(rect.width, rect.height);
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;
        const centerX = d.startCx * rect.width;
        const centerY = d.startCy * rect.height;
        const distPx = Math.hypot(cursorX - centerX, cursorY - centerY);
        const deltaPx = distPx - d.startPointerDistancePx;
        const r = clampMarkerRadius(d.startR + deltaPx / minSide);
        updateMarker(d.id, { r });
      }
    };
    const onUp = () => {
      if (dragRef.current && dragSnapshot.current) {
        const before = dragSnapshot.current;
        const after = markersRef.current;
        const changed =
          before.length !== after.length ||
          before.some((m, i) => {
            const a = after[i];
            return (
              m.id !== a?.id ||
              Math.abs(m.cx - a.cx) > 1e-4 ||
              Math.abs(m.cy - a.cy) > 1e-4 ||
              Math.abs(m.r - a.r) > 1e-4
            );
          });
        if (changed) pushHistory(before);
      }
      dragRef.current = null;
      dragSnapshot.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [getImageRect, pushHistory, updateMarker]);

  // ── File handlers ──

  const loadBaseFile = useCallback(async (file: File, source: "upload" | "paste") => {
    try {
      const img = await fileToImg(file);
      setBase(img);
      setMarkers([]);
      setResults([]);
      setSourcePrompt("");
      setSelected(null);
      setPendingOp(null);
      setPlacementPreview(null);
      undoStack.current = [];
      redoStack.current = [];
      if (source === "paste") {
        toast.success("붙여넣은 이미지를 편집할 이미지로 불러왔어요.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류");
    }
  }, []);

  const onPickBase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      await loadBaseFile(f, "upload");
    }
    if (baseFileRef.current) baseFileRef.current.value = "";
  };

  const addReferenceFiles = useCallback(
    async (files: File[], markerId: string | null, source: "upload" | "paste") => {
      if (refs.length >= MAX_REFS) {
        toast.error(`레퍼런스는 최대 ${MAX_REFS}장이에요.`);
        return false;
      }

      const available = MAX_REFS - refs.length;
      const added: ImgData[] = [];

      for (const f of files.slice(0, available)) {
        try {
          added.push(await fileToImg(f));
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "오류");
        }
      }

      if (added.length === 0) return false;

      const firstAddedIdx = refs.length;
      setRefs((prev) => [...prev, ...added]);
      if (markerId) {
        pushHistory(markers);
        updateMarker(markerId, { refIndex: firstAddedIdx });
      }

      if (source === "paste") {
        toast.success(
          markerId
            ? "붙여넣은 이미지를 레퍼런스로 연결했어요."
            : "붙여넣은 이미지를 레퍼런스로 추가했어요."
        );
      }
      if (files.length > available) {
        toast.error(`레퍼런스는 최대 ${MAX_REFS}장까지만 추가돼요.`);
      }
      return true;
    },
    [markers, pushHistory, refs.length, updateMarker]
  );

  const onPickRefs = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const auto = pendingAutoBind.current;
    pendingAutoBind.current = null;

    if (auto) {
      await addReferenceFiles(files, auto.markerId, "upload");
      if (refFileRef.current) refFileRef.current.value = "";
      return;
    }

    const available = MAX_REFS - refs.length;
    for (const f of files.slice(0, available)) {
      try {
        const img = await fileToImg(f);
        setRefs((prev) => [...prev, img]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "오류");
      }
    }
    if (refFileRef.current) refFileRef.current.value = "";
  };

  useEffect(() => {
    const onPaste = async (event: ClipboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }

      const files = getClipboardImageFiles(event);
      if (files.length === 0) return;

      if (!base) {
        event.preventDefault();
        await loadBaseFile(files[0], "paste");
        return;
      }

      const marker = markers.find((m) => m.id === selected);
      const canUseSelected = marker && (marker.op === "replace" || marker.op === "add");
      if (canUseSelected) {
        event.preventDefault();
        await addReferenceFiles(files, marker.id, "paste");
        return;
      }

      const emptyRefMarkers = markers.filter(
        (m) => (m.op === "replace" || m.op === "add") && typeof m.refIndex !== "number"
      );
      event.preventDefault();
      if (emptyRefMarkers.length === 1) {
        setSelected(emptyRefMarkers[0].id);
        await addReferenceFiles(files, emptyRefMarkers[0].id, "paste");
        return;
      }

      await addReferenceFiles(files, null, "paste");
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addReferenceFiles, base, loadBaseFile, markers, selected]);

  const removeRef = (idx: number) => {
    setRefs((prev) => prev.filter((_, i) => i !== idx));
    setMarkers((prev) =>
      prev.map((m) => {
        if (m.refIndex === idx) return { ...m, refIndex: undefined };
        if (m.refIndex !== undefined && m.refIndex > idx) {
          return { ...m, refIndex: m.refIndex - 1 };
        }
        return m;
      })
    );
  };

  const openRefUpload = (markerId: string) => {
    if (refs.length >= MAX_REFS) {
      toast.error(`레퍼런스는 최대 ${MAX_REFS}장이에요.`);
      return;
    }
    pendingAutoBind.current = {
      markerId,
      beforeCount: refs.length,
    };
    refFileRef.current?.click();
  };

  // ── Submit ──

  const hasEditRequest =
    !!base &&
    (markers.length > 0 || hasGlobalAdjust);
  const canSubmit = hasEditRequest && !isEditing && !hasInsufficientCredits && isQualitySupported;

  const handleSubmit = async (event?: MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!base || !hasEditRequest || isEditing || hasInsufficientCredits) return;
    if (!authed) {
      router.push("/auth/login");
      return;
    }
    if (!supportsImageQuality(model, quality)) {
      setQuality(normalizeImageQualityForModel(model, quality));
      return;
    }
    setIsEditing(true);
    setError(null);
    setResults([]);
    savePromisesRef.current.clear();
    setProgress({
      active: true,
      total: count,
      completed: 0,
      failed: 0,
      startedAt: Date.now(),
      message: "요청 보내는 중",
    });

    let streamErr: string | null = null;
    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const editPromptText = buildEditResultPrompt();

    await postSSE(
      "/api/edit",
      {
        base: { base64: base.base64, mimeType: base.mimeType },
        references: refs.map((r) => ({ base64: r.base64, mimeType: r.mimeType })),
        markers: markers.map((m) => ({
          id: m.id,
          op: m.op,
          circle: { cx: m.cx, cy: m.cy, r: m.r },
          refIndex: m.refIndex,
          note: m.note,
        })),
        globalAdjust: hasGlobalAdjust
          ? {
              mood: mood.trim() ? `${mood.trim()} (강도 ${moodIntensity}%)` : undefined,
              lighting: lighting.trim()
                ? `${lighting.trim()} (강도 ${lightingIntensity}%)`
                : undefined,
              note: adjustNote.trim() || undefined,
            }
          : undefined,
        quality,
        count,
        model,
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
            setResults((prev) => [
              ...prev,
              {
                id: resultId,
                src: img,
                prompt: editPromptText,
                savedId: null,
                saveStatus: "saving",
                saveError: null,
                sharedId: null,
                isSharing: false,
              },
            ]);
            setProgress((p) => ({ ...p, completed: p.completed + 1 }));
            const savePromise = saveImage({
              prompt: editPromptText,
              image: img,
              source: "edit",
              meta: {
                model,
                quality,
                count,
                markers: markers.length,
                hasGlobalAdjust,
                originalPrompt: sourcePrompt.trim() || null,
                editSummary: buildEditSummary(),
              },
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
            const succ = typeof data.count === "number" ? data.count : 0;
            if (succ > 0) toast.success(`${succ}장 편집 완료 — 마이페이지에 자동 저장됨`);
            refreshBalance();
          } else if (msg.event === "error") {
            streamErr = typeof data.message === "string" ? data.message : "편집 실패";
          }
        },
        onError: (e) => {
          streamErr = e.message;
        },
        onClose: () => {
          setProgress((p) => ({ ...p, active: false }));
          setIsEditing(false);
          if (streamErr) setError(streamErr);
        },
      }
    );
  };

  const setResultAsBase = (src: string) => {
    setBase(dataUrlToImg(src));
    setMarkers([]);
    setResults([]);
    setSelected(null);
    setSourcePrompt(buildEditResultPrompt());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const downloadResult = (src: string, idx: number) => {
    const link = document.createElement("a");
    link.href = src;
    link.download = `myangel-edit-${idx + 1}.png`;
    link.click();
  };

  const handleShareResult = async (item: EditResult) => {
    if (item.isSharing) return;
    if (item.sharedId) {
      toast.info("이미 Discover에 공유된 이미지예요.");
      return;
    }

    const toastId = `edit-share-${item.id}`;
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

      const defaultTitle = buildImageTitle(item.prompt, "편집 결과", SHARE_TITLE_MAX);
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
          tags: [],
          prompt: item.prompt,
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

  const selectedMarker = markers.find((m) => m.id === selected) ?? null;
  const selectedMarkerIndex = selectedMarker
    ? markers.findIndex((m) => m.id === selectedMarker.id)
    : -1;
  const canvasStatus = pendingOp
    ? `${OP_LABEL[pendingOp]} 마커를 놓을 위치를 이미지에서 클릭`
    : selectedMarker
      ? `마커 ${selectedMarkerIndex + 1} 선택됨`
      : markers.length > 0
        ? "오른쪽 목록에서 마커를 선택"
        : "마커 방식을 고른 뒤 이미지 클릭";

  return (
    <div className="studio-shell">
      {/* ─── Top utility bar: tabs + balance (mirrors /generate) ─── */}
      <div className="mb-8 flex items-center justify-between gap-3">
        <div className="app-tabs">
          <Link
            href="/generate"
            prefetch={false}
            className="app-tab"
          >
            생성
          </Link>
          <Link
            href="/edit"
            prefetch={false}
            className="app-tab app-tab-active"
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

      {/* ─── Hero header (mirrors /generate) ─── */}
      <div className="page-header">
        <div>
          <p className="page-kicker">Marker Editor</p>
          <h1 lang="en" className="page-title page-title-en">
            Ed<span className="shimmer-text">it</span>
          </h1>
          <p className="page-lead">
            베이스 이미지 위에 마커로 위치와 크기를 잡고, 필요한 부분을 교체·추가·제거합니다.
          </p>
        </div>

        <div className="flex w-fit items-center gap-2.5 text-[12px] font-medium text-[var(--angel-text-soft)] md:justify-self-end md:gap-3 md:text-[13px]">
          <StudioStepDot n="1" label="업로드" active={!base} />
          <StudioStepArrow />
          <StudioStepDot n="2" label="마커" active={Boolean(base) && !isEditing && results.length === 0} />
          <StudioStepArrow />
          <StudioStepDot n="3" label="편집" active={isEditing || results.length > 0} />
        </div>
      </div>

      {/* Base picker */}
      {!base ? (
        <div className="surface-panel border-dashed p-8 text-center" tabIndex={0}>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--angel-border)] bg-[var(--angel-surface-muted)] text-[var(--angel-blue)]">
            <Upload size={22} />
          </div>
          <p className="text-[15px] font-bold text-[var(--angel-text)]">
            편집할 이미지를 넣어주세요
          </p>
          <p className="mt-2 text-[12px] leading-5 text-[var(--angel-text-faint)]">
            PNG, JPEG, WebP · 4MB 이하
          </p>
          <div className="mt-5 flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => baseFileRef.current?.click()}
              className="primary-action min-h-11 px-5"
            >
              <Upload size={16} />
              이미지 선택
            </button>
            <div className="secondary-action min-h-11 cursor-default bg-[var(--angel-surface-muted)] px-5">
              <ClipboardPaste size={16} />
              붙여넣기
            </div>
          </div>
          <input
            ref={baseFileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onPickBase}
            className="hidden"
          />
        </div>
      ) : (
        <>
          <div className="edit-workspace">
            <section className="edit-canvas-card">
              <div className="edit-canvas-top">
                <div className="edit-step-title">
                  <span className="edit-step-number">2</span>
                  <div>
                    <h2>이미지에서 위치 잡기</h2>
                    <p>{canvasStatus}</p>
                  </div>
                </div>
                <div className="edit-canvas-actions">
                  <button
                    type="button"
                    onClick={undo}
                    disabled={!canUndo}
                    title="실행 취소"
                    aria-label="실행 취소"
                    className="edit-icon-button"
                  >
                    <Undo2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={redo}
                    disabled={!canRedo}
                    title="다시 실행"
                    aria-label="다시 실행"
                    className="edit-icon-button"
                  >
                    <Redo2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => baseFileRef.current?.click()}
                    className="secondary-action min-h-9 px-3 text-[12px]"
                  >
                    <Upload size={13} />
                    베이스 변경
                  </button>
                </div>
              </div>

              <div className="edit-canvas-stage">
                <div
                  className={`relative mx-auto ${pendingOp ? "edit-canvas-placing" : ""}`}
                  ref={canvasWrapRef}
                  onClick={onCanvasClick}
                  onPointerMove={updatePlacementPreview}
                  onPointerLeave={() => setPlacementPreview(null)}
                  style={{
                    maxWidth: imgDims ? `${imgDims.w}px` : undefined,
                    cursor: pendingOp ? "crosshair" : undefined,
                    touchAction: dragRef.current ? "none" : undefined,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imageRef}
                    src={base.dataUrl}
                    alt=""
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="box-border block w-full rounded-lg border border-[var(--angel-border)] bg-[var(--angel-surface)]"
                    draggable={false}
                    onLoad={(e) => {
                      syncImageDims(e.currentTarget);
                    }}
                  />
                  {(() => {
                    const W = imgDims?.w ?? 1000;
                    const H = imgDims?.h ?? 1000;
                    const minSide = Math.min(W, H);
                    const stroke = minSide * 0.004;
                    const handleR = Math.max(minSide * 0.016, 11);
                    const closeR = Math.max(minSide * 0.018, 12);
                    const fontPx = Math.max(minSide * 0.02, 10);
                    const badgeR = Math.max(fontPx * 0.95, 13);
                    const labelGap = minSide * 0.012;
                    const clampSvg = (value: number, min: number, max: number) =>
                      Math.min(max, Math.max(min, value));
                    return (
                      <svg
                        className="pointer-events-none absolute inset-0 h-full w-full"
                        viewBox={`0 0 ${W} ${H}`}
                        preserveAspectRatio="xMidYMid meet"
                      >
                        {pendingOp && placementPreview && (
                          <g opacity={0.88}>
                            <circle
                              cx={placementPreview.cx * W}
                              cy={placementPreview.cy * H}
                              r={0.15 * minSide}
                              fill={OP_COLOR[pendingOp]}
                              fillOpacity={0.12}
                              stroke={OP_COLOR[pendingOp]}
                              strokeWidth={stroke}
                              strokeDasharray={`${stroke * 2.8} ${stroke * 2.4}`}
                            />
                            <text
                              x={placementPreview.cx * W}
                              y={clampSvg(placementPreview.cy * H - 0.15 * minSide - labelGap, fontPx + 2, H - 4)}
                              fontSize={fontPx}
                              fill={OP_COLOR[pendingOp]}
                              fontWeight="800"
                              textAnchor="middle"
                              style={{ userSelect: "none" }}
                            >
                              클릭해서 {OP_LABEL[pendingOp]}
                            </text>
                          </g>
                        )}
                        {markers.map((m, i) => {
                          const color = OP_COLOR[m.op];
                          const isSel = m.id === selected;
                          const cx = m.cx * W;
                          const cy = m.cy * H;
                          const r = m.r * minSide;
                          const handleX = clampSvg(cx + r * 0.7071, handleR, W - handleR);
                          const handleY = clampSvg(cy + r * 0.7071, handleR, H - handleR);
                          const closeX = clampSvg(cx + r * 0.7071, closeR, W - closeR);
                          const closeY = clampSvg(cy - r * 0.7071, closeR, H - closeR);
                          const labelY = clampSvg(cy - r - labelGap, fontPx + 2, H - 4);
                          return (
                            <g key={m.id}>
                              <circle
                                cx={cx}
                                cy={cy}
                                r={r}
                                fill={color}
                                fillOpacity={isSel ? 0.2 : 0.12}
                                stroke={color}
                                strokeWidth={isSel ? stroke * 1.8 : stroke}
                                style={{ pointerEvents: "auto", cursor: "move", touchAction: "none" }}
                                onPointerDown={(e) => onPointerDown(e, m.id, "move")}
                              />
                              <circle
                                cx={cx}
                                cy={cy}
                                r={badgeR}
                                fill={color}
                              />
                              <text
                                x={cx}
                                y={cy + fontPx * 0.34}
                                fontSize={fontPx * 0.95}
                                fill="white"
                                fontWeight="900"
                                textAnchor="middle"
                                style={{ userSelect: "none" }}
                              >
                                {i + 1}
                              </text>
                              <text
                                x={cx}
                                y={labelY}
                                fontSize={fontPx}
                                fill={color}
                                fontWeight="800"
                                textAnchor="middle"
                                style={{ userSelect: "none" }}
                              >
                                {OP_LABEL[m.op]}
                              </text>
                              <circle
                                cx={handleX}
                                cy={handleY}
                                r={handleR}
                                fill="white"
                                stroke={color}
                                strokeWidth={stroke}
                                style={{ pointerEvents: "auto", cursor: "nwse-resize", touchAction: "none" }}
                                onPointerDown={(e) => onPointerDown(e, m.id, "resize")}
                              />
                              {isSel && (
                                <g
                                  style={{ pointerEvents: "auto", cursor: "pointer" }}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={(e) => { e.stopPropagation(); removeMarker(m.id); }}
                                >
                                  <circle
                                    cx={closeX}
                                    cy={closeY}
                                    r={closeR}
                                    fill="#ef4444"
                                    stroke="white"
                                    strokeWidth={stroke}
                                  />
                                  <path
                                    d={`M ${closeX - closeR * 0.4} ${closeY - closeR * 0.4} L ${closeX + closeR * 0.4} ${closeY + closeR * 0.4} M ${closeX + closeR * 0.4} ${closeY - closeR * 0.4} L ${closeX - closeR * 0.4} ${closeY + closeR * 0.4}`}
                                    stroke="white"
                                    strokeWidth={stroke}
                                    strokeLinecap="round"
                                  />
                                </g>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>
              </div>

              {imgDims && Math.min(imgDims.w, imgDims.h) < 512 && (
                <p className="mt-2 text-center text-[11.5px] text-amber-600">
                  ⚠ 원본 해상도가 낮아요 ({imgDims.w}×{imgDims.h}). 편집 결과 품질이 제한될 수 있어요.
                </p>
              )}
            </section>

            <aside className="edit-marker-board">
              <div className="edit-marker-board-head">
                <div className="edit-step-title">
                  <span className="edit-step-number">1</span>
                  <div>
                    <h2>마커 작업</h2>
                    <p>{pendingOp ? `${OP_LABEL[pendingOp]} 위치 대기 중` : "방식 선택 → 이미지 클릭"}</p>
                  </div>
                </div>
                <span className="edit-marker-count">{markers.length}/{MAX_MARKERS}</span>
              </div>

              <div className="marker-op-grid">
                {OP_ORDER.map((op) => {
                  const active = pendingOp === op;
                  return (
                    <button
                      key={op}
                      type="button"
                      onClick={() => startPlacingMarker(op)}
                      disabled={markers.length >= MAX_MARKERS && !active}
                      aria-pressed={active}
                      className={`marker-op-card ${active ? "marker-op-card-active" : ""}`}
                      style={{
                        borderColor: active ? OP_COLOR[op] : `${OP_COLOR[op]}44`,
                        backgroundColor: active ? `${OP_COLOR[op]}14` : undefined,
                      }}
                    >
                      <span
                        className="marker-op-icon"
                        style={{ backgroundColor: OP_COLOR[op], color: "white" }}
                      >
                        <MarkerOpIcon op={op} size={16} />
                      </span>
                      <span className="min-w-0 flex-1 text-left">
                        <span className="marker-op-title">{OP_LABEL[op]}</span>
                        <span className="marker-op-copy">{OP_HELP[op].detail}</span>
                      </span>
                      {active ? <X size={15} /> : <MousePointerClick size={15} />}
                    </button>
                  );
                })}
              </div>

              <div className={`marker-live-hint ${pendingOp ? "marker-live-hint-active" : ""}`}>
                <MousePointerClick size={15} />
                <span>
                  {pendingOp
                    ? `이미지에서 ${OP_LABEL[pendingOp]}할 지점을 클릭하세요.`
                    : markers.length >= MAX_MARKERS
                      ? "마커 3개를 모두 사용했어요."
                      : "마커 방식을 누르면 배치 모드가 켜져요."}
                </span>
              </div>

              <div className="marker-list-head">
                <span>
                  <ListOrdered size={14} />
                  마커 목록
                </span>
                {selectedMarker && (
                  <span style={{ color: OP_COLOR[selectedMarker.op] }}>
                    {selectedMarkerIndex + 1}번 선택
                  </span>
                )}
              </div>

              <div className="marker-list">
                {markers.length === 0 ? (
                  <div className="marker-empty">
                    <CircleDot size={18} />
                    <b>아직 마커가 없어요</b>
                    <span>위 버튼을 누른 뒤 이미지에서 위치를 찍으세요.</span>
                  </div>
                ) : (
                  markers.map((m, i) => {
                    const isSel = m.id === selected;
                    const hasRef = typeof m.refIndex === "number";
                    const refLabel =
                      m.op === "remove"
                        ? "레퍼런스 없음"
                        : hasRef
                          ? `ref ${m.refIndex! + 1} 연결`
                          : "레퍼런스 선택 가능";
                    return (
                      <div
                        key={m.id}
                        className={`marker-list-item ${isSel ? "marker-list-item-active" : ""}`}
                        style={{ borderColor: isSel ? OP_COLOR[m.op] : undefined }}
                      >
                        <button
                          type="button"
                          onClick={() => setSelected(m.id)}
                          className="marker-list-main"
                        >
                          <span
                            className="marker-list-number"
                            style={{ backgroundColor: OP_COLOR[m.op] }}
                          >
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="marker-list-title">
                              {OP_LABEL[m.op]} 마커
                            </span>
                            <span className="marker-list-meta">
                              {refLabel}{m.note?.trim() ? " · 프롬프트 있음" : ""}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMarker(m.id);
                          }}
                          className="marker-list-delete"
                          aria-label={`마커 ${i + 1} 삭제`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <input
                ref={baseFileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onPickBase}
                className="hidden"
              />
              <input
                ref={refFileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={onPickRefs}
                className="hidden"
              />

              {selectedMarker ? (
                <div className="marker-detail-panel">
                  <div className="marker-detail-head">
                    <div className="min-w-0">
                      <span
                        className="marker-detail-kicker"
                        style={{ color: OP_COLOR[selectedMarker.op] }}
                      >
                        마커 {selectedMarkerIndex + 1}
                      </span>
                      <h3>{OP_LABEL[selectedMarker.op]} 설정</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMarker(selectedMarker.id)}
                      className="marker-danger-button"
                    >
                      <Trash2 size={13} />
                      삭제
                    </button>
                  </div>

                  <div className="marker-mode-switch" role="group" aria-label="마커 동작 변경">
                    {OP_ORDER.map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => {
                          pushHistory(markers);
                          updateMarker(selectedMarker.id, { op });
                        }}
                        className={selectedMarker.op === op ? "is-active" : ""}
                        style={{
                          backgroundColor: selectedMarker.op === op ? OP_COLOR[op] : undefined,
                          color: selectedMarker.op === op ? "white" : OP_COLOR[op],
                        }}
                      >
                        <MarkerOpIcon op={op} size={13} />
                        {OP_LABEL[op]}
                      </button>
                    ))}
                  </div>

                  {(selectedMarker.op === "replace" || selectedMarker.op === "add") && (() => {
                    const opColor = OP_COLOR[selectedMarker.op];
                    const boundRefIndex =
                      typeof selectedMarker.refIndex === "number" ? selectedMarker.refIndex : null;
                    const canAddMore = refs.length < MAX_REFS;

                    return (
                      <div
                        className="marker-ref-panel"
                        style={{ borderColor: `${opColor}55` }}
                      >
                        <div className="marker-ref-head">
                          <span>
                            <ImagePlus size={14} />
                            레퍼런스
                          </span>
                          {boundRefIndex !== null && (
                            <button
                              type="button"
                              onClick={() => {
                                pushHistory(markers);
                                updateMarker(selectedMarker.id, { refIndex: undefined });
                              }}
                            >
                              연결 해제
                            </button>
                          )}
                        </div>
                        <div className="marker-ref-grid">
                          {canAddMore && (
                            <button
                              type="button"
                              onClick={() => openRefUpload(selectedMarker.id)}
                              className="marker-ref-upload"
                              style={{ borderColor: opColor, color: opColor }}
                            >
                              <Upload size={17} />
                              업로드
                            </button>
                          )}

                          {refs.map((ref, i) => {
                            const isBound = boundRefIndex === i;
                            return (
                              <div key={i} className="relative group">
                                <button
                                  type="button"
                                  onClick={() => {
                                    pushHistory(markers);
                                    updateMarker(selectedMarker.id, { refIndex: i });
                                  }}
                                  className={`marker-ref-thumb ${isBound ? "marker-ref-thumb-active" : ""}`}
                                  style={{ borderColor: isBound ? opColor : undefined }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={ref.dataUrl} alt="" loading="lazy" decoding="async" />
                                  <span>ref {i + 1}</span>
                                  {isBound && (
                                    <b style={{ backgroundColor: opColor }}>연결됨</b>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeRef(i)}
                                  className="marker-ref-delete"
                                  title="레퍼런스 삭제"
                                  aria-label="레퍼런스 삭제"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="marker-note-field">
                    <label>마커 프롬프트</label>
                    <textarea
                      value={selectedMarker.note ?? ""}
                      onChange={(e) =>
                        updateMarker(selectedMarker.id, { note: e.target.value })
                      }
                      placeholder={
                        selectedMarker.op === "remove"
                          ? "예: 지운 뒤 배경 패턴을 자연스럽게 이어주세요"
                          : selectedMarker.op === "add"
                            ? "예: 작은 유리 화병을 추가해주세요"
                            : "예: 같은 위치를 파란 패브릭 소재로 바꿔주세요"
                      }
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="marker-detail-empty">
                  <Move size={17} />
                  <b>마커를 선택하세요</b>
                  <span>캔버스의 번호나 목록을 누르면 설정이 열려요.</span>
                </div>
              )}
            </aside>
          </div>

          {/* Global mood / lighting adjustment */}
          <div className="surface-panel mt-4">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h3 className="text-[16px] font-semibold text-[var(--angel-text)]">전체 분위기·조명 조정</h3>
              <span className="text-[12px] text-[var(--angel-text-faint)]">선택 — 마커 없이도 적용 가능</span>
            </div>

            {/* Mood */}
            <div className="mb-4">
              <label className="mb-2 block text-[13.5px] font-bold text-[var(--angel-text-soft)]">
                Mood
              </label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {["따뜻함", "차가움", "드라마틱", "차분함", "부드러움", "빈티지", "시네마틱", "미니멀"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setMood((cur) => (cur === p ? "" : p))}
                    className={`rounded-md border px-3 py-1.5 text-[13px] font-bold transition-colors ${
                      mood === p
                        ? "border-[var(--angel-blue)] bg-[var(--angel-blue-pale)] text-[var(--angel-blue)]"
                        : "border-[var(--angel-border)] bg-[var(--angel-surface-muted)] text-[var(--angel-text-soft)] hover:text-[var(--angel-blue)]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="또는 직접 입력 — 예: 우울하고 외로운 느낌"
                className="w-full rounded-lg border border-[var(--angel-border)] bg-[var(--angel-surface)] px-3 py-2 text-[14px] text-[var(--angel-text)]"
              />
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[12px] text-[var(--angel-text-faint)]">
                  <span>강도</span>
                  <span className="font-bold tabular-nums text-[var(--angel-blue)]">{moodIntensity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={moodIntensity}
                  onChange={(e) => setMoodIntensity(Number(e.target.value))}
                  className="compact-range"
                />
              </div>
            </div>

            {/* Lighting */}
            <div className="mb-4">
              <label className="mb-2 block text-[13.5px] font-bold text-[var(--angel-text-soft)]">
                Lighting
              </label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {["황금시간", "푸른시간", "한낮 직광", "부드러운 그늘", "역광", "야간 인공조명", "달빛", "스튜디오 조명"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLighting((cur) => (cur === p ? "" : p))}
                    className={`rounded-md border px-3 py-1.5 text-[13px] font-bold transition-colors ${
                      lighting === p
                        ? "border-[var(--angel-blue)] bg-[var(--angel-blue-pale)] text-[var(--angel-blue)]"
                        : "border-[var(--angel-border)] bg-[var(--angel-surface-muted)] text-[var(--angel-text-soft)] hover:text-[var(--angel-blue)]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={lighting}
                onChange={(e) => setLighting(e.target.value)}
                placeholder="또는 직접 입력 — 예: 창문에서 들어오는 부드러운 햇빛"
                className="w-full rounded-lg border border-[var(--angel-border)] bg-[var(--angel-surface)] px-3 py-2 text-[14px] text-[var(--angel-text)]"
              />
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[12px] text-[var(--angel-text-faint)]">
                  <span>강도</span>
                  <span className="font-bold tabular-nums text-[var(--angel-blue)]">{lightingIntensity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={lightingIntensity}
                  onChange={(e) => setLightingIntensity(Number(e.target.value))}
                  className="compact-range"
                />
              </div>
            </div>

            {/* Free note */}
            <div>
              <label className="mb-2 block text-[13.5px] font-bold text-[var(--angel-text-soft)]">
                Note
              </label>
              <input
                type="text"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="기타 전체 톤·색감 조정 (선택)"
                className="w-full rounded-lg border border-[var(--angel-border)] bg-[var(--angel-surface)] px-3 py-2 text-[14px] text-[var(--angel-text)]"
              />
            </div>
          </div>

          {/* Options card */}
          <div className="surface-panel mt-4">
            <div className="mb-4">
              <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
                <label className="field-label mb-0 md:text-[16px]">
                  모델
                </label>
              </div>
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
                      title={disabled ? unsupportedQualityMessage(m, quality) : EDIT_MODEL_LABEL[m]}
                      className={`min-w-0 rounded-lg border px-4 py-3 text-left transition-all ${
                        active
                          ? "border-[var(--angel-blue)] bg-[var(--angel-blue-pale)]"
                          : "border-[var(--angel-border)] bg-[var(--angel-surface-muted)] hover:border-[var(--angel-blue)]/35"
                      } ${disabled ? "cursor-not-allowed opacity-45 hover:border-[var(--angel-border)]" : ""}`}
                    >
                      <div className={`text-[14.5px] font-semibold ${active ? "text-[var(--angel-blue)]" : "text-[var(--angel-text)]"}`}>
                        {EDIT_MODEL_LABEL[m]}
                      </div>
                      <div className="mt-1 text-[12px] leading-5 text-[var(--angel-text-faint)] [word-break:keep-all]">
                        {disabled ? "4K는 Nano Banana Pro 전용" : EDIT_MODEL_HINT[m]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-y-5 gap-x-6 border-t border-[var(--angel-border)]/60 pt-5">
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
                <div className="inline-flex gap-1 rounded-lg bg-[var(--angel-bg-soft)] p-1">
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
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
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

              <div className="w-full max-w-[220px] sm:w-[200px]">
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

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="primary-action mt-3 w-full min-h-[56px] text-[16px] disabled:cursor-not-allowed disabled:opacity-40 md:min-h-[64px] md:text-[18px]"
          >
            {isEditing ? (
              <span className="inline-flex items-center gap-2.5">
                <Sparkles size={18} className="animate-pulse" />
                편집 중...
              </span>
            ) : markers.length === 0 && !hasGlobalAdjust ? (
              "마커 또는 분위기·조명 조정을 추가해주세요"
            ) : (
              <span className="inline-flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap md:gap-3">
                <Sparkles size={18} />
                편집 실행하기
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2.5 py-0.5 text-[12px] font-medium text-white/85 md:px-3 md:py-1 md:text-[13px]">
                  <Coins size={12} />
                  <span className="tabular-nums">{cost}</span>
                </span>
              </span>
            )}
          </button>

          <div className="mt-3">
            <GenerationProgress state={progress} />
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-[14px] text-red-600">
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
                  <div key={item.id} className="result-card p-2">
                    <button
                      type="button"
                      onClick={() => setPreviewResult(item)}
                      className="block w-full overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--angel-blue)]/45"
                      aria-label="편집 결과 이미지 크게 보기"
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
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] ${
                          item.saveStatus === "saved"
                            ? "bg-emerald-50 text-emerald-700"
                            : item.saveStatus === "failed"
                            ? "bg-rose-50 text-rose-600"
                            : "bg-sky-50 text-sky-700"
                        }`}
                        title={item.saveError ?? undefined}
                      >
                        {item.saveStatus === "saving" ? (
                          <Sparkles size={10} className="animate-pulse" />
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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
                    <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
                      <button
                        onClick={() => setResultAsBase(item.src)}
                        className="secondary-action bg-[var(--angel-blue)] text-white hover:text-white"
                      >
                        <RotateCcw size={13} />
                        이걸로 다시 편집
                      </button>
                      <button
                        onClick={() => downloadResult(item.src, i)}
                        className="secondary-action"
                      >
                        <Download size={13} />
                        다운로드
                      </button>
                      <button
                        onClick={() => handleShareResult(item)}
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
        </>
      )}

      {/* 모바일 sticky 하단 액션 바 — base 있을 때만 */}
      {base && (
        <div className="mobile-action-bar">
          <div className="mobile-action-inner">
            <div className="mobile-action-summary">
              <span className="mobile-action-kicker">
                예상 비용
              </span>
              <span className="mobile-action-cost">
                {cost} <span>크레딧</span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="primary-action mobile-action-button disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isEditing
                ? "편집 중..."
                : markers.length === 0 && !hasGlobalAdjust
                  ? "마커/조명 추가"
                  : `편집 실행`}
            </button>
          </div>
        </div>
      )}

      {previewResult && (
        <ResultImageModal
          src={previewResult.src}
          alt={previewResult.prompt}
          title="편집 결과"
          onClose={() => setPreviewResult(null)}
        />
      )}
    </div>
  );
}

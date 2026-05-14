import { supportsImageQuality, unsupportedQualityMessage } from "./image-models";

export type MarkerOp = "replace" | "add" | "remove";

export interface Circle {
  cx: number; // 0..1 normalized
  cy: number; // 0..1 normalized
  r: number;  // 0..1 normalized (relative to min(width, height))
}

export interface MarkerSpec {
  id: string;
  op: MarkerOp;
  circle: Circle;
  refIndex?: number;   // index into references[] (only used when op='replace' or 'add')
  note?: string;       // optional text hint
}

export interface ImageRef {
  base64: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
}

export interface GlobalAdjust {
  mood?: string;
  lighting?: string;
  note?: string;
}

export type EditModel = "nano-banana-pro" | "gpt-image-2";

export interface EditRequest {
  base: ImageRef;
  markers: MarkerSpec[];
  references: ImageRef[];
  count: number;
  quality: "1K" | "2K" | "4K";
  globalAdjust?: GlobalAdjust;
  model: EditModel;
}

export const MAX_MARKERS = 3;
export const MAX_REFS = 3;

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_BASE64_BYTES = 12 * 1024 * 1024;

const MAGIC_BYTES: Record<string, number[][]> = {
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
};

function verifyMagicBytes(base64: string, claimedMime: string): boolean {
  const signatures = MAGIC_BYTES[claimedMime];
  if (!signatures) return false;
  try {
    const binaryStr = atob(base64.slice(0, 24));
    const bytes = Array.from(binaryStr, (c) => c.charCodeAt(0));
    return signatures.some((sig) => sig.every((byte, i) => bytes[i] === byte));
  } catch {
    return false;
  }
}

function isValidImageRef(v: unknown): v is ImageRef {
  if (!v || typeof v !== "object") return false;
  const o = v as { base64?: unknown; mimeType?: unknown };
  if (typeof o.base64 !== "string" || typeof o.mimeType !== "string") return false;
  if (!ALLOWED_MIME.has(o.mimeType)) return false;
  if (o.base64.length > MAX_IMAGE_BASE64_BYTES) return false;
  if (!/^[A-Za-z0-9+/=]+$/.test(o.base64)) return false;
  if (!verifyMagicBytes(o.base64, o.mimeType)) return false;
  return true;
}

function isValidCircle(v: unknown): v is Circle {
  if (!v || typeof v !== "object") return false;
  const o = v as { cx?: unknown; cy?: unknown; r?: unknown };
  return (
    typeof o.cx === "number" &&
    typeof o.cy === "number" &&
    typeof o.r === "number" &&
    o.cx >= 0 && o.cx <= 1 &&
    o.cy >= 0 && o.cy <= 1 &&
    o.r > 0 && o.r <= 0.6
  );
}

export function validateEditRequest(input: unknown): EditRequest | { error: string } {
  if (!input || typeof input !== "object") return { error: "잘못된 요청입니다." };
  const o = input as Record<string, unknown>;

  if (!isValidImageRef(o.base)) return { error: "베이스 이미지가 필요해요." };

  const refsRaw = Array.isArray(o.references) ? o.references : [];
  if (refsRaw.length > MAX_REFS) return { error: `레퍼런스는 최대 ${MAX_REFS}장이에요.` };
  const references: ImageRef[] = [];
  for (const r of refsRaw) {
    if (!isValidImageRef(r)) return { error: "잘못된 레퍼런스 이미지입니다." };
    references.push(r);
  }

  // global adjustments
  let globalAdjust: GlobalAdjust | undefined;
  const ga = (o as { globalAdjust?: unknown }).globalAdjust;
  if (ga && typeof ga === "object") {
    const g = ga as Record<string, unknown>;
    const pick = (v: unknown) =>
      typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : undefined;
    const mood = pick(g.mood);
    const lighting = pick(g.lighting);
    const note = pick(g.note);
    if (mood || lighting || note) {
      globalAdjust = { mood, lighting, note };
    }
  }

  const markersRaw = Array.isArray(o.markers) ? o.markers : [];
  if (markersRaw.length === 0 && !globalAdjust) {
    return { error: "마커를 1개 이상 추가하거나 분위기·조명 조정을 입력해주세요." };
  }
  if (markersRaw.length > MAX_MARKERS) {
    return { error: `마커는 최대 ${MAX_MARKERS}개까지 가능해요.` };
  }
  const markers: MarkerSpec[] = [];
  for (const m of markersRaw) {
    if (!m || typeof m !== "object") return { error: "잘못된 마커입니다." };
    const mo = m as Record<string, unknown>;
    if (typeof mo.id !== "string") return { error: "마커 ID 누락" };
    if (mo.op !== "replace" && mo.op !== "add" && mo.op !== "remove") {
      return { error: "마커 op는 replace/add/remove 중 하나여야 해요." };
    }
    if (!isValidCircle(mo.circle)) return { error: "마커 좌표가 잘못됐어요." };
    const spec: MarkerSpec = {
      id: mo.id,
      op: mo.op,
      circle: mo.circle as Circle,
    };
    if (typeof mo.refIndex === "number") {
      if (mo.refIndex < 0 || mo.refIndex >= references.length) {
        return { error: "refIndex 가 레퍼런스 범위를 벗어났어요." };
      }
      spec.refIndex = mo.refIndex;
    }
    if (typeof mo.note === "string") spec.note = mo.note.slice(0, 500);
    markers.push(spec);
  }

  const count = Math.max(1, Math.min(4, Number(o.count) || 1));
  const q = o.quality;
  const quality: EditRequest["quality"] =
    q === "1K" || q === "2K" || q === "4K" ? q : "1K";

  const model: EditModel =
    o.model === "gpt-image-2" ? "gpt-image-2" : "nano-banana-pro";
  if (!supportsImageQuality(model, quality)) {
    return { error: unsupportedQualityMessage(model, quality) };
  }

  return { base: o.base, markers, references, count, quality, globalAdjust, model };
}

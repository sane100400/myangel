// Server-backed saved images (Supabase). Items persist across devices for a logged-in user.

export interface SavedImage {
  id: string;
  prompt: string | null;
  image: string; // data URL or authenticated image URL
  source?: "generate" | "edit";
  meta?: Record<string, unknown> | null;
  created_at: string;
}

type DeleteImageResult = { ok: true } | { ok: false; error: string };

interface ListSavedImagesOptions {
  limit?: number;
  offset?: number;
}

interface ListSavedImagesPage {
  items: SavedImage[];
  total: number;
  hasMore: boolean;
  nextOffset: number;
  authed: boolean;
}

interface SaveImageInput {
  image: string;
  prompt?: string;
  source?: "generate" | "edit";
  meta?: Record<string, unknown>;
}

const SAVE_INLINE_LIMIT = 7 * 1024 * 1024;
const SAVE_API_TARGET_LIMIT = 22 * 1024 * 1024;
const SAVE_STANDARD_MAX_SIDE = 1600;
const SAVE_STANDARD_WEBP_QUALITY = 0.86;
const SAVE_4K_MAX_SIDES = [4096, 3072, 2048, 1600, 1280] as const;
const SAVE_4K_WEBP_QUALITIES = [0.9, 0.82, 0.74, 0.64] as const;

function loadDataUrlImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지를 압축할 수 없습니다."));
    img.src = dataUrl;
  });
}

async function encodeWebp(
  img: HTMLImageElement,
  maxSide: number,
  quality: number
): Promise<string | null> {
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/webp", quality);
}

async function normalizeImageForSave(
  image: string,
  preserve4K: boolean
): Promise<string> {
  if (
    typeof window === "undefined" ||
    !image.startsWith("data:image/") ||
    image.length <= SAVE_INLINE_LIMIT
  ) {
    return image;
  }

  try {
    const img = await loadDataUrlImage(image);
    let best = image;
    const maxSides = preserve4K ? SAVE_4K_MAX_SIDES : [SAVE_STANDARD_MAX_SIDE];
    const qualities = preserve4K ? SAVE_4K_WEBP_QUALITIES : [SAVE_STANDARD_WEBP_QUALITY];
    for (const maxSide of maxSides) {
      for (const quality of qualities) {
        const compressed = await encodeWebp(img, maxSide, quality);
        if (!compressed) continue;
        if (compressed.length < best.length) best = compressed;
        if (compressed.length <= SAVE_API_TARGET_LIMIT) return compressed;
      }
    }
    return best.length < image.length ? best : image;
  } catch {
    return image;
  }
}

export async function listSavedImagesPage(
  options: ListSavedImagesOptions = {}
): Promise<ListSavedImagesPage> {
  try {
    const qs = new URLSearchParams();
    if (options.limit) qs.set("limit", String(options.limit));
    if (options.offset) qs.set("offset", String(options.offset));
    const r = await fetch(`/api/saved-images${qs.size ? `?${qs.toString()}` : ""}`, {
      cache: "no-store",
    });
    if (!r.ok) return { items: [], total: 0, hasMore: false, nextOffset: 0, authed: false };
    const d = await r.json();
    const items = Array.isArray(d.items) ? d.items : [];
    const coerced = items.map((it: SavedImage) => ({
      ...it,
      prompt: it.prompt ?? "",
    }));
    return {
      items: coerced,
      total: typeof d.total === "number" ? d.total : coerced.length,
      hasMore: Boolean(d.hasMore),
      nextOffset: typeof d.nextOffset === "number" ? d.nextOffset : coerced.length,
      authed: Boolean(d.authed),
    };
  } catch {
    return { items: [], total: 0, hasMore: false, nextOffset: 0, authed: false };
  }
}

export async function saveImage(
  input: SaveImageInput
): Promise<{ ok: true; item: SavedImage } | { ok: false; error: string }> {
  try {
    const image = await normalizeImageForSave(input.image, input.meta?.quality === "4K");
    const r = await fetch("/api/saved-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image,
        prompt: input.prompt ?? null,
        source: input.source ?? "generate",
        meta: input.meta ?? null,
      }),
    });
    const text = await r.text();
    let data: { item?: SavedImage; error?: string } = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return { ok: false, error: `서버 오류 (${r.status})` };
    }
    if (!r.ok) return { ok: false, error: data.error || `저장 실패 (${r.status})` };
    if (!data.item) return { ok: false, error: "저장 결과가 비어있어요" };
    return { ok: true, item: data.item };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "네트워크 오류" };
  }
}

export async function deleteImage(id: string): Promise<DeleteImageResult> {
  try {
    const r = await fetch(`/api/saved-images/${id}`, { method: "DELETE" });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return { ok: false, error: data.error || `삭제 실패 (${r.status})` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "네트워크 오류" };
  }
}

import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { DEFAULT_DISCOVER_TAGS } from "@/lib/discover-tags";
import {
  hashIP,
  getRateLimitCount,
  createImage,
  uploadImage,
  publicUrl,
  MAX_PER_USER_PER_DAY,
} from "@/lib/discover-store";
import { createClient } from "@/lib/supabase/server";
import { logger, reportServerError } from "@/lib/logger";
import { assertSameOrigin, rateLimitOk, rateKey } from "@/lib/api-guard";
import { getAdminClient } from "@/lib/supabase/admin";
import { buildImageTitle } from "@/lib/image-title";

// ── 설정 ──
const MAX_BASE64_SIZE = 8 * 1024 * 1024;
const MAX_IMAGE_BYTES = 32 * 1024 * 1024;
const MIN_DIMENSION = 64;
const MAX_DIMENSION = 4096;
const SHARE_MAX_DIMENSION = 1600;
const WEBP_QUALITY = 85;
const THUMB_WIDTH = 400;
const TITLE_MAX_LENGTH = 32;
const SAVED_BUCKET = "user-generations";

const ALLOWED_MIME: Record<string, Buffer> = {
  "image/png": Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  "image/jpeg": Buffer.from([0xff, 0xd8, 0xff]),
  "image/webp": Buffer.from([0x52, 0x49, 0x46, 0x46]),
};

const TAGS_SET = new Set(DEFAULT_DISCOVER_TAGS);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface LoadedImage {
  buffer: Buffer;
  mime: string;
}

interface SourceGeneration {
  id: string;
  image: string | null;
  storage_path: string | null;
  prompt: string | null;
  meta: Record<string, unknown> | null;
}

function sanitizeText(text: string, maxLen: number): string {
  return text
    .replace(/[<>&"']/g, "")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .trim()
    .slice(0, maxLen);
}

function detectMime(buffer: Buffer): string | null {
  for (const [mime, sig] of Object.entries(ALLOWED_MIME)) {
    if (buffer.subarray(0, sig.length).equals(sig)) return mime;
  }
  return null;
}

function parseDataImage(image: string): LoadedImage | { error: string } {
  const m = image.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
  if (!m) return { error: "올바른 이미지 형식이 아닙니다." };
  const claimedMime = m[1];
  const base64 = m[2];
  if (base64.length > MAX_BASE64_SIZE) return { error: "이미지가 너무 큽니다." };
  if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
    return { error: "잘못된 이미지 데이터입니다." };
  }
  const buffer = Buffer.from(base64, "base64");
  const detected = detectMime(buffer);
  if (!detected || detected !== claimedMime) {
    return { error: "이미지 파일 형식이 올바르지 않아요." };
  }
  return { buffer, mime: detected };
}

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const log = logger.child({ route: "share.POST" });
  try {
    const blocked = assertSameOrigin(request);
    if (blocked) return blocked;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    if (!rateLimitOk(rateKey("share-per-second", user.id, request), 1, 1000)) {
      return NextResponse.json(
        { error: "공유는 1초에 1개씩만 할 수 있어요." },
        { status: 429 }
      );
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const ipHash = hashIP(ip);

    const count = await getRateLimitCount(ipHash, user.id);
    if (count >= MAX_PER_USER_PER_DAY) {
      return NextResponse.json(
        { error: `하루 공유 횟수를 초과했어요. (최대 ${MAX_PER_USER_PER_DAY}회)` },
        { status: 429 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
    }

    const { image, title, tags, prompt, sourceGenerationId } = body as {
      image?: string;
      title?: string;
      tags?: string[];
      prompt?: string;
      sourceGenerationId?: string;
    };

    const admin = getAdminClient();
    let cleanSourceGenerationId: string | null = null;
    let generationMeta: Record<string, unknown> | null = null;
    let existingDiscoverIds: string[] = [];
    let generation: SourceGeneration | null = null;

    if (sourceGenerationId) {
      if (!UUID_RE.test(sourceGenerationId)) {
        return NextResponse.json({ error: "저장 이미지 정보가 올바르지 않아요." }, { status: 400 });
      }
      const { data, error: generationError } = await admin
        .from("user_generations")
        .select("id, image, storage_path, prompt, meta")
        .eq("id", sourceGenerationId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (generationError) {
        return NextResponse.json({ error: generationError.message }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json({ error: "마이페이지 저장 이미지를 찾을 수 없어요." }, { status: 400 });
      }

      generation = data as SourceGeneration;
      cleanSourceGenerationId = sourceGenerationId;
      generationMeta =
        generation.meta && typeof generation.meta === "object" && !Array.isArray(generation.meta)
          ? (generation.meta as Record<string, unknown>)
          : {};
      const ids = generationMeta.discover_image_ids;
      const singleId = generationMeta.discover_image_id;
      existingDiscoverIds = [
        ...(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string" && UUID_RE.test(id)) : []),
        ...(typeof singleId === "string" && UUID_RE.test(singleId) ? [singleId] : []),
      ];

      if (existingDiscoverIds.length > 0) {
        const { data: existingShared } = await admin
          .from("discover_images")
          .select("id, storage_path")
          .eq("user_id", user.id)
          .in("id", existingDiscoverIds)
          .limit(1);
        existingDiscoverIds = (existingShared ?? [])
          .map((item) => item.id)
          .filter((id): id is string => typeof id === "string" && UUID_RE.test(id));
        const existing = existingShared?.[0];
        if (existing?.id && existing?.storage_path) {
          return NextResponse.json({
            success: true,
            alreadyShared: true,
            id: existing.id,
            url: publicUrl(existing.storage_path as string),
            message: "이미 Discover에 공유된 이미지예요.",
          });
        }
      }
    }

    let loaded: LoadedImage | { error: string };
    if (typeof image === "string" && image) {
      loaded = parseDataImage(image);
    } else if (generation?.image) {
      loaded = parseDataImage(generation.image);
    } else if (generation?.storage_path) {
      const { data, error } = await admin.storage
        .from(SAVED_BUCKET)
        .download(generation.storage_path);
      if (error || !data) {
        return NextResponse.json(
          { error: error?.message || "저장된 이미지를 불러오지 못했어요." },
          { status: 500 }
        );
      }
      const buffer = Buffer.from(await data.arrayBuffer());
      const detected = detectMime(buffer);
      loaded = detected
        ? { buffer, mime: detected }
        : { error: "이미지 파일 형식이 올바르지 않아요." };
    } else {
      return NextResponse.json({ error: "이미지가 필요합니다." }, { status: 400 });
    }

    if ("error" in loaded) {
      return NextResponse.json({ error: loaded.error }, { status: 400 });
    }
    if (loaded.buffer.length > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "이미지가 너무 큽니다." }, { status: 400 });
    }

    // sharp 검증 + WebP 변환 + 썸네일
    let meta: sharp.Metadata;
    try {
      meta = await sharp(loaded.buffer).metadata();
    } catch {
      return NextResponse.json(
        { error: "이미지를 처리할 수 없어요. 다른 이미지로 다시 시도해주세요." },
        { status: 400 }
      );
    }
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (
      width < MIN_DIMENSION ||
      height < MIN_DIMENSION ||
      width > MAX_DIMENSION ||
      height > MAX_DIMENSION
    ) {
      return NextResponse.json(
        { error: `이미지 크기는 ${MIN_DIMENSION}~${MAX_DIMENSION}px 사이여야 해요.` },
        { status: 400 }
      );
    }

    let webpResult: { data: Buffer; info: sharp.OutputInfo };
    let thumbBuffer: Buffer;
    try {
      webpResult = await sharp(loaded.buffer)
        .rotate()
        .resize(SHARE_MAX_DIMENSION, SHARE_MAX_DIMENSION, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY, effort: 4 })
        .toBuffer({ resolveWithObject: true });
      thumbBuffer = await sharp(loaded.buffer)
        .rotate()
        .resize(THUMB_WIDTH, THUMB_WIDTH, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 70, effort: 3 })
        .toBuffer();
    } catch {
      return NextResponse.json(
        { error: "이미지를 처리할 수 없어요. 다른 이미지로 다시 시도해주세요." },
        { status: 400 }
      );
    }
    const webpBuffer = webpResult.data;

    // 텍스트 살균
    const cleanPrompt = sanitizeText(prompt ?? generation?.prompt ?? "", 4000);
    const cleanTitle =
      sanitizeText(title ?? "", TITLE_MAX_LENGTH) ||
      buildImageTitle(cleanPrompt, "공유 이미지", TITLE_MAX_LENGTH);
    const cleanTags = (Array.isArray(tags) ? tags : [])
      .map((t) => sanitizeText(t, 30))
      .filter((t) => t && TAGS_SET.has(t))
      .slice(0, 8);

    const finalTags = cleanTags;

    // ── 작성자 스냅샷 ──
    const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const rawName =
      (typeof userMeta.full_name === "string" && userMeta.full_name) ||
      (typeof userMeta.name === "string" && userMeta.name) ||
      (typeof userMeta.user_name === "string" && userMeta.user_name) ||
      (typeof userMeta.preferred_username === "string" && userMeta.preferred_username) ||
      (user.email ? user.email.split("@")[0] : null);
    const userName = rawName ? sanitizeText(String(rawName), 60) : null;
    const avatarRaw =
      (typeof userMeta.avatar_url === "string" && userMeta.avatar_url) ||
      (typeof userMeta.picture === "string" && userMeta.picture) ||
      null;
    const userAvatar =
      avatarRaw && /^https:\/\//.test(avatarRaw) ? avatarRaw.slice(0, 500) : null;

    // ── Storage 업로드 ──
    // 경로: <user_id>/<random>.webp — RLS 정책상 첫 폴더가 user_id여야 함
    const { randomUUID } = await import("crypto");
    const fileId = randomUUID();
    const storagePath = `${user.id}/${fileId}.webp`;
    const thumbPath = `${user.id}/${fileId}-thumb.webp`;

    await uploadImage(storagePath, webpBuffer, "image/webp");
    await uploadImage(thumbPath, thumbBuffer, "image/webp");

    // ── DB insert ──
    const inserted = await createImage({
      user_id: user.id,
      storage_path: storagePath,
      thumb_path: thumbPath,
      title: cleanTitle,
      tags: finalTags,
      prompt: cleanPrompt,
      user_name: userName,
      user_avatar: userAvatar,
      ip_hash: ipHash,
      file_size: webpBuffer.length,
      width: webpResult.info.width,
      height: webpResult.info.height,
    });

    if (cleanSourceGenerationId) {
      const nextDiscoverIds = Array.from(new Set([...existingDiscoverIds, inserted.id]));
      const nextMeta = {
        ...(generationMeta ?? {}),
        discover_image_id: inserted.id,
        discover_image_ids: nextDiscoverIds,
      };
      const { error: metaUpdateError } = await admin
        .from("user_generations")
        .update({ meta: nextMeta })
        .eq("id", cleanSourceGenerationId)
        .eq("user_id", user.id);
      if (metaUpdateError) {
        log.warn("failed to link generation to discover image", {
          msg: metaUpdateError.message,
          sourceGenerationId: cleanSourceGenerationId,
          discoverId: inserted.id,
        });
      }
    }

    log.info("share created", {
      id: inserted.id,
      user_id: user.id,
      size: webpBuffer.length,
    });

    return NextResponse.json({
      success: true,
      id: inserted.id,
      url: publicUrl(storagePath),
      message: "이미지가 Discover에 공유되었어요!",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    reportServerError({ route: "share.POST", error: e });
    return NextResponse.json(
      { error: `공유 중 오류가 발생했어요. (${msg})` },
      { status: 500 }
    );
  }
}

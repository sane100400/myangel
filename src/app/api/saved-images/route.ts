import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  assertSameOrigin,
  parseAndVerifyDataUrl,
  rateLimitOk,
  rateKey,
} from "@/lib/api-guard";
import { logger } from "@/lib/logger";

// Storage 우회 용 임계 — 작은 이미지(<512KB base64)는 그냥 DB에 박는 게 더 빠름
const STORAGE_THRESHOLD = 512 * 1024;
const MAX_IMAGE_BASE64 = 24 * 1024 * 1024; // 24MB base64
const SAVED_BUCKET = "user-generations";
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 60;

interface SavedListRow {
  id: string;
  prompt: string | null;
  source: string;
  meta: Record<string, unknown> | null;
  created_at: string;
}

interface SavedRow extends SavedListRow {
  image: string | null;
  storage_path: string | null;
}

export async function GET(req: NextRequest) {
  const log = logger.child({ route: "saved-images.GET" });
  const blocked = assertSameOrigin(req);
  if (blocked) {
    log.warn("blocked by same-origin check", {
      origin: req.headers.get("origin"),
      referer: req.headers.get("referer"),
    });
    return blocked;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (!user) {
    log.warn("no user on /api/saved-images GET", {
      authErr: authErr?.message,
      hasCookie: !!req.headers.get("cookie"),
    });
    return NextResponse.json(
      { items: [], authed: false, total: 0, hasMore: false, nextOffset: 0 },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const url = new URL(req.url);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT)
  );
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);

  const { data, error } = await supabase
    .from("user_generations")
    .select("id, prompt, source, meta, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (error) {
    log.error("user_generations select failed", { msg: error.message, userId: user.id });
    return NextResponse.json(
      { items: [], authed: true, error: error.message },
      { status: 500 }
    );
  }

  const fetchedRows = (data ?? []) as SavedListRow[];
  const hasMore = fetchedRows.length > limit;
  const rows = fetchedRows.slice(0, limit);
  const items = rows.map((row) => ({
    ...row,
    image: `/api/saved-images/${row.id}`,
  }));

  return NextResponse.json(
    {
      items,
      authed: true,
      total: offset + items.length + (hasMore ? 1 : 0),
      hasMore,
      nextOffset: offset + items.length,
      limit,
      offset,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

export async function POST(req: NextRequest) {
  const log = logger.child({ route: "saved-images.POST" });
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  if (!rateLimitOk(rateKey("saved-img-post", user.id, req), 60, 60_000)) {
    return NextResponse.json({ error: "요청이 너무 많아요." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
  }

  const image = typeof body?.image === "string" ? body.image : null;
  const prompt =
    typeof body?.prompt === "string" ? body.prompt.slice(0, 4000) : null;
  const source =
    body?.source === "edit" || body?.source === "generate"
      ? body.source
      : "generate";
  const meta =
    body?.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
      ? body.meta
      : null;

  if (!image) {
    return NextResponse.json({ error: "이미지가 필요합니다." }, { status: 400 });
  }
  const verified = parseAndVerifyDataUrl(image, MAX_IMAGE_BASE64);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 });
  }

  // 큰 이미지 → Storage. 작은 이미지 → 기존대로 DB 직접 (호환성).
  let storagePath: string | null = null;
  let imageInDb: string | null = image;

  if (image.length > STORAGE_THRESHOLD) {
    try {
      const admin = getAdminClient();
      const { randomUUID } = await import("crypto");
      const ext = verified.mime === "image/jpeg" ? "jpg" : verified.mime.split("/")[1];
      storagePath = `${user.id}/${randomUUID()}.${ext}`;
      const buf = Buffer.from(verified.base64, "base64");
      const { error: upErr } = await admin.storage
        .from(SAVED_BUCKET)
        .upload(storagePath, buf, {
          contentType: verified.mime,
          upsert: false,
        });
      if (upErr) throw new Error(upErr.message);
      imageInDb = null; // Storage에 있으니 DB엔 안 박음
    } catch (e) {
      // Storage 실패 시 DB로 fallback (서비스 가용성 우선)
      log.warn("storage upload failed, falling back to DB", {
        msg: (e as Error).message,
      });
      storagePath = null;
      imageInDb = image;
    }
  }

  const { data, error } = await supabase
    .from("user_generations")
    .insert({
      user_id: user.id,
      image: imageInDb,
      storage_path: storagePath,
      prompt,
      source,
      meta,
    })
    .select("id, image, storage_path, prompt, source, meta, created_at")
    .single();

  if (error) {
    log.error("user_generations insert failed", { msg: error.message });
    // Storage에 올렸는데 DB 실패하면 정리
    if (storagePath) {
      const admin = getAdminClient();
      admin.storage.from(SAVED_BUCKET).remove([storagePath]).catch(() => {});
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 응답: image 필드가 비어있으면 서명 URL 생성하여 채움
  let respImage = (data as SavedRow).image;
  if (!respImage && (data as SavedRow).storage_path) {
    const admin = getAdminClient();
    const { data: sig } = await admin.storage
      .from(SAVED_BUCKET)
      .createSignedUrl((data as SavedRow).storage_path!, 60 * 60);
    respImage = sig?.signedUrl ?? null;
  }

  return NextResponse.json({
    item: {
      ...(data as SavedRow),
      image: respImage,
    },
  });
}

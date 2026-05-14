import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin, parseAndVerifyDataUrl } from "@/lib/api-guard";

const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAVED_BUCKET = "user-generations";
const SHARED_BUCKET = "shared-images";
const MAX_IMAGE_BASE64 = 24 * 1024 * 1024;

function linkedDiscoverIds(meta: unknown): string[] {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return [];
  const record = meta as Record<string, unknown>;
  const ids = record.discover_image_ids;
  const singleId = record.discover_image_id;
  return Array.from(
    new Set([
      ...(Array.isArray(ids) ? ids : []),
      singleId,
    ].filter((id): id is string => typeof id === "string" && ID_RE.test(id)))
  );
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const { id } = await ctx.params;
  if (!ID_RE.test(id)) {
    return NextResponse.json({ error: "잘못된 ID" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_generations")
    .select("image, storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "이미지를 찾을 수 없어요." }, { status: 404 });
  }

  if (data.storage_path) {
    const admin = getAdminClient();
    const { data: sig, error: sigErr } = await admin.storage
      .from(SAVED_BUCKET)
      .createSignedUrl(data.storage_path as string, 10 * 60);
    if (sigErr || !sig?.signedUrl) {
      return NextResponse.json({ error: "이미지 URL을 만들지 못했어요." }, { status: 500 });
    }
    const response = NextResponse.redirect(sig.signedUrl, 307);
    response.headers.set("Cache-Control", "private, max-age=300");
    return response;
  }

  if (typeof data.image === "string" && data.image.startsWith("data:image/")) {
    const verified = parseAndVerifyDataUrl(data.image, MAX_IMAGE_BASE64);
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: 422 });
    }
    return new NextResponse(Buffer.from(verified.base64, "base64"), {
      headers: {
        "Cache-Control": "private, max-age=300",
        "Content-Type": verified.mime,
      },
    });
  }

  return NextResponse.json({ error: "이미지가 비어 있어요." }, { status: 404 });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const blocked = assertSameOrigin(req);
  if (blocked) return blocked;

  const { id } = await ctx.params;
  if (!ID_RE.test(id)) {
    return NextResponse.json({ error: "잘못된 ID" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  // Storage에 있는 파일 경로와 Discover 연결 정보를 조회 후 함께 정리
  const { data: row } = await supabase
    .from("user_generations")
    .select("storage_path, meta")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const admin = getAdminClient();
  const discoverIds = linkedDiscoverIds(row?.meta);
  if (discoverIds.length > 0) {
    const { data: linked } = await admin
      .from("discover_images")
      .select("id, storage_path, thumb_path")
      .eq("user_id", user.id)
      .in("id", discoverIds);

    const linkedRows = linked ?? [];
    if (linkedRows.length > 0) {
      const paths = linkedRows.flatMap((item) => [
        item.storage_path as string,
        ...(item.thumb_path ? [item.thumb_path as string] : []),
      ]);

      await admin
        .from("discover_images")
        .delete()
        .eq("user_id", user.id)
        .in("id", linkedRows.map((item) => item.id as string));

      if (paths.length > 0) {
        admin.storage.from(SHARED_BUCKET).remove(paths).catch(() => {});
      }
    }
  }

  const { error } = await supabase
    .from("user_generations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (row?.storage_path) {
    admin.storage
      .from(SAVED_BUCKET)
      .remove([row.storage_path as string])
      .catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

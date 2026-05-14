import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  updateImageTitle,
  deleteImageById,
  deleteFromStorage,
} from "@/lib/discover-store";
import { logger } from "@/lib/logger";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TITLE_MAX_LENGTH = 32;

function sanitizeText(text: string, maxLen: number): string {
  return text
    .replace(/[<>&"']/g, "")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .trim()
    .slice(0, maxLen);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const log = logger.child({ route: "share[id].PATCH" });
  try {
    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "잘못된 ID입니다." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
    }

    const title = typeof body?.title === "string" ? body.title : "";
    const cleanTitle = sanitizeText(title, TITLE_MAX_LENGTH);
    if (!cleanTitle) {
      return NextResponse.json({ error: "유효한 제목을 입력해주세요." }, { status: 400 });
    }

    const result = await updateImageTitle(id, user.id, cleanTitle);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    return NextResponse.json({ success: true, title: result.title });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error("update failed", { msg });
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const log = logger.child({ route: "share[id].DELETE" });
  try {
    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: "잘못된 ID입니다." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const result = await deleteImageById(id, user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    // Storage 정리 (실패해도 DB 삭제는 이미 완료 → 200 반환)
    const paths = [result.storage_path];
    if (result.thumb_path) paths.push(result.thumb_path);
    deleteFromStorage(paths).catch((err) =>
      log.warn("storage cleanup failed", { msg: (err as Error).message, paths })
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error("delete failed", { msg });
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

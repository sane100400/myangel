import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateImageTitle, deleteImage } from "@/lib/shared-images-store";

// ID 형식 검증
const ID_PATTERN = /^shared-[0-9a-f-]+$/;

// 텍스트 살균
function sanitizeText(text: string, maxLen: number): string {
  return text
    .replace(/[<>&"']/g, "")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .trim()
    .slice(0, maxLen);
}

// ── PATCH: 제목 수정 ──
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ID 형식 검증
    if (!ID_PATTERN.test(id)) {
      return NextResponse.json({ error: "잘못된 ID입니다." }, { status: 400 });
    }

    // 인증 확인
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // Body 파싱
    const body = await request.json();
    const { title } = body as { title?: string };

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "제목이 필요합니다." }, { status: 400 });
    }

    const cleanTitle = sanitizeText(title, 100);
    if (cleanTitle.length === 0) {
      return NextResponse.json({ error: "유효한 제목을 입력해주세요." }, { status: 400 });
    }

    const result = await updateImageTitle(id, user.id, cleanTitle);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true, title: cleanTitle });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// ── DELETE: 이미지 삭제 ──
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ID 형식 검증
    if (!ID_PATTERN.test(id)) {
      return NextResponse.json({ error: "잘못된 ID입니다." }, { status: 400 });
    }

    // 인증 확인
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const result = await deleteImage(id, user.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

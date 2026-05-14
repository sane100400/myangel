import { NextRequest, NextResponse } from "next/server";
import { getImage, publicUrl } from "@/lib/discover-store";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "잘못된 ID입니다." }, { status: 400 });
  }
  try {
    const img = await getImage(id);
    if (!img) {
      return NextResponse.json({ error: "이미지를 찾을 수 없어요" }, { status: 404 });
    }
    return NextResponse.json({
      image: {
        id: img.id,
        image_url: publicUrl(img.storage_path),
        thumb_url: img.thumb_path ? publicUrl(img.thumb_path) : publicUrl(img.storage_path),
        title: img.title,
        tags: img.tags,
        prompt: img.prompt,
        user_id: img.user_id,
        user_name: img.user_name,
        user_avatar: img.user_avatar,
        created_at: img.created_at,
        width: img.width,
        height: img.height,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

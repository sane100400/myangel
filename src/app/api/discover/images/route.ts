import { NextResponse } from "next/server";
import { readStore } from "@/lib/shared-images-store";

export async function GET() {
  let images: {
    id: string;
    image_url: string;
    title: string;
    tags: string[];
    prompt: string;
    is_premium: boolean;
    user_id?: string | null;
  }[] = [];

  try {
    const store = await readStore();
    images = store.images
      .slice()
      .reverse() // 최신순
      .map((img) => ({
        id: img.id,
        image_url: img.id,
        title: img.title,
        tags: img.tags,
        prompt: img.prompt,
        is_premium: img.is_premium,
        user_id: img.user_id ?? null,
      }));
  } catch {
    // JSON 읽기 실패 시 빈 배열 반환
  }

  return NextResponse.json(
    { images, total: images.length },
    {
      headers: {
        "Cache-Control": "public, max-age=10, stale-while-revalidate=30",
      },
    }
  );
}

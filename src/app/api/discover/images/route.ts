import { NextResponse } from "next/server";
import { SEED_MOOD_IMAGES } from "@/lib/seed-data";
import { readStore } from "@/lib/shared-images-store";

export async function GET() {
  // Seed 이미지를 통합 형식으로 변환
  const seedImages = SEED_MOOD_IMAGES.map((img) => ({
    id: img.id,
    image_url: img.image_url,
    title: img.title,
    tags: img.tags,
    prompt: img.prompt,
    is_premium: img.is_premium ?? false,
  }));

  // Shared 이미지 로드 (실패 시 seed만 반환)
  let sharedImages: typeof seedImages = [];
  try {
    const store = await readStore();
    sharedImages = store.images
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
    // JSON 읽기 실패 시 무시 — seed만 반환
  }

  const images = [...sharedImages, ...seedImages];

  return NextResponse.json(
    { images, total: images.length },
    {
      headers: {
        "Cache-Control": "public, max-age=10, stale-while-revalidate=30",
      },
    }
  );
}

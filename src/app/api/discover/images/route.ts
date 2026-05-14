import { NextRequest, NextResponse } from "next/server";
import { listImages, publicUrl } from "@/lib/discover-store";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userFilter = url.searchParams.get("user")?.trim() || null;
  const tag = url.searchParams.get("tag")?.trim() || null;
  const query = url.searchParams.get("q")?.trim().slice(0, 80) || null;
  const dateFrom = url.searchParams.get("from")?.trim() || null;
  const dateTo = url.searchParams.get("to")?.trim() || null;
  const rawSort = url.searchParams.get("sort");
  const sort =
    rawSort === "oldest" || rawSort === "title" || rawSort === "latest"
      ? rawSort
      : "latest";
  const limit = Math.min(60, Math.max(1, Number(url.searchParams.get("limit")) || 12));
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);

  try {
    const rows = await listImages({
      userFilter,
      tag,
      query,
      dateFrom,
      dateTo,
      sort,
      limit: limit + 1,
      offset,
    });
    const pageRows = rows.slice(0, limit);
    const images = pageRows.map((img) => ({
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
    }));

    return NextResponse.json(
      {
        images,
        hasMore: rows.length > limit,
        nextOffset: offset + images.length,
        limit,
        offset,
        userFilter,
        tag,
        query,
        dateFrom,
        dateTo,
        sort,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error("discover.list failed", { msg });
    return NextResponse.json({ images: [], total: 0, error: msg }, { status: 500 });
  }
}

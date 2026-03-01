import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { SEED_MOOD_IMAGES } from "@/lib/seed-data";

// Whitelist of valid seed image IDs
const SEED_IDS = new Set(SEED_MOOD_IMAGES.map((img) => img.id));

// Shared image ID format: shared-{uuid}
const SHARED_ID_RE = /^shared-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const IMAGES_DIR = path.join(process.cwd(), "content", "images");
const SHARED_DIR = path.join(process.cwd(), "content", "shared");
const CACHE_DIR = path.join(process.cwd(), "content", "cache");

const THUMB_WIDTH = 400;
const THUMB_QUALITY = 70;
const THUMB_SM_WIDTH = 200;
const THUMB_SM_QUALITY = 60;

// Allowed hosts for referer check
const ALLOWED_HOSTS = [
  "34.56.233.158",
  "localhost",
  "127.0.0.1",
];

function isRefererAllowed(request: NextRequest): boolean {
  const referer = request.headers.get("referer");

  // Allow requests with no referer (direct browser navigation, curl, etc.)
  if (!referer) return true;

  try {
    const url = new URL(referer);
    return ALLOWED_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. ID validation — seed whitelist OR shared-{uuid} format
  const isSeed = SEED_IDS.has(id);
  const isShared = SHARED_ID_RE.test(id);

  if (!isSeed && !isShared) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 2. Referer check
  if (!isRefererAllowed(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. Determine quality mode
  const q = request.nextUrl.searchParams.get("q") || "full";
  if (q !== "thumb" && q !== "thumb_sm" && q !== "full") {
    return NextResponse.json({ error: "Invalid quality parameter" }, { status: 400 });
  }

  // Resolve image path based on type
  const originalPath = isSeed
    ? path.join(IMAGES_DIR, `${id}.webp`)
    : path.join(SHARED_DIR, `${id}.webp`);

  try {
    // Check original exists
    await fs.access(originalPath);
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  try {
    let buffer: Buffer;
    let cacheControl: string;

    if (q === "thumb" || q === "thumb_sm") {
      // Thumbnail: check cache first
      const isSmall = q === "thumb_sm";
      const thumbFilename = isSmall ? `thumb-sm-${id}.webp` : `thumb-${id}.webp`;
      const thumbPath = path.join(CACHE_DIR, thumbFilename);
      const width = isSmall ? THUMB_SM_WIDTH : THUMB_WIDTH;
      const quality = isSmall ? THUMB_SM_QUALITY : THUMB_QUALITY;

      try {
        buffer = await fs.readFile(thumbPath);
      } catch {
        // Generate thumbnail
        await fs.mkdir(CACHE_DIR, { recursive: true });
        buffer = await sharp(originalPath)
          .resize(width, null, { withoutEnlargement: true })
          .webp({ quality })
          .toBuffer();
        // Write cache (fire-and-forget)
        fs.writeFile(thumbPath, buffer).catch(() => {});
      }

      cacheControl = isShared
        ? "public, max-age=86400" // shared: 1 day
        : "public, max-age=604800, immutable"; // seed: 7 days
    } else {
      // Full quality: serve original
      buffer = await fs.readFile(originalPath);
      cacheControl = isShared
        ? "public, max-age=86400" // shared: 1 day
        : "public, max-age=2592000, immutable"; // seed: 30 days
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": cacheControl,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

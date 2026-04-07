import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { genai } from "@/lib/gemini";
import { SEED_TAGS } from "@/lib/seed-data";
import {
  readStore,
  hashIP,
  getRateLimitCount,
  addImage,
  MAX_PER_IP_PER_DAY,
  SHARED_DIR,
  type SharedImageEntry,
} from "@/lib/shared-images-store";
import { createClient } from "@/lib/supabase/server";

// ── 설정 ──
const MAX_BASE64_SIZE = 8 * 1024 * 1024; // 8MB (base64 문자열 길이)
const MIN_DIMENSION = 64;
const MAX_DIMENSION = 4096;
const WEBP_QUALITY = 85;
const THUMB_WIDTH = 400;

const ALLOWED_MIME: Record<string, Buffer> = {
  "image/png": Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  "image/jpeg": Buffer.from([0xff, 0xd8, 0xff]),
  "image/webp": Buffer.from([0x52, 0x49, 0x46, 0x46]),
};

const TAGS_SET = new Set(SEED_TAGS);

// ── 텍스트 살균 ──
function sanitizeText(text: string, maxLen: number): string {
  return text
    .replace(/[<>&"']/g, "") // HTML 특수문자 제거
    .replace(/[\x00-\x1f\x7f]/g, "") // 제어문자 제거
    .trim()
    .slice(0, maxLen);
}

export async function POST(request: NextRequest) {
  try {
    // ── 0. 인증 확인 ──
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // ── 0-1. IP 추출 ──
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const ipHash = hashIP(ip);

    // ── 1. Rate limit ──
    const store = await readStore();
    const count = getRateLimitCount(store, ipHash);
    if (count >= MAX_PER_IP_PER_DAY) {
      return NextResponse.json(
        { error: "하루 공유 횟수를 초과했어요. (최대 10회)" },
        { status: 429 }
      );
    }

    // ── Body 파싱 ──
    const body = await request.json();
    const { image, title, tags, prompt } = body as {
      image?: string;
      title?: string;
      tags?: string[];
      prompt?: string;
    };

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "이미지가 필요합니다." }, { status: 400 });
    }

    // ── 2. Data URI 형식 검증 ──
    const dataUriMatch = image.match(
      /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/
    );
    if (!dataUriMatch) {
      return NextResponse.json(
        { error: "올바른 이미지 형식이 아닙니다." },
        { status: 400 }
      );
    }
    const declaredMime = dataUriMatch[1];
    const base64Data = dataUriMatch[2];

    // ── 3. Base64 크기 검증 ──
    if (base64Data.length > MAX_BASE64_SIZE) {
      return NextResponse.json(
        { error: "이미지 크기가 너무 큽니다. (최대 8MB)" },
        { status: 400 }
      );
    }

    // ── 4. Base64 문자 검증 ──
    if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
      return NextResponse.json(
        { error: "잘못된 이미지 데이터입니다." },
        { status: 400 }
      );
    }

    // ── 5. Magic bytes 검증 ──
    const buffer = Buffer.from(base64Data, "base64");
    const expectedMagic = ALLOWED_MIME[declaredMime];
    if (!expectedMagic || !buffer.subarray(0, expectedMagic.length).equals(expectedMagic)) {
      return NextResponse.json(
        { error: "이미지 파일이 손상되었거나 위조되었습니다." },
        { status: 400 }
      );
    }

    // ── 6. Sharp 디코딩 검증 ──
    let metadata: sharp.Metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch {
      return NextResponse.json(
        { error: "이미지를 읽을 수 없습니다." },
        { status: 400 }
      );
    }

    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { error: "이미지 크기를 확인할 수 없습니다." },
        { status: 400 }
      );
    }

    // ── 7. 이미지 크기 검증 ──
    if (
      metadata.width < MIN_DIMENSION ||
      metadata.height < MIN_DIMENSION ||
      metadata.width > MAX_DIMENSION ||
      metadata.height > MAX_DIMENSION
    ) {
      return NextResponse.json(
        { error: `이미지 크기는 ${MIN_DIMENSION}~${MAX_DIMENSION}px 이내여야 합니다.` },
        { status: 400 }
      );
    }

    // ── 8. WebP 변환 (EXIF/payload 제거) ──
    const webpBuffer = await sharp(buffer)
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    // 썸네일 생성
    const thumbBuffer = await sharp(buffer)
      .resize(THUMB_WIDTH, null, { withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer();

    // ── 9. 텍스트 살균 ──
    const cleanPrompt = sanitizeText(prompt || "", 2000);

    // ── 10. AI 자동 제목 + 태그 생성 (Gemini) ──
    let aiTitle = "";
    let aiTags: string[] = [];
    try {
      const tagList = SEED_TAGS.join(", ");
      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "image/webp",
                  data: webpBuffer.toString("base64"),
                },
              },
              {
                text: `이 이미지를 분석하고 두 가지를 생성해주세요.

1) 제목: 이미지의 분위기와 내용을 담은 한국어 제목 (15자 이내, 감성적으로)
2) 태그: 다음 목록에서 가장 어울리는 태그 정확히 3개
   태그 목록: [${tagList}]

출력 형식 (정확히 이 형식만, 다른 텍스트 없이):
제목: 여기에 제목
태그: 태그1, 태그2, 태그3`,
              },
            ],
          },
        ],
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        // 제목 파싱
        const titleMatch = text.match(/제목:\s*(.+)/);
        if (titleMatch) {
          aiTitle = sanitizeText(titleMatch[1], 50);
        }
        // 태그 파싱
        const tagsMatch = text.match(/태그:\s*(.+)/);
        if (tagsMatch) {
          aiTags = tagsMatch[1]
            .split(/[,，]+/)
            .map((t) => t.trim())
            .filter((t) => TAGS_SET.has(t))
            .slice(0, 3);
        }
      }
    } catch {
      // AI 실패 시 무시 — 클라이언트 값으로 fallback
    }

    // AI 결과 우선, 부족하면 클라이언트 값으로 보충
    const cleanTitle = aiTitle || sanitizeText(title || "공유 이미지", 100);
    const clientTags = (tags || [])
      .filter((t): t is string => typeof t === "string" && TAGS_SET.has(t));
    const mergedSet = new Set([...aiTags, ...clientTags]);
    const cleanTags = [...mergedSet].slice(0, 3);

    // ── 저장 ──
    const id = `shared-${crypto.randomUUID()}`;

    await fs.mkdir(SHARED_DIR, { recursive: true });
    await fs.writeFile(path.join(SHARED_DIR, `${id}.webp`), webpBuffer);

    // 썸네일 저장
    const cacheDir = path.join(process.cwd(), "content", "cache");
    await fs.mkdir(cacheDir, { recursive: true });
    fs.writeFile(path.join(cacheDir, `thumb-${id}.webp`), thumbBuffer).catch(() => {});

    // ── 메타데이터 저장 ──
    const entry: SharedImageEntry = {
      id,
      title: cleanTitle,
      tags: cleanTags,
      prompt: cleanPrompt,
      created_at: new Date().toISOString(),
      ip_hash: ipHash,
      file_size: webpBuffer.length,
      user_id: user.id,
    };

    await addImage(entry);

    return NextResponse.json({
      success: true,
      id,
      message: "이미지가 Discover에 공유되었어요!",
    });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

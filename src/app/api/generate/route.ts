import { NextRequest, NextResponse } from "next/server";
import { genai } from "@/lib/gemini";
import { getRecommendedBrands } from "@/lib/brands";
import { STYLE_PRESETS } from "@/lib/seed-data";

// Allow longer timeout for image generation with references
export const maxDuration = 60;

const MAX_IMAGES = 3;
const MAX_BASE64_SIZE = 6 * 1024 * 1024; // ~4MB file → ~5.3MB base64, cap at 6MB
const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

// Magic bytes for file type verification
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header
};

function verifyMagicBytes(base64: string, claimedMime: string): boolean {
  const signatures = MAGIC_BYTES[claimedMime];
  if (!signatures) return false;

  try {
    // Decode first 16 bytes
    const binaryStr = atob(base64.slice(0, 24));
    const bytes = Array.from(binaryStr, (c) => c.charCodeAt(0));

    return signatures.some((sig) =>
      sig.every((byte, i) => bytes[i] === byte)
    );
  } catch {
    return false;
  }
}

interface RefImageInput {
  base64: string;
  mimeType: string;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, style, premium, referenceImages } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "프롬프트를 입력해주세요." },
        { status: 400 }
      );
    }

    // ── Validate reference images ──
    const validatedImages: RefImageInput[] = [];

    if (referenceImages && Array.isArray(referenceImages)) {
      if (referenceImages.length > MAX_IMAGES) {
        return NextResponse.json(
          { error: `레퍼런스 이미지는 최대 ${MAX_IMAGES}장까지 가능해요.` },
          { status: 400 }
        );
      }

      for (const img of referenceImages) {
        // Type check
        if (!img || typeof img.base64 !== "string" || typeof img.mimeType !== "string") {
          return NextResponse.json(
            { error: "잘못된 이미지 데이터입니다." },
            { status: 400 }
          );
        }

        // MIME type whitelist
        if (!ALLOWED_MIME_TYPES.has(img.mimeType)) {
          return NextResponse.json(
            { error: "PNG, JPEG, WebP 이미지만 지원해요." },
            { status: 400 }
          );
        }

        // Size check (base64 string length)
        if (img.base64.length > MAX_BASE64_SIZE) {
          return NextResponse.json(
            { error: "이미지 크기는 4MB 이하만 가능해요." },
            { status: 400 }
          );
        }

        // Base64 format validation (only safe characters)
        if (!/^[A-Za-z0-9+/=]+$/.test(img.base64)) {
          return NextResponse.json(
            { error: "잘못된 이미지 데이터입니다." },
            { status: 400 }
          );
        }

        // Magic bytes verification — actual file content must match claimed MIME
        if (!verifyMagicBytes(img.base64, img.mimeType)) {
          return NextResponse.json(
            { error: "이미지 파일 형식이 올바르지 않아요." },
            { status: 400 }
          );
        }

        validatedImages.push({ base64: img.base64, mimeType: img.mimeType });
      }
    }

    // ── Build prompt ──
    let fullPrompt = prompt;
    const preset = style
      ? STYLE_PRESETS.find((p) => p.id === style || p.label === style)
      : null;

    if (preset) {
      fullPrompt = `${preset.prompt_hint}. ${prompt}`;
    }

    fullPrompt = `고품질 일러스트레이션으로 그려주세요. ${fullPrompt}. 디테일하고 아름다운 아트워크, 깔끔한 배경.`;

    if (validatedImages.length > 0) {
      fullPrompt = `첨부된 레퍼런스 이미지의 스타일, 분위기, 색감을 참고하여 새로운 이미지를 생성해주세요. ${fullPrompt}`;
    }

    // ── Build Gemini content parts ──
    type ContentPart =
      | { inlineData: { data: string; mimeType: string } }
      | { text: string };

    const parts: ContentPart[] = [];

    // Add reference images first
    for (const img of validatedImages) {
      parts.push({
        inlineData: {
          data: img.base64,
          mimeType: img.mimeType,
        },
      });
    }

    // Add text prompt
    parts.push({ text: fullPrompt });

    // ── Call Gemini ──
    const response = await genai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [{ role: "user", parts }],
      config: {
        responseModalities: ["IMAGE", "TEXT"],
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: premium ? "2K" : "1K",
        },
      },
    });

    // ── Extract image data ──
    const responseParts = response.candidates?.[0]?.content?.parts;
    if (!responseParts) {
      return NextResponse.json(
        { error: "이미지 생성에 실패했습니다. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    let imageData: string | null = null;
    let mimeType: string = "image/png";

    for (const part of responseParts) {
      if (part.inlineData) {
        imageData = part.inlineData.data as string;
        mimeType = part.inlineData.mimeType || "image/png";
        break;
      }
    }

    if (!imageData) {
      return NextResponse.json(
        { error: "이미지를 생성할 수 없었습니다. 프롬프트를 수정해서 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // ── Style tags & brand recommendations ──
    const styleTags: string[] = [];
    if (preset) {
      styleTags.push(preset.label);
    }
    const keywords = ["지뢰계", "천사계", "양산형", "로리타", "고스로리", "페어리코어", "Y2K", "위시코어", "고딕", "다크로맨틱", "스위트", "페미닌"];
    for (const kw of keywords) {
      if (prompt.includes(kw) && !styleTags.includes(kw)) {
        styleTags.push(kw);
      }
    }

    const brands = getRecommendedBrands(styleTags);

    return NextResponse.json({
      image: `data:${mimeType};base64,${imageData}`,
      style_tags: styleTags,
      brands: brands.slice(0, 6).map((b) => ({
        id: b.id,
        name: b.name,
        nameJa: b.nameJa,
        storeUrl: b.storeUrl,
        description: b.description,
        priceRange: b.priceRange,
        styles: b.styles,
      })),
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "이미지 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

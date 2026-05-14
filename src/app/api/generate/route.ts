import { NextRequest, NextResponse } from "next/server";
import { toFile } from "openai";
import { genai } from "@/lib/gemini";
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";
import {
  deductCredits,
  refundCredits,
  getGenerateCost,
  QUALITIES,
  MAX_COUNT,
  type Quality,
} from "@/lib/credits";
import { assertSameOrigin, isSafeFetchUrl } from "@/lib/api-guard";
import { createSSEStream } from "@/lib/sse";
import { logger, reportServerError } from "@/lib/logger";
import {
  ASPECT_RATIOS,
  IMAGE_MODELS,
  openAIImageSizeForAspectRatio,
  supportsImageQuality,
  unsupportedQualityMessage,
  type AspectRatio,
  type ImageModelChoice,
} from "@/lib/image-models";
import {
  buildGptImage2EditRequest,
  buildGptImage2GenerateRequest,
} from "@/lib/openai-image-requests";
import { normalizeImageToAspectQuality } from "@/lib/image-output";

type ModelChoice = ImageModelChoice;

export const maxDuration = 360;

const MAX_REF_IMAGES = 3;
const MAX_BASE64_SIZE = 6 * 1024 * 1024;
const MODEL_TIMEOUT_MS = 300_000;
const HEARTBEAT_MS = 15_000;
const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const modelLog = logger.child({ route: "generate.model" });

const MAGIC_BYTES: Record<string, number[][]> = {
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
};

function extensionForMime(mimeType: string): "png" | "jpg" | "webp" {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

function verifyMagicBytes(base64: string, claimedMime: string): boolean {
  const signatures = MAGIC_BYTES[claimedMime];
  if (!signatures) return false;
  try {
    const binaryStr = atob(base64.slice(0, 24));
    const bytes = Array.from(binaryStr, (c) => c.charCodeAt(0));
    return signatures.some((sig) => sig.every((byte, i) => bytes[i] === byte));
  } catch {
    return false;
  }
}

interface RefImageInput {
  base64: string;
  mimeType: string;
}

function validateRefImages(input: unknown): RefImageInput[] | { error: string } {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) return { error: "잘못된 이미지 데이터입니다." };
  if (input.length > MAX_REF_IMAGES) {
    return { error: `레퍼런스 이미지는 최대 ${MAX_REF_IMAGES}장까지 가능해요.` };
  }
  const out: RefImageInput[] = [];
  for (const img of input) {
    if (!img || typeof img.base64 !== "string" || typeof img.mimeType !== "string") {
      return { error: "잘못된 이미지 데이터입니다." };
    }
    if (!ALLOWED_MIME_TYPES.has(img.mimeType)) {
      return { error: "PNG, JPEG, WebP 이미지만 지원해요." };
    }
    if (img.base64.length > MAX_BASE64_SIZE) {
      return { error: "이미지 크기는 4MB 이하만 가능해요." };
    }
    if (!/^[A-Za-z0-9+/=]+$/.test(img.base64)) {
      return { error: "잘못된 이미지 데이터입니다." };
    }
    if (!verifyMagicBytes(img.base64, img.mimeType)) {
      return { error: "이미지 파일 형식이 올바르지 않아요." };
    }
    out.push({ base64: img.base64, mimeType: img.mimeType });
  }
  return out;
}

type CallResult = { ok: true; image: string } | { ok: false; error: string };

async function callOpenAIOnce(args: {
  fullPrompt: string;
  refs: RefImageInput[];
  quality: Quality;
  aspectRatio: AspectRatio;
}): Promise<CallResult> {
  // gpt-image-2 accepts a constrained size contract here; app quality controls post-processing.
  const size = openAIImageSizeForAspectRatio(args.aspectRatio);
  try {
    let r;
    if (args.refs.length > 0) {
      const files = await Promise.all(
        args.refs.map((ref, i) =>
          toFile(
            Buffer.from(ref.base64, "base64"),
            `ref-${i}.${extensionForMime(ref.mimeType)}`,
            { type: ref.mimeType }
          )
        )
      );
      r = await openai.images.edit(
        buildGptImage2EditRequest({
          image: files.length === 1 ? files[0] : files,
          prompt: args.fullPrompt,
          size,
        }),
        {
          timeout: MODEL_TIMEOUT_MS,
          maxRetries: 0,
        }
      );
    } else {
      r = await openai.images.generate(
        buildGptImage2GenerateRequest({
          prompt: args.fullPrompt,
          size,
        }),
        {
          timeout: MODEL_TIMEOUT_MS,
          maxRetries: 0,
        }
      );
    }
    const b64 = r.data?.[0]?.b64_json;
    if (b64) {
      const image = await normalizeImageToAspectQuality(
        `data:image/png;base64,${b64}`,
        args.aspectRatio,
        args.quality
      );
      return { ok: true, image };
    }
    const url = r.data?.[0]?.url;
    if (url && isSafeFetchUrl(url)) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 30_000);
      try {
        const resp = await fetch(url, { signal: ctrl.signal });
        const buf = Buffer.from(await resp.arrayBuffer());
        const image = await normalizeImageToAspectQuality(
          `data:image/png;base64,${buf.toString("base64")}`,
          args.aspectRatio,
          args.quality
        );
        return { ok: true, image };
      } finally {
        clearTimeout(timer);
      }
    }
    return { ok: false, error: "OpenAI: 이미지 응답 없음" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    modelLog.warn("openai images error", { msg });
    return { ok: false, error: `OpenAI: ${msg}` };
  }
}

async function callGeminiOnce(args: {
  fullPrompt: string;
  refs: RefImageInput[];
  quality: Quality;
  aspectRatio: AspectRatio;
}): Promise<CallResult> {
  type ContentPart =
    | { inlineData: { data: string; mimeType: string } }
    | { text: string };
  try {
    const parts: ContentPart[] = [];
    for (const img of args.refs) {
      parts.push({ inlineData: { data: img.base64, mimeType: img.mimeType } });
    }
    parts.push({ text: args.fullPrompt });

    const response = await genai.models.generateContent({
      model: process.env.NANO_BANANA_MODEL || "gemini-3-pro-image-preview",
      contents: [{ role: "user", parts }],
      config: {
        httpOptions: {
          timeout: MODEL_TIMEOUT_MS,
          retryOptions: { attempts: 2 },
        },
        responseModalities: ["IMAGE", "TEXT"],
        imageConfig: { aspectRatio: args.aspectRatio, imageSize: args.quality },
      },
    });

    const responseParts = response.candidates?.[0]?.content?.parts;
    if (!responseParts) return { ok: false, error: "Gemini: 응답이 비어있음" };
    for (const part of responseParts) {
      if (part.inlineData) {
        const data = part.inlineData.data as string;
        const mime = part.inlineData.mimeType || "image/png";
        return { ok: true, image: `data:${mime};base64,${data}` };
      }
    }
    return { ok: false, error: "Gemini: 이미지 파트 없음" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    modelLog.warn("gemini images error", { msg });
    return { ok: false, error: `Gemini: ${msg}` };
  }
}

export async function POST(request: NextRequest) {
  // ── 1. Validate (returns JSON early on failure) ──
  const blocked = assertSameOrigin(request);
  if (blocked) return blocked;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
  }

  const rawModel = body.model;
  const rawQuality = body.quality;
  const rawCount = body.count;
  const rawAspectRatio = body.aspectRatio;
  const referenceImages = body.referenceImages;
  const prompt = body.prompt;
  const model: ModelChoice = IMAGE_MODELS.includes(rawModel as ModelChoice)
    ? (rawModel as ModelChoice)
    : "gpt-image-2";

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "프롬프트를 입력해주세요." }, { status: 400 });
  }

  const quality: Quality = QUALITIES.includes(rawQuality as Quality)
    ? (rawQuality as Quality)
    : "1K";
  const count = Math.max(1, Math.min(MAX_COUNT, Number(rawCount) || 1));
  const aspectRatio: AspectRatio = ASPECT_RATIOS.includes(rawAspectRatio as AspectRatio)
    ? (rawAspectRatio as AspectRatio)
    : "1:1";
  if (!supportsImageQuality(model, quality)) {
    return NextResponse.json(
      { error: unsupportedQualityMessage(model, quality), code: "unsupported_quality" },
      { status: 400 }
    );
  }

  const refResult = validateRefImages(referenceImages);
  if (!Array.isArray(refResult)) {
    return NextResponse.json({ error: refResult.error }, { status: 400 });
  }

  const cost = await getGenerateCost(quality, count);
  const idempotencyKey = request.headers.get("idempotency-key")?.slice(0, 100) || null;
  const deduct = await deductCredits({
    userId: user.id,
    cost,
    reason: "generate",
    meta: { quality, count, model, aspectRatio },
    idempotencyKey,
  });
  if (!deduct.ok) {
    if (deduct.reason === "insufficient") {
      return NextResponse.json(
        { error: `크레딧이 부족해요. (필요: ${cost})`, code: "insufficient_credits" },
        { status: 402 }
      );
    }
    return NextResponse.json({ error: "크레딧 처리 중 오류" }, { status: 500 });
  }

  const fullPrompt =
    refResult.length > 0
      ? `Use the attached reference images as style and mood guidance. Create the output in a ${aspectRatio} aspect ratio. ${prompt.trim()}. Detailed and beautiful artwork.`
      : `Create the output in a ${aspectRatio} aspect ratio. ${prompt.trim()}. Detailed and beautiful artwork.`;

  // ── 2. Open SSE stream ──
  const sse = createSSEStream();
  const startTime = Date.now();
  const log = logger.child({
    route: "generate.POST",
    userId: user.id,
    model,
    quality,
    count,
    aspectRatio,
    refCount: refResult.length,
  });
  log.info("image generation queued", { cost });

  // 비동기로 작업 실행 — 클라이언트에 즉시 stream 반환
  (async () => {
    const heartbeat = setInterval(() => {
      sse.send("heartbeat", { t: Date.now() });
    }, HEARTBEAT_MS);
    try {
      sse.send("stage", {
        stage: "started",
        total: count,
        model,
        quality,
        aspectRatio,
        cost,
        message: `${count}장 생성 준비 중`,
      });

      const images: string[] = [];
      const errors: string[] = [];

      const tasks = Array.from({ length: count }, (_, idx) => {
        sse.send("stage", { stage: "calling", index: idx, message: "이미지 모델 처리 중" });
        const imageStartTime = Date.now();
        const promise =
          model === "gpt-image-2"
            ? callOpenAIOnce({
                fullPrompt,
                refs: refResult,
                quality,
                aspectRatio,
              })
            : callGeminiOnce({ fullPrompt, refs: refResult, quality, aspectRatio });
        // 각 이미지 완료 즉시 SSE로 push — progress bar 실시간 갱신
        return promise
          .then((res) => {
            const elapsedMs = Date.now() - imageStartTime;
            if (res.ok) {
              images.push(res.image);
              log.info("image generation item completed", {
                index: idx,
                elapsedMs,
                outputBytes: res.image.length,
              });
              sse.send("image", { index: idx, image: res.image });
            } else {
              errors.push(res.error);
              log.warn("image generation item failed", {
                index: idx,
                elapsedMs,
                error: res.error,
              });
              sse.send("image_failed", { index: idx, error: res.error });
            }
          })
          .catch((e) => {
            const msg = e instanceof Error ? e.message : String(e);
            errors.push(msg);
            log.warn("image generation item errored", {
              index: idx,
              elapsedMs: Date.now() - imageStartTime,
              error: msg,
            });
            sse.send("image_failed", { index: idx, error: msg });
          });
      });

      await Promise.allSettled(tasks);

      if (images.length === 0) {
        await refundCredits(deduct.ledgerId);
        log.warn("image generation refunded after all failures", {
          elapsedMs: Date.now() - startTime,
          errors,
        });
        sse.send("error", {
          message: `이미지 생성에 실패했어요.${errors[0] ? ` (${errors[0]})` : ""}`,
          errors,
        });
      } else {
        log.info("image generation completed", {
          elapsedMs: Date.now() - startTime,
          succeeded: images.length,
          failed: errors.length,
        });
        sse.send("done", {
          count: images.length,
          requested: count,
          errors,
          model,
          quality,
          aspectRatio,
          cost,
          elapsedMs: Date.now() - startTime,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      reportServerError({ route: "generate.POST", error: e, userId: user.id });
      try {
        await refundCredits(deduct.ledgerId);
      } catch {}
      sse.send("error", { message: `서버 오류: ${msg}` });
    } finally {
      clearInterval(heartbeat);
      sse.close();
    }
  })();

  return sse.response();
}

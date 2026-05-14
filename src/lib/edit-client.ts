import { toFile } from "openai";
import { genai } from "./gemini";
import { openai } from "./openai";
import type { ImageRef, EditRequest } from "./marker-protocol";
import { renderMask, renderAlphaMask } from "./marker-renderer";
import { buildMarkerPrompt } from "./marker-prompt";
import { logger } from "./logger";
import {
  closestAspectRatioForDimensions,
  openAIEditSizeForDimensions,
  supportsImageQuality,
  unsupportedQualityMessage,
  type AspectRatio,
} from "./image-models";
import { buildGptImage2EditRequest } from "./openai-image-requests";
import { normalizeImageToSourceAspectQuality } from "./image-output";
import sharp from "sharp";

type ContentPart =
  | { inlineData: { data: string; mimeType: string } }
  | { text: string };

const EDIT_MODEL = process.env.NANO_BANANA_MODEL || "gemini-3-pro-image-preview";
const MODEL_TIMEOUT_MS = 300_000;
const log = logger.child({ module: "edit-client" });

function extensionForMime(mimeType: string): "png" | "jpg" | "webp" {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

async function normalizeImageRefToPng(
  ref: ImageRef
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const { data, info } = await sharp(Buffer.from(ref.base64, "base64"))
    .rotate()
    .ensureAlpha()
    .png()
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

async function normalizeReferenceToOpenAICanvas(
  ref: ImageRef,
  width: number,
  height: number
): Promise<Buffer> {
  return await sharp(Buffer.from(ref.base64, "base64"))
    .rotate()
    .resize(width, height, {
      fit: "contain",
      position: "center",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .ensureAlpha()
    .png()
    .toBuffer();
}

async function callGeminiOnce(
  parts: ContentPart[],
  quality: EditRequest["quality"],
  aspectRatio: AspectRatio
): Promise<{ ok: true; image: string } | { ok: false; error: string }> {
  try {
    const response = await genai.models.generateContent({
      model: EDIT_MODEL,
      contents: [{ role: "user", parts }],
      config: {
        httpOptions: {
          timeout: MODEL_TIMEOUT_MS,
          retryOptions: { attempts: 2 },
        },
        responseModalities: ["IMAGE", "TEXT"],
        imageConfig: { aspectRatio, imageSize: quality },
      },
    });
    const responseParts = response.candidates?.[0]?.content?.parts;
    if (!responseParts) return { ok: false, error: "Gemini: 응답이 비어있음" };
    for (const p of responseParts) {
      if (p.inlineData) {
        const data = p.inlineData.data as string;
        const mime = p.inlineData.mimeType || "image/png";
        return { ok: true, image: `data:${mime};base64,${data}` };
      }
    }
    return { ok: false, error: "Gemini: 이미지 파트 없음" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.warn("Gemini edit error", { msg });
    return { ok: false, error: `Gemini: ${msg}` };
  }
}

async function callOpenAIOnce(args: {
  basePng: Buffer;
  references: ImageRef[];
  maskBuf: Buffer | null;
  prompt: string;
  quality: EditRequest["quality"];
  width: number;
  height: number;
}): Promise<{ ok: true; image: string } | { ok: false; error: string }> {
  if (!supportsImageQuality("gpt-image-2", args.quality)) {
    return { ok: false, error: unsupportedQualityMessage("gpt-image-2", args.quality) };
  }
  const size = openAIEditSizeForDimensions(args.width, args.height);
  try {
    const baseFile = await toFile(args.basePng, "base.png", { type: "image/png" });
    const maskFile = args.maskBuf
      ? await toFile(args.maskBuf, "mask.png", { type: "image/png" })
      : undefined;
    const referenceFiles = await Promise.all(
      args.references.map(async (ref, idx) => {
        const buffer = args.maskBuf
          ? await normalizeReferenceToOpenAICanvas(ref, args.width, args.height)
          : Buffer.from(ref.base64, "base64");
        const filename = args.maskBuf
          ? `reference-${idx + 1}.png`
          : `reference-${idx + 1}.${extensionForMime(ref.mimeType)}`;
        const type = args.maskBuf ? "image/png" : ref.mimeType;
        return toFile(buffer, filename, { type });
      })
    );
    const r = await openai.images.edit(
      buildGptImage2EditRequest({
        image: referenceFiles.length > 0 ? [baseFile, ...referenceFiles] : baseFile,
        mask: maskFile,
        prompt: args.prompt,
        size,
      }),
      {
        timeout: MODEL_TIMEOUT_MS,
        maxRetries: 0,
      }
    );
    const b64 = r.data?.[0]?.b64_json;
    if (b64) {
      const image = await normalizeImageToSourceAspectQuality(
        `data:image/png;base64,${b64}`,
        args.width,
        args.height,
        args.quality
      );
      return { ok: true, image };
    }
    return { ok: false, error: "OpenAI: 이미지 응답 없음" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.warn("OpenAI edit error", { msg });
    return { ok: false, error: `OpenAI: ${msg}` };
  }
}

interface RunOptions {
  /** 각 결과 도착 시점에 호출. SSE에서 progressive emit용. */
  onResult?: (idx: number, res: { ok: true; image: string } | { ok: false; error: string }) => void;
  /** 최초 모델 호출 직전 호출 — "calling" 단계 알림. */
  onStart?: (idx: number) => void;
}

/**
 * Run N parallel marker-based edits. 각 호출이 완료되는 즉시 onResult 콜백 호출.
 */
export async function runMarkerEdit(
  req: EditRequest,
  opts: RunOptions = {}
): Promise<{ images: string[]; errors: string[] }> {
  const baseBuf = Buffer.from(req.base.base64, "base64");
  const meta = await sharp(baseBuf).metadata();
  const width = meta.width ?? 1024;
  const height = meta.height ?? 1024;

  const hasMarkers = req.markers.length > 0;
  const aspectRatio = closestAspectRatioForDimensions(width, height);

  const inputMode = req.model === "gpt-image-2" ? "openai" : "gemini";

  // 호출 함수 fix
  let callOne: () => Promise<{ ok: true; image: string } | { ok: false; error: string }>;

  if (req.model === "gpt-image-2") {
    const baseImage = await normalizeImageRefToPng(req.base);
    const openAIPrompt = buildMarkerPrompt({
      markers: req.markers,
      width: baseImage.width,
      height: baseImage.height,
      refCount: req.references.length,
      globalAdjust: req.globalAdjust,
      inputMode,
    });
    const maskBuf = hasMarkers
      ? await renderAlphaMask(baseImage.width, baseImage.height, req.markers)
      : null;
    callOne = () =>
      callOpenAIOnce({
        basePng: baseImage.buffer,
        references: req.references,
        maskBuf,
        prompt: openAIPrompt,
        quality: req.quality,
        width: baseImage.width,
        height: baseImage.height,
      });
  } else {
    const prompt = buildMarkerPrompt({
      markers: req.markers,
      width,
      height,
      refCount: req.references.length,
      globalAdjust: req.globalAdjust,
      inputMode,
    });
    const baseParts: ContentPart[] = [
      { inlineData: { data: req.base.base64, mimeType: req.base.mimeType } },
    ];
    if (hasMarkers) {
      const maskBuf = await renderMask(width, height, req.markers);
      baseParts.push({
        inlineData: { data: maskBuf.toString("base64"), mimeType: "image/png" },
      });
    }
    for (const r of req.references as ImageRef[]) {
      baseParts.push({ inlineData: { data: r.base64, mimeType: r.mimeType } });
    }
    baseParts.push({ text: prompt });

    callOne = () => callGeminiOnce(baseParts, req.quality, aspectRatio);
  }

  const images: string[] = [];
  const errors: string[] = [];

  await Promise.allSettled(
    Array.from({ length: req.count }, async (_, idx) => {
      opts.onStart?.(idx);
      try {
        const res = await callOne();
        if (res.ok) images.push(res.image);
        else errors.push(res.error);
        opts.onResult?.(idx, res);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(msg);
        opts.onResult?.(idx, { ok: false, error: msg });
      }
    })
  );

  return { images, errors };
}

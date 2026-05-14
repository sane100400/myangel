import sharp from "sharp";
import {
  outputDimensionsForAspectRatio,
  type AspectRatio,
  type ImageQuality,
} from "./image-models";

const DATA_URL_RE = /^data:image\/(?:png|jpeg|webp);base64,(.+)$/;
const QUALITY_LONG_EDGE: Record<ImageQuality, number> = {
  "1K": 1024,
  "2K": 2048,
  "4K": 4096,
};

function dataUrlToBuffer(dataUrl: string): Buffer {
  const match = DATA_URL_RE.exec(dataUrl);
  if (!match) throw new Error("Invalid image data URL");
  return Buffer.from(match[1], "base64");
}

async function resizeToPngDataUrl(
  dataUrl: string,
  width: number,
  height: number
): Promise<string> {
  const buffer = dataUrlToBuffer(dataUrl);
  const normalized = await sharp(buffer)
    .rotate()
    .resize(width, height, {
      fit: "cover",
      position: "center",
    })
    .png()
    .toBuffer();
  return `data:image/png;base64,${normalized.toString("base64")}`;
}

export async function normalizeImageToAspectQuality(
  dataUrl: string,
  aspectRatio: AspectRatio,
  quality: ImageQuality
): Promise<string> {
  const { width, height } = outputDimensionsForAspectRatio(aspectRatio, quality);
  return resizeToPngDataUrl(dataUrl, width, height);
}

export async function normalizeImageToDimensions(
  dataUrl: string,
  width: number,
  height: number
): Promise<string> {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  return resizeToPngDataUrl(dataUrl, safeWidth, safeHeight);
}

export async function normalizeImageToSourceAspectQuality(
  dataUrl: string,
  sourceWidth: number,
  sourceHeight: number,
  quality: ImageQuality
): Promise<string> {
  const safeWidth = Number.isFinite(sourceWidth) && sourceWidth > 0 ? sourceWidth : 1024;
  const safeHeight = Number.isFinite(sourceHeight) && sourceHeight > 0 ? sourceHeight : 1024;
  const longEdge = QUALITY_LONG_EDGE[quality];
  if (safeWidth >= safeHeight) {
    return resizeToPngDataUrl(
      dataUrl,
      longEdge,
      Math.max(1, Math.round((longEdge * safeHeight) / safeWidth))
    );
  }

  return resizeToPngDataUrl(
    dataUrl,
    Math.max(1, Math.round((longEdge * safeWidth) / safeHeight)),
    longEdge
  );
}

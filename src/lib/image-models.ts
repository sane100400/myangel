export type ImageQuality = "1K" | "2K" | "4K";
export type ImageModelChoice = "nano-banana-pro" | "gpt-image-2";
export type AspectRatio = "1:1" | "4:3" | "3:4" | "16:9" | "9:16";

export const IMAGE_MODELS: ImageModelChoice[] = ["nano-banana-pro", "gpt-image-2"];
export const IMAGE_QUALITIES: ImageQuality[] = ["1K", "2K", "4K"];
export const ASPECT_RATIOS: AspectRatio[] = ["1:1", "4:3", "3:4", "16:9", "9:16"];
export const ASPECT_RATIO_VALUES: Record<AspectRatio, number> = {
  "1:1": 1,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
};

const MODEL_QUALITY_SUPPORT: Record<ImageModelChoice, readonly ImageQuality[]> = {
  "nano-banana-pro": ["1K", "2K", "4K"],
  // This app's picker represents output dimensions, not OpenAI's low/medium/high API quality.
  "gpt-image-2": ["1K", "2K"],
};

const QUALITY_LONG_EDGE: Record<ImageQuality, number> = {
  "1K": 1024,
  "2K": 2048,
  "4K": 4096,
};

export function supportsImageQuality(
  model: ImageModelChoice,
  quality: ImageQuality
): boolean {
  return MODEL_QUALITY_SUPPORT[model].includes(quality);
}

export function normalizeImageQualityForModel(
  model: ImageModelChoice,
  quality: ImageQuality
): ImageQuality {
  if (supportsImageQuality(model, quality)) return quality;
  return MODEL_QUALITY_SUPPORT[model][MODEL_QUALITY_SUPPORT[model].length - 1] ?? "1K";
}

export function unsupportedQualityMessage(
  model: ImageModelChoice,
  quality: ImageQuality
): string {
  if (model === "gpt-image-2" && quality === "4K") {
    return "GPT Image 2는 4K 출력 크기를 지원하지 않아요. GPT Image 2는 1K 또는 2K로 생성·편집할 수 있어요.";
  }
  return "선택한 모델과 화질 조합을 지원하지 않아요.";
}

export type OpenAIImageSize = "1024x1024" | "1536x1024" | "1024x1536";

export function openAIImageSizeForAspectRatio(aspectRatio: AspectRatio): OpenAIImageSize {
  if (aspectRatio === "3:4" || aspectRatio === "9:16") return "1024x1536";
  if (aspectRatio === "4:3" || aspectRatio === "16:9") return "1536x1024";
  return "1024x1024";
}

export function openAIEditSizeForDimensions(width: number, height: number): OpenAIImageSize {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 1024;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 1024;
  const ratio = safeWidth / safeHeight;
  if (ratio >= 1.2) return "1536x1024";
  if (ratio <= 0.83) return "1024x1536";
  return "1024x1024";
}

export function outputDimensionsForAspectRatio(
  aspectRatio: AspectRatio,
  quality: ImageQuality
): { width: number; height: number } {
  const longEdge = QUALITY_LONG_EDGE[quality];
  const ratio = ASPECT_RATIO_VALUES[aspectRatio];

  if (ratio >= 1) {
    return {
      width: longEdge,
      height: Math.max(1, Math.round(longEdge / ratio)),
    };
  }

  return {
    width: Math.max(1, Math.round(longEdge * ratio)),
    height: longEdge,
  };
}

export function closestAspectRatioForDimensions(width: number, height: number): AspectRatio {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 1024;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 1024;
  const ratio = safeWidth / safeHeight;

  return ASPECT_RATIOS.reduce((best, candidate) => {
    const bestDistance = Math.abs(Math.log(ratio / ASPECT_RATIO_VALUES[best]));
    const candidateDistance = Math.abs(Math.log(ratio / ASPECT_RATIO_VALUES[candidate]));
    return candidateDistance < bestDistance ? candidate : best;
  }, "1:1" as AspectRatio);
}

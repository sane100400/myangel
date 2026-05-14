import { describe, expect, it } from "vitest";
import {
  closestAspectRatioForDimensions,
  normalizeImageQualityForModel,
  openAIEditSizeForDimensions,
  openAIImageSizeForAspectRatio,
  outputDimensionsForAspectRatio,
  supportsImageQuality,
  unsupportedQualityMessage,
} from "./image-models";

describe("image model quality support", () => {
  it("keeps true 4K generation on Nano Banana Pro only", () => {
    expect(supportsImageQuality("nano-banana-pro", "4K")).toBe(true);
    expect(supportsImageQuality("gpt-image-2", "4K")).toBe(false);
    expect(normalizeImageQualityForModel("gpt-image-2", "4K")).toBe("2K");
    expect(unsupportedQualityMessage("gpt-image-2", "4K")).toMatch(/4K/);
  });

  it("maps OpenAI generation sizes only to API-supported dimensions", () => {
    expect(openAIImageSizeForAspectRatio("1:1")).toBe("1024x1024");
    expect(openAIImageSizeForAspectRatio("16:9")).toBe("1536x1024");
    expect(openAIImageSizeForAspectRatio("9:16")).toBe("1024x1536");
  });

  it("maps OpenAI edit sizes only to API-supported dimensions", () => {
    expect(openAIEditSizeForDimensions(4096, 4096)).toBe("1024x1024");
    expect(openAIEditSizeForDimensions(4096, 2304)).toBe("1536x1024");
    expect(openAIEditSizeForDimensions(2304, 4096)).toBe("1024x1536");
  });

  it("maps source dimensions to the closest Gemini aspect ratio", () => {
    expect(closestAspectRatioForDimensions(1024, 1024)).toBe("1:1");
    expect(closestAspectRatioForDimensions(1600, 900)).toBe("16:9");
    expect(closestAspectRatioForDimensions(900, 1600)).toBe("9:16");
    expect(closestAspectRatioForDimensions(1200, 900)).toBe("4:3");
    expect(closestAspectRatioForDimensions(900, 1200)).toBe("3:4");
  });

  it("computes exact app output dimensions for quality and aspect choices", () => {
    expect(outputDimensionsForAspectRatio("16:9", "2K")).toEqual({
      width: 2048,
      height: 1152,
    });
    expect(outputDimensionsForAspectRatio("4:3", "2K")).toEqual({
      width: 2048,
      height: 1536,
    });
    expect(outputDimensionsForAspectRatio("9:16", "2K")).toEqual({
      width: 1152,
      height: 2048,
    });
    expect(outputDimensionsForAspectRatio("1:1", "4K")).toEqual({
      width: 4096,
      height: 4096,
    });
  });
});

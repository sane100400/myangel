import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  normalizeImageToAspectQuality,
  normalizeImageToDimensions,
  normalizeImageToSourceAspectQuality,
} from "./image-output";

async function makeDataUrl(width: number, height: number): Promise<string> {
  const buf = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 120, g: 80, b: 200 },
    },
  })
    .png()
    .toBuffer();
  return `data:image/png;base64,${buf.toString("base64")}`;
}

async function readSize(dataUrl: string): Promise<{ width: number; height: number }> {
  const base64 = dataUrl.split(",")[1] ?? "";
  const meta = await sharp(Buffer.from(base64, "base64")).metadata();
  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
  };
}

describe("image output normalization", () => {
  it("normalizes OpenAI landscape output to the selected 16:9 2K canvas", async () => {
    const dataUrl = await makeDataUrl(1536, 1024);
    await expect(readSize(await normalizeImageToAspectQuality(dataUrl, "16:9", "2K"))).resolves.toEqual({
      width: 2048,
      height: 1152,
    });
  });

  it("normalizes edited images back to the source canvas dimensions", async () => {
    const dataUrl = await makeDataUrl(1024, 1024);
    await expect(readSize(await normalizeImageToDimensions(dataUrl, 2048, 1152))).resolves.toEqual({
      width: 2048,
      height: 1152,
    });
  });

  it("normalizes edited images to the selected quality while preserving source aspect", async () => {
    const dataUrl = await makeDataUrl(1024, 1024);
    await expect(
      readSize(await normalizeImageToSourceAspectQuality(dataUrl, 1920, 1080, "2K"))
    ).resolves.toEqual({
      width: 2048,
      height: 1152,
    });
  });
});

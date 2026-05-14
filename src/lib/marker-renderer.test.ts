import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { renderMask, renderAlphaMask } from "./marker-renderer";
import type { MarkerSpec } from "./marker-protocol";

const W = 256;
const H = 256;

function marker(op: MarkerSpec["op"], cx: number, cy: number, r: number): MarkerSpec {
  return { id: `m-${op}`, op, circle: { cx, cy, r } };
}

describe("renderMask (Gemini grayscale)", () => {
  it("encodes op codes as gray values: replace=255, add=128, remove=64, bg=0", async () => {
    const buf = await renderMask(W, H, [
      marker("replace", 0.2, 0.5, 0.04),
      marker("add", 0.6, 0.5, 0.04),
      marker("remove", 0.8, 0.5, 0.04),
    ]);
    const meta = await sharp(buf).metadata();
    expect(meta.format).toBe("png");
    expect(meta.width).toBe(W);
    expect(meta.height).toBe(H);

    const { data } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
    // 코너 픽셀은 검은색(0)
    expect(data[0]).toBe(0);
    // 각 마커 중심에서 op 코드값 확인 (그레이스케일이라 RGB 동일)
    const sample = (xn: number, yn: number) => {
      const x = Math.floor(xn * W);
      const y = Math.floor(yn * H);
      return data[(y * W + x) * 1]; // grayscale 1 ch
    };
    // sharp grayscale().png()은 채널이 어떻게 저장되느냐에 따라 채널수 달라짐 — 한번 더 확인
    const meta2 = await sharp(buf).metadata();
    if (meta2.channels === 1) {
      expect(sample(0.2, 0.5)).toBeGreaterThan(200); // ~255
      expect(sample(0.6, 0.5)).toBeGreaterThan(100); // ~128
      expect(sample(0.6, 0.5)).toBeLessThan(160);
      expect(sample(0.8, 0.5)).toBeGreaterThan(40);  // ~64
      expect(sample(0.8, 0.5)).toBeLessThan(100);
    }
  });
});

describe("renderAlphaMask (OpenAI alpha)", () => {
  it("makes marker areas transparent (alpha=0), rest opaque (alpha=255)", async () => {
    const buf = await renderAlphaMask(W, H, [marker("replace", 0.5, 0.5, 0.1)]);
    const meta = await sharp(buf).metadata();
    expect(meta.format).toBe("png");
    expect(meta.hasAlpha).toBe(true);

    const { data, info } = await sharp(buf)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const ch = info.channels;
    expect(ch).toBe(4);

    const alphaAt = (xn: number, yn: number) => {
      const x = Math.floor(xn * W);
      const y = Math.floor(yn * H);
      return data[(y * W + x) * ch + 3];
    };
    // 코너: 보존 영역 → alpha 255
    expect(alphaAt(0.02, 0.02)).toBe(255);
    expect(alphaAt(0.98, 0.98)).toBe(255);
    // 중심: 마커 영역 → alpha 0
    expect(alphaAt(0.5, 0.5)).toBe(0);
  });

  it("handles zero markers (returns fully opaque mask)", async () => {
    const buf = await renderAlphaMask(W, H, []);
    const { data, info } = await sharp(buf)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    // 모든 픽셀 alpha=255
    let allOpaque = true;
    for (let i = info.channels - 1; i < data.length; i += info.channels) {
      if (data[i] !== 255) { allOpaque = false; break; }
    }
    expect(allOpaque).toBe(true);
  });
});

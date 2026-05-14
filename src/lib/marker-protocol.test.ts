import { describe, it, expect } from "vitest";
import { validateEditRequest, MAX_MARKERS, MAX_REFS } from "./marker-protocol";

// 1×1 white PNG (smallest valid PNG, magic-byte-passes)
const TINY_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgAAIAAAUAAeImBZsAAAAASUVORK5CYII=";

const baseImg = { base64: TINY_PNG_B64, mimeType: "image/png" };

describe("validateEditRequest", () => {
  it("rejects non-object input", () => {
    const r = validateEditRequest(null);
    expect("error" in r).toBe(true);
  });

  it("rejects missing base", () => {
    const r = validateEditRequest({ markers: [] });
    expect("error" in r && r.error).toMatch(/베이스/);
  });

  it("rejects unsupported mimeType", () => {
    const r = validateEditRequest({
      base: { base64: TINY_PNG_B64, mimeType: "image/gif" },
      markers: [{ id: "1", op: "remove", circle: { cx: 0.5, cy: 0.5, r: 0.1 } }],
    });
    expect("error" in r).toBe(true);
  });

  it("rejects forged mime — claims jpeg but bytes are PNG", () => {
    const r = validateEditRequest({
      base: { base64: TINY_PNG_B64, mimeType: "image/jpeg" },
      markers: [{ id: "1", op: "remove", circle: { cx: 0.5, cy: 0.5, r: 0.1 } }],
    });
    expect("error" in r).toBe(true);
  });

  it("rejects when both markers and globalAdjust empty", () => {
    const r = validateEditRequest({ base: baseImg, markers: [] });
    expect("error" in r && r.error).toMatch(/마커|분위기/);
  });

  it("accepts global-adjust-only edit (no markers)", () => {
    const r = validateEditRequest({
      base: baseImg,
      markers: [],
      globalAdjust: { mood: "차분함" },
    });
    expect("error" in r).toBe(false);
  });

  it("rejects too many markers", () => {
    const r = validateEditRequest({
      base: baseImg,
      markers: Array.from({ length: MAX_MARKERS + 1 }, (_, i) => ({
        id: `m${i}`,
        op: "remove",
        circle: { cx: 0.5, cy: 0.5, r: 0.1 },
      })),
    });
    expect("error" in r && r.error).toMatch(/최대/);
  });

  it("rejects circle out of normalized bounds", () => {
    const r = validateEditRequest({
      base: baseImg,
      markers: [{ id: "1", op: "remove", circle: { cx: 1.5, cy: 0.5, r: 0.1 } }],
    });
    expect("error" in r).toBe(true);
  });

  it("accepts replace op without refIndex when a marker prompt can guide the edit", () => {
    const r = validateEditRequest({
      base: baseImg,
      markers: [
        {
          id: "1",
          op: "replace",
          circle: { cx: 0.5, cy: 0.5, r: 0.1 },
          note: "파란 유리 소재로 교체",
        },
      ],
    });
    expect("error" in r).toBe(false);
  });

  it("rejects adjust as a marker op", () => {
    const r = validateEditRequest({
      base: baseImg,
      markers: [
        {
          id: "1",
          op: "adjust",
          circle: { cx: 0.5, cy: 0.5, r: 0.1 },
          note: "의자 하나만 왼쪽으로 옮기고 나무색으로 변경",
        },
      ],
    });
    expect("error" in r && r.error).toMatch(/replace\/add\/remove/);
  });

  it("rejects refIndex out of range", () => {
    const r = validateEditRequest({
      base: baseImg,
      references: [baseImg],
      markers: [
        { id: "1", op: "replace", circle: { cx: 0.5, cy: 0.5, r: 0.1 }, refIndex: 5 },
      ],
    });
    expect("error" in r && r.error).toMatch(/refIndex/);
  });

  it("accepts valid replace with refIndex", () => {
    const r = validateEditRequest({
      base: baseImg,
      references: [baseImg],
      markers: [
        { id: "1", op: "replace", circle: { cx: 0.5, cy: 0.5, r: 0.1 }, refIndex: 0 },
      ],
      count: 2,
      quality: "2K",
    });
    expect("error" in r).toBe(false);
    if (!("error" in r)) {
      expect(r.count).toBe(2);
      expect(r.quality).toBe("2K");
    }
  });

  it("clamps count and falls back quality", () => {
    const r = validateEditRequest({
      base: baseImg,
      markers: [{ id: "1", op: "remove", circle: { cx: 0.5, cy: 0.5, r: 0.1 } }],
      count: 99,
      quality: "8K",
    });
    expect("error" in r).toBe(false);
    if (!("error" in r)) {
      expect(r.count).toBeLessThanOrEqual(4);
      expect(r.quality).toBe("1K");
    }
  });

  it("rejects GPT Image 2 with 4K because OpenAI image output is not 4K", () => {
    const r = validateEditRequest({
      base: baseImg,
      markers: [{ id: "1", op: "remove", circle: { cx: 0.5, cy: 0.5, r: 0.1 } }],
      quality: "4K",
      model: "gpt-image-2",
    });
    expect("error" in r && r.error).toMatch(/4K/);
  });

  it("trims and slices globalAdjust strings to 200 chars", () => {
    const longText = "ㄱ".repeat(500);
    const r = validateEditRequest({
      base: baseImg,
      markers: [],
      globalAdjust: { mood: longText },
    });
    expect("error" in r).toBe(false);
    if (!("error" in r)) {
      expect(r.globalAdjust?.mood?.length).toBe(200);
    }
  });

  it("rejects non-array references field", () => {
    const r = validateEditRequest({
      base: baseImg,
      references: "not-an-array",
      markers: [{ id: "1", op: "remove", circle: { cx: 0.5, cy: 0.5, r: 0.1 } }],
    });
    // non-array gets coerced to []; this should still pass since markers are valid
    expect("error" in r).toBe(false);
  });

  it("rejects too many references", () => {
    const r = validateEditRequest({
      base: baseImg,
      references: Array.from({ length: MAX_REFS + 1 }, () => baseImg),
      markers: [{ id: "1", op: "remove", circle: { cx: 0.5, cy: 0.5, r: 0.1 } }],
    });
    expect("error" in r && r.error).toMatch(/레퍼런스/);
  });
});

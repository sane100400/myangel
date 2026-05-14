import { describe, expect, it } from "vitest";
import { buildImageTitle } from "./image-title";

describe("buildImageTitle", () => {
  it("uses the original prompt line from edited-image prompts", () => {
    expect(
      buildImageTitle("원본 프롬프트: 따뜻한 북카페 창가 자리\n편집 내용: 마커 편집: 1.교체", "공유 이미지")
    ).toBe("따뜻한 북카페 창가 자리");
  });

  it("removes generic style suffixes and keeps a compact title", () => {
    expect(buildImageTitle("blue product shot, detailed and beautiful artwork", "공유 이미지")).toBe(
      "blue product shot"
    );
  });

  it("falls back when no prompt text is available", () => {
    expect(buildImageTitle("", "공유 이미지")).toBe("공유 이미지");
  });
});

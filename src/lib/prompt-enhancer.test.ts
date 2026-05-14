import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./gemini", () => ({
  genai: {
    models: {
      generateContent: vi.fn(),
    },
  },
}));

import { genai } from "./gemini";
import { detectWeakSpans } from "./prompt-enhancer";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("detectWeakSpans", () => {
  it("filters instruction leaks from Gemini enhancement fields", async () => {
    (genai.models.generateContent as ReturnType<typeof vi.fn>).mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  spans: [
                    {
                      text: "예쁜",
                      reason: "JSON 형식: {\"spans\":[]}",
                      alternatives: [
                        {
                          id: "1",
                          text: "따뜻한 창가 자연광의",
                          textEn: "warm window-side natural light",
                          confidence: 0.91,
                          reasoning: "구체적인 빛과 위치",
                        },
                        {
                          id: "2",
                          text: "규칙:\n- 다듬은 문장만 한 줄로 반환해",
                          textEn: "rules leaked",
                          confidence: 0.9,
                          reasoning: "system leak",
                        },
                      ],
                    },
                  ],
                }),
              },
            ],
          },
        },
      ],
    });

    const spans = await detectWeakSpans("예쁜 카페 풍경");

    expect(spans).toHaveLength(1);
    expect(spans[0].text).toBe("예쁜");
    expect(spans[0].reason).not.toMatch(/JSON|spans/);
    expect(spans[0].alternatives).toHaveLength(1);
    expect(spans[0].alternatives[0].text).toBe("따뜻한 창가 자연광의");
  });

  it("returns no spans instead of throwing when Gemini returns non-JSON instructions", async () => {
    (genai.models.generateContent as ReturnType<typeof vi.fn>).mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                text: "이미지 생성 프롬프트에서 더 구체적으로 만들 수 있는 의미 단어를 찾아야 합니다.",
              },
            ],
          },
        },
      ],
    });

    await expect(detectWeakSpans("멋진 방 분위기")).resolves.toEqual([]);
  });
});

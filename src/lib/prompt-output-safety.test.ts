import { describe, expect, it } from "vitest";
import {
  containsPromptInstructionLeak,
  parseJsonFromModelText,
  sanitizeModelField,
  sanitizeRewrittenPrompt,
} from "./prompt-output-safety";

describe("prompt output safety", () => {
  it("detects leaked prompt instructions", () => {
    expect(containsPromptInstructionLeak("규칙:\n- 다듬은 문장만 한 줄로 반환해")).toBe(true);
    expect(containsPromptInstructionLeak("JSON 형식: {\"spans\":[]}")).toBe(true);
    expect(containsPromptInstructionLeak("따뜻한 창가 자연광의 카페")).toBe(false);
  });

  it("extracts JSON from fenced model output", () => {
    const parsed = parseJsonFromModelText(
      '응답입니다.\n```json\n{"spans":[{"text":"예쁜"}]}\n```'
    );

    expect(parsed).toEqual({ spans: [{ text: "예쁜" }] });
  });

  it("filters unsafe suggestion fields", () => {
    expect(sanitizeModelField("따뜻한 창가 자연광의 카페", 80)).toBe("따뜻한 창가 자연광의 카페");
    expect(sanitizeModelField("이미지 생성 프롬프트에서 더 구체적으로 만들 수 있는 표현", 80)).toBe("");
  });

  it("does not return leaked rewrite instructions to the prompt box", () => {
    const fallback = "따뜻한 창가 자연광의 카페";

    expect(sanitizeRewrittenPrompt("프롬프트: 부드러운 아침빛의 카페", fallback, 4000)).toBe(
      "부드러운 아침빛의 카페"
    );
    expect(
      sanitizeRewrittenPrompt("원본: 예쁜 카페\n규칙:\n- 다듬은 문장만 한 줄로 반환해", fallback, 4000)
    ).toBe(fallback);
  });
});

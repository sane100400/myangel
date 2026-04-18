import { genai } from "./gemini";
import type { SceneObject } from "@/types";
import { objectAttributesToFragments } from "./intensity-mapping";
import { composeFromSlots, buildAugmentationBriefing } from "./visual-augmentation";

function buildObjectDescription(obj: SceneObject): string {
  const fragments = objectAttributesToFragments(obj.attributes);
  return fragments.length > 0
    ? `${obj.description} (${fragments.join(", ")})`
    : obj.description;
}

/** LLM에 강도 의도를 추가로 전달 — dominant band는 강조 지시 포함 */
function buildIntensityHints(obj: SceneObject): string[] {
  return obj.attributes
    .filter((a) => a.value >= 81)
    .map((a) => `"${a.nameEn}" 속성은 장면의 지배적 특성으로 강조`);
}

const SYSTEM_PROMPT = `당신은 AI 이미지 생성 프롬프트를 최적화하는 전문가입니다.
주어진 장면 구성 요소를 3단계 Visual Augmentation Pipeline의 관점에서 조합합니다:
  1) 시각 슬롯(subject/style/medium/lighting/composition/quality)을 채웁니다.
  2) 비어있는 필수 슬롯에 기본 어휘가 이미 자동 주입되었습니다 (아래 "시각 슬롯 상태" 참조).
  3) 주어진 결정론적 슬롯 조립 결과를 기반으로 자연스러운 최종 프롬프트로 다듬습니다.

응답 형식 (JSON):
{
  "promptKo": "한국어 최종 프롬프트 (사용자가 읽기 쉬운 자연어)",
  "promptEn": "영어 최종 프롬프트 (이미지 생성 모델에 최적화된 형태)"
}

규칙:
1. promptEn은 슬롯 순서(subject → style → medium → lighting → composition → quality)를 따르세요.
2. 자동 주입된 기본 어휘는 유지하되, 중복되지 않게 자연스럽게 통합하세요.
3. 속성 강도(adverb)를 영어 수식어로 반영하세요.
4. promptKo는 사용자에게 보여줄 자연스러운 한국어 문장입니다.
5. 결정론적 조립 결과의 핵심 토큰을 빠뜨리지 마세요.`;

/**
 * 단어 치환 후 문장을 자연스럽게 다듬는 함수.
 * 원본 문장의 의도와 모든 구체화된 표현을 유지하면서 문맥을 매끄럽게 만든다.
 */
export async function rewriteNatural(
  original: string,
  modified: string
): Promise<string> {
  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `수정된 문장의 문맥을 자연스럽게 다듬어줘. 구체화된 표현은 모두 유지하고 조사/어순만 조정해. 문장만 반환해.

원본: "${original}"
수정: "${modified}"`,
          },
        ],
      },
    ],
    config: {
      temperature: 0.3,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) return modified;

  // Remove any quotes the model might add
  return text.replace(/^["'""'']+|["'""'']+$/g, "").trim();
}

export async function composePrompt(
  objects: SceneObject[],
  selectedAlternatives: Record<string, string>
): Promise<{ promptKo: string; promptEn: string }> {
  // Stage 1-3: deterministic slot-based assembly — runs first as LLM guidance.
  const pipeline = composeFromSlots(objects);
  const augmentationBriefing = buildAugmentationBriefing(pipeline);

  const objectDescriptions = objects
    .map((obj) => {
      const desc = buildObjectDescription(obj);
      const hints = buildIntensityHints(obj);
      const hintLine = hints.length > 0 ? `\n  강조 지시: ${hints.join("; ")}` : "";
      return `- ${obj.label}(${obj.role}): ${desc}${hintLine}`;
    })
    .join("\n");

  const alternativesText =
    Object.keys(selectedAlternatives).length > 0
      ? `\n\n적용된 표현 개선:\n${Object.entries(selectedAlternatives)
          .map(([original, replacement]) => `"${original}" → "${replacement}"`)
          .join("\n")}`
      : "";

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${SYSTEM_PROMPT}\n\n${augmentationBriefing}\n\n장면 구성 요소:\n${objectDescriptions}${alternativesText}`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.5,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("프롬프트 생성에 실패했습니다.");
  }

  const parsed = JSON.parse(text);

  if (!parsed.promptKo || !parsed.promptEn) {
    throw new Error("프롬프트 형식이 올바르지 않습니다.");
  }

  return {
    promptKo: parsed.promptKo,
    promptEn: parsed.promptEn,
  };
}

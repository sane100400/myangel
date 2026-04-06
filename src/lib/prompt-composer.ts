import { genai } from "./gemini";
import type { SceneObject } from "@/types";

function intensityToModifier(value: number): string {
  if (value <= 15) return "very subtle";
  if (value <= 30) return "subtle";
  if (value <= 45) return "gentle";
  if (value <= 60) return "moderate";
  if (value <= 75) return "strong";
  if (value <= 90) return "very strong";
  return "intense";
}

function buildObjectDescription(obj: SceneObject): string {
  const attrs = obj.attributes
    .filter((a) => a.value > 10)
    .map((a) => `${intensityToModifier(a.value)} ${a.nameEn}`)
    .join(", ");

  return attrs ? `${obj.description} (${attrs})` : obj.description;
}

const SYSTEM_PROMPT = `당신은 AI 이미지 생성 프롬프트를 최적화하는 전문가입니다.
주어진 장면 구성 요소들을 조합하여 최종 프롬프트를 생성해주세요.

응답 형식 (JSON):
{
  "promptKo": "한국어 최종 프롬프트 (사용자가 읽기 쉬운 자연어)",
  "promptEn": "영어 최종 프롬프트 (이미지 생성 모델에 최적화된 형태)"
}

규칙:
1. promptEn은 이미지 생성 모델(Stable Diffusion, Midjourney, DALL-E)이 잘 이해하는 형태로 작성하세요.
2. 시각적 속성(질감, 소재, 조명 방향, 카메라 구도 등)을 구체적으로 포함하세요.
3. 단순 번역이 아니라, 이미지 생성에 필요한 디테일을 보강하세요.
4. 속성 강도를 영어 수식어로 자연스럽게 반영하세요.
5. promptKo는 사용자에게 보여줄 자연스러운 한국어 문장이어야 합니다.
6. 품질 관련 키워드(high quality, detailed, masterpiece 등)를 적절히 포함하세요.`;

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
  const objectDescriptions = objects
    .map((obj) => {
      const desc = buildObjectDescription(obj);
      return `- ${obj.label}(${obj.role}): ${desc}`;
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
            text: `${SYSTEM_PROMPT}\n\n장면 구성 요소:\n${objectDescriptions}${alternativesText}`,
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

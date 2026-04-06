import { genai } from "./gemini";
import type { SceneObject, WeakSpan } from "@/types";

const SYSTEM_PROMPT = `당신은 AI 이미지 생성 프롬프트 전문가입니다.
사용자의 프롬프트에서 추상적이거나 정보량이 부족한 표현을 찾아내고, 더 구체적인 대안을 제시해주세요.

"예쁜", "멋진", "좋은", "감성적인", "분위기 있는" 같은 표현은 이미지 생성 모델이 해석하기 어렵습니다.
이런 표현을 시각적으로 구체적인 표현으로 바꿔주세요.

응답 형식 (JSON):
{
  "weakSpans": [
    {
      "start": 0,
      "end": 5,
      "text": "원본 추상 표현",
      "reason": "왜 약한 표현인지 설명 (한국어)",
      "alternatives": [
        {
          "id": "alt_1",
          "text": "대안 표현 (한국어)",
          "textEn": "대안 표현 (영어, 이미지 생성에 최적화)",
          "confidence": 0.9,
          "reasoning": "이 대안을 추천하는 이유"
        }
      ]
    }
  ]
}

규칙:
1. 각 약한 표현에 대해 3~5개의 대안을 제시하세요.
2. 대안은 단순 동의어 치환이 아니라, 전체 맥락과 장면 구성을 고려한 표현이어야 합니다.
3. 전체 무드/분위기와 조화되는 대안을 우선 추천하세요.
4. textEn은 이미지 생성 모델(Stable Diffusion, DALL-E 등)이 잘 이해하는 영어 표현으로 작성하세요.
5. start, end는 입력 프롬프트 문자열에서의 정확한 위치(인덱스)입니다.
6. 이미 구체적인 표현은 약한 표현으로 분류하지 마세요.
7. confidence는 해당 대안이 원본 의도를 잘 반영하는 정도입니다 (0-1).`;

export async function detectWeakSpans(
  prompt: string,
  objects: SceneObject[]
): Promise<WeakSpan[]> {
  const objectSummary = objects
    .map((o) => `- ${o.label}(${o.role}): ${o.description}`)
    .join("\n");

  const response = await genai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${SYSTEM_PROMPT}\n\n프롬프트: "${prompt}"\n\n장면 구성 요소:\n${objectSummary}`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return [];
  }

  const parsed = JSON.parse(text);
  const weakSpans: WeakSpan[] = parsed.weakSpans || parsed;

  if (!Array.isArray(weakSpans)) {
    return [];
  }

  return weakSpans;
}

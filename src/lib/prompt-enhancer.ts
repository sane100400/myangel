import { genai } from "./gemini";
import type { WeakSpan } from "@/types";

const SYSTEM_PROMPT = `당신은 AI 이미지 생성 프롬프트 전문가입니다.
사용자의 프롬프트를 의미 단위로 분해하고, **모든 단어/구절**에 대해 더 구체적이고 시각적으로 풍부한 대안을 제시해주세요.

핵심 원칙: 모든 단어는 더 구체화할 여지가 있습니다.
- "침대" → "하얀색 캐노피 침대", "낡은 나무 침대", "핑크 벨벳 침대" 등
- "몽환적인" → "요정 숲 느낌의 몽환적인", "설국 느낌의 몽환적인", "새벽 안개 같은 몽환적인" 등
- "방" → "다락방", "프랑스풍 침실", "빈티지 원룸" 등
- 조사("가", "를", "의" 등)나 접속사는 제외하고, 의미를 가진 단어/구절만 추출하세요.

응답 형식 (JSON):
{
  "spans": [
    {
      "text": "원본 단어/구절",
      "reason": "이 단어를 더 구체화하면 좋은 이유 (한국어, 짧게)",
      "alternatives": [
        {
          "id": "alt_1",
          "text": "대안 표현 (한국어)",
          "textEn": "영어 대안 (이미지 생성 모델용)",
          "confidence": 0.9,
          "reasoning": "이 대안의 특징 (짧게, 한국어)"
        }
      ]
    }
  ]
}

규칙:
1. 프롬프트의 모든 의미 단어/구절을 빠짐없이 추출하세요. 조사, 접속사만 제외.
2. 각 단어에 3~5개의 대안을 제시하세요.
3. 대안은 서로 다른 방향성을 가져야 합니다 (스타일, 분위기, 소재 등이 다양하게).
4. textEn은 Stable Diffusion, DALL-E 같은 이미지 생성 모델이 잘 이해하는 영어로 작성하세요.
5. confidence는 현재 문맥에서 해당 대안이 자연스러운 정도입니다 (0-1).
6. "text" 필드는 입력 프롬프트에 실제로 포함된 원본 텍스트를 정확히 적으세요.`;

export async function detectWeakSpans(
  prompt: string
): Promise<WeakSpan[]> {
  const response = await genai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${SYSTEM_PROMPT}\n\n프롬프트: "${prompt}"`,
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
  const spans: WeakSpan[] = (parsed.spans || parsed.weakSpans || parsed).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => ({
      start: 0,
      end: 0,
      text: s.text,
      reason: s.reason,
      alternatives: s.alternatives || [],
    })
  );

  if (!Array.isArray(spans)) {
    return [];
  }

  // Calculate start/end from the actual prompt text
  for (const span of spans) {
    const idx = prompt.indexOf(span.text);
    if (idx !== -1) {
      span.start = idx;
      span.end = idx + span.text.length;
    }
  }

  return spans.filter((s) => s.start !== s.end);
}

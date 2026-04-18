import { genai } from "./gemini";
import type { WeakSpan } from "@/types";
import { scoreSpan } from "./information-density";

const SYSTEM_PROMPT = `이미지 생성 프롬프트의 각 의미 단어를 더 구체적으로 만들 수 있는 대안을 제시해.
조사/접속사는 제외하고 의미 단어만 추출해.

JSON 형식:
{"spans":[{"text":"원본단어","reason":"구체화 이유(짧게)","alternatives":[{"id":"1","text":"대안(한국어)","textEn":"English alternative","confidence":0.9,"reasoning":"특징(짧게)"}]}]}

각 단어에 대안 3개씩.`;

export async function detectWeakSpans(
  prompt: string
): Promise<WeakSpan[]> {
  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: `${SYSTEM_PROMPT}\n\n"${prompt}"` }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return [];

  const parsed = JSON.parse(text);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spans: WeakSpan[] = (parsed.spans || parsed.weakSpans || parsed).map((s: any) => ({
    start: 0,
    end: 0,
    text: s.text,
    reason: s.reason,
    alternatives: (s.alternatives || []).slice(0, 3),
  }));

  if (!Array.isArray(spans)) return [];

  for (const span of spans) {
    const idx = prompt.indexOf(span.text);
    if (idx !== -1) {
      span.start = idx;
      span.end = idx + span.text.length;
    }
  }

  // Annotate each span with information-density metrics.
  // LLM-picked spans that already score high get filtered out — they're
  // not actually weak, just possibly-enrichable. This reduces false positives.
  const annotated: WeakSpan[] = [];
  for (const span of spans) {
    if (span.start === span.end) continue;
    const density = scoreSpan(span.text);
    span.densityScore = density.score;
    span.reasonCode = density.reason;
    // Prefer the density-based reason when LLM gave a generic one.
    if (!span.reason || span.reason.length < 4) {
      span.reason = density.reasonKo;
    }
    // Drop spans that scored clearly concrete unless LLM gave confident alternatives.
    if (!density.weak && density.score >= 0.55) continue;
    annotated.push(span);
  }
  return annotated;
}

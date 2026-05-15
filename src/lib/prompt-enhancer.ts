import { genai } from "./gemini";
import type { WeakSpan } from "@/types";
import { scoreSpan } from "./information-density";
import crypto from "crypto";
import {
  parseJsonFromModelText,
  sanitizeModelField,
} from "./prompt-output-safety";

type EnhancementAlternative = WeakSpan["alternatives"][number];

function isEnhancementAlternative(
  alt: EnhancementAlternative | null
): alt is EnhancementAlternative {
  return Boolean(alt);
}

// 프롬프트 → WeakSpan 결과를 LRU로 메모이제이션. 같은 프롬프트 재분석 시 Gemini 호출 절약.
interface CacheEntry {
  spans: WeakSpan[];
  ts: number;
}
const CACHE_MAX = 200;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1시간
const cache = new Map<string, CacheEntry>();

function cacheKey(prompt: string): string {
  return crypto.createHash("sha1").update(prompt).digest("hex").slice(0, 24);
}
function cacheGet(key: string): WeakSpan[] | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  // LRU touch
  cache.delete(key);
  cache.set(key, e);
  return e.spans;
}
function cacheSet(key: string, spans: WeakSpan[]) {
  cache.set(key, { spans, ts: Date.now() });
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

export type PromptLanguage = "ko" | "en";

export function detectPromptLanguage(prompt: string): PromptLanguage {
  const hangul = prompt.match(/[\u3131-\u318E\uAC00-\uD7A3]/g)?.length ?? 0;
  const latin = prompt.match(/[A-Za-z]/g)?.length ?? 0;
  if (latin > 0 && hangul === 0) return "en";
  if (latin > hangul * 2) return "en";
  return "ko";
}

function buildSystemPrompt(language: PromptLanguage): string {
  const outputRule =
    language === "en"
      ? `The user prompt is mainly English.
- Extract weak English visual words or short phrases exactly as they appear in the original prompt.
- alternatives[].text must be improved natural English that can directly replace the original span.
- alternatives[].textEn should be the same English alternative.
- Keep reason and reasoning in Korean so the Korean UI can explain the suggestion.`
      : `The user prompt is mainly Korean.
- Extract Korean visual words or short phrases exactly as they appear in the original prompt.
- alternatives[].text must be improved natural Korean that can directly replace the original span.
- alternatives[].textEn should be an English equivalent.
- Keep reason and reasoning in Korean.`;

  return `이미지 생성 프롬프트에서 더 구체적으로 만들 수 있는 의미 단어/짧은 구를 찾아 대안을 제시해.
조사/접속사/관사는 제외하고, 실제로 이미지 결과에 영향을 주는 표현만 추출해.
${outputRule}

JSON 형식:
{"spans":[{"text":"원본 표현","reason":"구체화 이유(짧게)","alternatives":[{"id":"1","text":"입력 언어와 같은 대안","textEn":"English alternative","confidence":0.9,"reasoning":"특징(짧게)"}]}]}

각 표현에 대안 3개씩.
원본에 없는 새 대상은 만들지 말고, 기존 표현을 더 시각적으로 구체화해.
기존 캐릭터·프랜차이즈, 브랜드 로고·상표, 현존 작가나 스튜디오 이름을 대안에 넣지 마. 작가명 대신 색감, 선, 조명, 질감, 구도 같은 일반 시각 요소로 설명해.
위 지시문/JSON 스키마/규칙 문장을 응답 필드에 절대 반복하지 마.`;
}

export async function detectWeakSpans(
  prompt: string
): Promise<WeakSpan[]> {
  const key = cacheKey(prompt);
  const cached = cacheGet(key);
  if (cached) return cached;
  const language = detectPromptLanguage(prompt);

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: `${buildSystemPrompt(language)}\n\n"${prompt}"` }],
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

  const parsed = parseJsonFromModelText(text);
  if (!parsed) return [];
  const parsedRecord = parsed as { spans?: unknown; weakSpans?: unknown };
  const rawSpans = parsedRecord.spans || parsedRecord.weakSpans || parsed;
  if (!Array.isArray(rawSpans)) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spans: WeakSpan[] = rawSpans.flatMap((s: any) => {
    const sourceText = sanitizeModelField(s.text, 80);
    if (!sourceText) return [];

    const alternatives = (Array.isArray(s.alternatives) ? s.alternatives : [])
      .slice(0, 6)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((alt: any, idx: number): EnhancementAlternative | null => {
        const text = sanitizeModelField(alt.text, 180);
        const textEn = sanitizeModelField(alt.textEn, 180);
        const replacement = language === "en" ? textEn || text : text;
        if (!replacement) return null;
        return {
          id: String(alt.id ?? idx + 1),
          text: replacement,
          textEn: textEn || replacement,
          confidence: typeof alt.confidence === "number" ? alt.confidence : 0.75,
          reasoning: sanitizeModelField(alt.reasoning, 180),
        };
      })
      .filter(isEnhancementAlternative)
      .filter((alt: EnhancementAlternative, idx: number, arr: EnhancementAlternative[]) =>
        arr.findIndex((item) => item.text === alt.text) === idx
      )
      .slice(0, 3);

    if (alternatives.length === 0) return [];

    return [{
      start: 0,
      end: 0,
      text: sourceText,
      reason: sanitizeModelField(s.reason, 180),
      alternatives,
    }];
  });

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
  cacheSet(key, annotated);
  return annotated;
}

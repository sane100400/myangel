/**
 * Information Density — span의 시각적 정보량 정량화.
 *
 * 목적: "약한 표현"을 LLM이 주관적으로 판정하는 대신, 프롬프트 구간의
 *       시각적 구체성(visual specificity)을 수치로 정의하여 객관적 기준을 만든다.
 *
 * 지표 구성 (0-1 정규화):
 *   1. concreteRatio    — 추상 형용사(예쁜, 멋진) 대비 구체 형용사(하얀, 거친) 비율
 *   2. visualTokenHit   — 시각 속성 어휘 사전 히트 수 (색/질감/조명/카메라 등)
 *   3. nounSpecificity  — 구체 명사 비율 (사물 vs 추상)
 *   4. lengthPenalty    — 너무 짧은 span은 정보량 감점
 *
 * 최종 점수 = weighted sum. 0.35 미만이면 weak로 분류.
 *
 * 이 모듈은 완전히 규칙 기반이며 LLM 호출이 없다. LLM이 출력한 weak span 후보에
 * 대해 점수를 부여하거나, 클라이언트에서 입력 중인 문장을 실시간 평가할 수 있다.
 */

// ────────────────────────────────────────────────────────────
// Vocabularies (Korean)
// ────────────────────────────────────────────────────────────

const ABSTRACT_ADJECTIVES = [
  "예쁜", "예쁜", "멋진", "좋은", "아름다운", "감성적인", "감성적", "느낌있는",
  "분위기있는", "분위기 있는", "괜찮은", "그럴듯한", "좋아보이는",
  "이쁜", "이쁜", "귀여운", "근사한", "훌륭한", "대단한",
];

const CONCRETE_VISUAL_ADJECTIVES = [
  "하얀", "검은", "붉은", "푸른", "노란", "초록", "회색의", "금색의", "은색의",
  "거친", "매끄러운", "부드러운", "딱딱한", "투명한", "반짝이는", "흐릿한",
  "뾰족한", "둥근", "각진", "기다란", "짧은",
  "반사되는", "그림자진", "역광의", "따뜻한", "차가운", "흐린", "맑은",
];

/** 시각 속성 어휘 사전 — 한국어 + 영어 혼용 */
const VISUAL_TOKENS = [
  // 조명
  "조명", "빛", "광원", "역광", "자연광", "스튜디오 조명", "골든아워", "블루아워",
  "lighting", "soft light", "harsh light", "golden hour",
  // 카메라
  "카메라", "클로즈업", "와이드샷", "로우앵글", "하이앵글", "틸트", "bokeh", "심도",
  "close-up", "wide shot", "low angle", "shallow depth",
  // 질감/재질
  "질감", "재질", "유리", "금속", "나무", "벨벳", "실크", "러프한", "매트한",
  "texture", "metallic", "velvety", "glossy", "matte",
  // 색/톤
  "팔레트", "채도", "명도", "톤", "파스텔", "비비드", "모노톤",
  "palette", "saturation", "pastel", "vivid", "monochrome",
  // 스타일/매체
  "유화", "수채화", "일러스트", "3D 렌더", "시네마틱", "빈티지",
  "oil painting", "watercolor", "illustration", "cinematic",
];

/** 추상적 무드 어휘 — concrete로 치지 않음 (대안 제시 필요) */
const VAGUE_MOOD_WORDS = [
  "느낌", "분위기", "무드", "감성", "vibe",
];

// ────────────────────────────────────────────────────────────
// Core scoring
// ────────────────────────────────────────────────────────────

export type WeakReason =
  | "too_abstract"       // 추상 형용사가 주를 이룸
  | "missing_visual"     // 시각 어휘가 전무
  | "vague_intensifier"  // "느낌", "분위기" 등 비구체적 명사
  | "low_density"        // 복합 — 전반적으로 정보량 부족
  | "ok";                // 개선 필요 없음

export interface DensityScore {
  score: number;          // 0-1
  concreteRatio: number;  // 0-1
  visualTokenHit: number; // count (normalized to 0-1)
  nounSpecificity: number;
  lengthPenalty: number;
  weak: boolean;
  reason: WeakReason;
  reasonKo: string;
}

const WEAK_THRESHOLD = 0.35;

function countHits(text: string, words: string[]): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const w of words) {
    if (lower.includes(w.toLowerCase())) hits++;
  }
  return hits;
}

function tokenizeRough(text: string): string[] {
  return text
    .replace(/[,.!?;:()[\]"']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function scoreSpan(text: string): DensityScore {
  const trimmed = text.trim();
  const tokens = tokenizeRough(trimmed);
  const tokenCount = tokens.length;

  const abstractHits = countHits(trimmed, ABSTRACT_ADJECTIVES);
  const concreteHits = countHits(trimmed, CONCRETE_VISUAL_ADJECTIVES);
  const visualHits = countHits(trimmed, VISUAL_TOKENS);
  const vagueHits = countHits(trimmed, VAGUE_MOOD_WORDS);

  const adjTotal = abstractHits + concreteHits;
  const concreteRatio = adjTotal === 0 ? 0.5 : concreteHits / adjTotal;

  const visualTokenHit = Math.min(1, visualHits / 2);
  const nounSpecificity = Math.max(
    0,
    1 - vagueHits / Math.max(1, tokenCount)
  );
  const lengthPenalty = tokenCount === 0 ? 0 : Math.min(1, tokenCount / 4);

  const score =
    0.35 * concreteRatio +
    0.35 * visualTokenHit +
    0.2 * nounSpecificity +
    0.1 * lengthPenalty;

  const weak = score < WEAK_THRESHOLD;
  const { reason, reasonKo } = classifyReason({
    abstractHits,
    concreteHits,
    visualHits,
    vagueHits,
    weak,
  });

  return {
    score: Math.round(score * 100) / 100,
    concreteRatio: Math.round(concreteRatio * 100) / 100,
    visualTokenHit: Math.round(visualTokenHit * 100) / 100,
    nounSpecificity: Math.round(nounSpecificity * 100) / 100,
    lengthPenalty: Math.round(lengthPenalty * 100) / 100,
    weak,
    reason,
    reasonKo,
  };
}

function classifyReason(sig: {
  abstractHits: number;
  concreteHits: number;
  visualHits: number;
  vagueHits: number;
  weak: boolean;
}): { reason: WeakReason; reasonKo: string } {
  if (!sig.weak) {
    return { reason: "ok", reasonKo: "구체적으로 표현되어 있습니다." };
  }
  if (sig.abstractHits > sig.concreteHits && sig.abstractHits > 0) {
    return {
      reason: "too_abstract",
      reasonKo: "추상 형용사 — 시각 속성으로 구체화가 필요합니다.",
    };
  }
  if (sig.vagueHits > 0 && sig.visualHits === 0) {
    return {
      reason: "vague_intensifier",
      reasonKo: "'느낌/분위기' 같은 비구체적 표현 — 시각 요소 명시 필요.",
    };
  }
  if (sig.visualHits === 0) {
    return {
      reason: "missing_visual",
      reasonKo: "시각적 디테일(조명·질감·카메라 등)이 없습니다.",
    };
  }
  return {
    reason: "low_density",
    reasonKo: "전반적으로 정보량이 부족합니다.",
  };
}

// ────────────────────────────────────────────────────────────
// Prompt-wide scoring
// ────────────────────────────────────────────────────────────

export interface PromptDensitySummary {
  overallScore: number;
  weakWindows: { start: number; end: number; text: string; score: DensityScore }[];
}

/** 슬라이딩 윈도우로 프롬프트 전체의 약한 구간을 찾는다. */
export function scorePrompt(
  prompt: string,
  windowSize = 6
): PromptDensitySummary {
  const tokens = tokenizeRough(prompt);
  if (tokens.length === 0) {
    return { overallScore: 0, weakWindows: [] };
  }

  const weakWindows: PromptDensitySummary["weakWindows"] = [];
  let scoreSum = 0;
  let scoreCount = 0;

  for (let i = 0; i < tokens.length; i += Math.max(1, Math.floor(windowSize / 2))) {
    const slice = tokens.slice(i, i + windowSize);
    if (slice.length < 2) continue;
    const text = slice.join(" ");
    const score = scoreSpan(text);
    scoreSum += score.score;
    scoreCount += 1;
    if (score.weak) {
      const start = prompt.indexOf(slice[0]);
      const last = slice[slice.length - 1];
      const end = prompt.indexOf(last, start) + last.length;
      if (start !== -1 && end !== -1) {
        weakWindows.push({ start, end, text, score });
      }
    }
  }

  const overallScore = scoreCount === 0 ? 0 : scoreSum / scoreCount;
  return {
    overallScore: Math.round(overallScore * 100) / 100,
    weakWindows,
  };
}

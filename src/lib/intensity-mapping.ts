/**
 * Intensity-to-Prompt 매핑 — 0-100 강도 값을 프롬프트 표현으로 변환하는 공식 테이블.
 *
 * 목적: 사용자가 슬라이더로 조작하는 강도 값이 최종 프롬프트에 어떻게 반영되는지
 *       결정론적으로 정의한다. 같은 입력 → 같은 출력 (LLM 변동성 제거).
 *
 * 설계:
 *   - 6개 band로 0-100 구간 분할
 *   - band마다 부사(adverb), 반복 횟수(repeat), SD-스타일 가중치(weight) 정의
 *   - 카테고리별 override 제공 (lighting은 강도 표현이 mood와 다름)
 */
import type { AttributeCategory, ObjectAttribute } from "@/types";

// ────────────────────────────────────────────────────────────
// Band definition
// ────────────────────────────────────────────────────────────

export type IntensityBandName =
  | "absent"
  | "hint"
  | "subtle"
  | "present"
  | "strong"
  | "dominant";

export interface IntensityBand {
  name: IntensityBandName;
  min: number;
  max: number;
  /** 일반 형용사 수식어 — 기본 변환 */
  adverb: string;
  /** 반복 횟수 — 프롬프트 내에서 해당 속성을 몇 번 언급할지 */
  repeat: number;
  /** Stable Diffusion 스타일 가중치 — (token:weight) 형태에 사용 */
  weight: number;
  /** LLM이 프롬프트 생성 시 받는 지시문 */
  instruction: string;
}

export const INTENSITY_BANDS: IntensityBand[] = [
  {
    name: "absent",
    min: 0,
    max: 10,
    adverb: "",
    repeat: 0,
    weight: 0,
    instruction: "이 속성은 프롬프트에 포함하지 않음",
  },
  {
    name: "hint",
    min: 11,
    max: 25,
    adverb: "a hint of",
    repeat: 1,
    weight: 0.8,
    instruction: "암시적으로만 언급, 배경 수준",
  },
  {
    name: "subtle",
    min: 26,
    max: 45,
    adverb: "subtle",
    repeat: 1,
    weight: 0.9,
    instruction: "은은하게 표현",
  },
  {
    name: "present",
    min: 46,
    max: 60,
    adverb: "",
    repeat: 1,
    weight: 1.0,
    instruction: "표준 수준으로 자연스럽게 포함",
  },
  {
    name: "strong",
    min: 61,
    max: 80,
    adverb: "strongly",
    repeat: 1,
    weight: 1.2,
    instruction: "명확하고 뚜렷하게 표현",
  },
  {
    name: "dominant",
    min: 81,
    max: 100,
    adverb: "intensely",
    repeat: 2,
    weight: 1.4,
    instruction: "장면의 지배적 특성으로 강조",
  },
];

// ────────────────────────────────────────────────────────────
// Category overrides — 특정 카테고리에서는 band별 adverb를 바꿔 자연스러움 확보
// ────────────────────────────────────────────────────────────

const CATEGORY_ADVERB_OVERRIDE: Partial<
  Record<AttributeCategory, Partial<Record<IntensityBandName, string>>>
> = {
  lighting: {
    hint: "faintly lit with",
    subtle: "softly lit with",
    strong: "boldly lit with",
    dominant: "dramatically lit with",
  },
  mood: {
    hint: "touched by",
    subtle: "gently",
    strong: "deeply",
    dominant: "overwhelmingly",
  },
  color: {
    hint: "tinted with",
    subtle: "tinged with",
    strong: "richly",
    dominant: "saturated with",
  },
  texture: {
    hint: "slightly",
    subtle: "softly",
    strong: "distinctly",
    dominant: "richly",
  },
  detail: {
    hint: "lightly",
    subtle: "moderately",
    strong: "highly",
    dominant: "ultra",
  },
  style: {
    hint: "with touches of",
    subtle: "inspired by",
    strong: "in the style of",
    dominant: "entirely in",
  },
};

// ────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────

export function getBand(value: number): IntensityBand {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    INTENSITY_BANDS.find((b) => clamped >= b.min && clamped <= b.max) ??
    INTENSITY_BANDS[3]
  );
}

export function getAdverb(value: number, category: AttributeCategory): string {
  const band = getBand(value);
  const override = CATEGORY_ADVERB_OVERRIDE[category]?.[band.name];
  return override ?? band.adverb;
}

/**
 * 단일 속성을 프롬프트 조각으로 변환한다.
 * - absent band는 빈 문자열 반환 (호출자가 필터링).
 * - Stable Diffusion 가중치 문법을 쓰려면 `style="weighted"` 옵션 사용.
 */
export function attributeToPromptFragment(
  attr: ObjectAttribute,
  style: "adverb" | "weighted" = "adverb"
): string {
  const band = getBand(attr.value);
  if (band.name === "absent") return "";

  if (style === "weighted") {
    return band.weight === 1.0
      ? attr.nameEn
      : `(${attr.nameEn}:${band.weight.toFixed(2)})`;
  }

  const adverb = getAdverb(attr.value, attr.category);
  const token = adverb ? `${adverb} ${attr.nameEn}`.trim() : attr.nameEn;
  return band.repeat > 1 ? `${token}, ${attr.nameEn}` : token;
}

/**
 * 오브젝트의 모든 속성을 프롬프트 조각 배열로 변환.
 * absent 속성은 제외된다.
 */
export function objectAttributesToFragments(
  attrs: ObjectAttribute[],
  style: "adverb" | "weighted" = "adverb"
): string[] {
  return attrs
    .map((a) => attributeToPromptFragment(a, style))
    .filter((s) => s.length > 0);
}

/**
 * 디버깅·UI 표시용: band의 한국어 라벨.
 */
export function describeBand(value: number): string {
  const band = getBand(value);
  const ko: Record<IntensityBandName, string> = {
    absent: "없음",
    hint: "암시",
    subtle: "은은",
    present: "기본",
    strong: "강조",
    dominant: "지배",
  };
  return ko[band.name];
}

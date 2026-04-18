/**
 * Visual Augmentation Pipeline — 한국어 의도 → 이미지 생성 친화적 영어 프롬프트 변환.
 *
 * 3단계 파이프라인:
 *   Stage 1. Slot detection     — 장면에 어떤 시각 슬롯이 채워져 있는지 감지
 *   Stage 2. Slot augmentation  — 비어있는 핵심 슬롯에 기본 어휘를 주입
 *   Stage 3. Structured compose — SD/DALL-E 친화적 구조로 조립
 *
 * 슬롯 설계 근거: 이미지 생성 모델은 subject → style → medium → lighting →
 * composition → quality 순서로 토큰을 배치할 때 가장 안정적인 결과를 낸다는
 * 커뮤니티 관행에 근거. 각 슬롯은 비어있으면 품질이 크게 떨어지는 필수
 * 시각 차원이다.
 */
import type { SceneObject, ScenePosition } from "@/types";
import { CATEGORY_SPEC } from "./scene-schema";
import { objectAttributesToFragments } from "./intensity-mapping";

// ────────────────────────────────────────────────────────────
// Position → spatial phrase
// ────────────────────────────────────────────────────────────

/**
 * 캔버스 좌표(0-100%)를 이미지 생성 모델이 이해하는 공간 표현으로 변환한다.
 * 3×3 그리드로 양자화하여 안정적인 영어 구문을 생성.
 */
export function positionToSpatialPhrase(pos: ScenePosition): string {
  const hx = pos.x < 33 ? "left" : pos.x > 66 ? "right" : "center";
  const hy = pos.y < 33 ? "upper" : pos.y > 66 ? "lower" : "middle";

  if (hx === "center" && hy === "middle") return "centered";
  if (hx === "center") return `${hy} center`;
  if (hy === "middle") return `${hx} side`;
  return `${hy}-${hx}`;
}

export function describeObjectPosition(obj: SceneObject): string | null {
  if (!obj.position) return null;
  const phrase = positionToSpatialPhrase(obj.position);
  if (obj.role === "subject") {
    return `${obj.description} positioned at the ${phrase} of the frame`;
  }
  if (obj.role === "background") {
    return `background extending from the ${phrase}`;
  }
  return `${obj.role} at ${phrase}`;
}

// ────────────────────────────────────────────────────────────
// Slot definition
// ────────────────────────────────────────────────────────────

export type VisualSlot =
  | "subject"
  | "style"
  | "medium"
  | "lighting"
  | "composition"
  | "quality";

export interface SlotSpec {
  slot: VisualSlot;
  label: string;
  /** 이 슬롯을 채우는 기본 어휘 (slot이 비어있을 때 주입) */
  defaults: string[];
  /** SceneObject의 어떤 role/category에서 이 슬롯의 내용을 가져오는지 */
  sources: {
    roles?: SceneObject["role"][];
    categories?: (keyof typeof CATEGORY_SPEC)[];
  };
  /** 비어있으면 기본 어휘 주입 여부 (품질 하락 크기) */
  mandatory: boolean;
  /** 최종 프롬프트 내 배치 순서 (낮을수록 앞) */
  order: number;
}

export const SLOT_SPEC: Record<VisualSlot, SlotSpec> = {
  subject: {
    slot: "subject",
    label: "주제",
    defaults: [],
    sources: { roles: ["subject"] },
    mandatory: true,
    order: 0,
  },
  style: {
    slot: "style",
    label: "스타일",
    defaults: ["cinematic"],
    sources: { categories: ["style"] },
    mandatory: true,
    order: 1,
  },
  medium: {
    slot: "medium",
    label: "매체·질감",
    defaults: ["detailed texture"],
    sources: { categories: ["texture"] },
    mandatory: false,
    order: 2,
  },
  lighting: {
    slot: "lighting",
    label: "조명",
    defaults: ["soft natural light"],
    sources: { roles: ["lighting"], categories: ["lighting"] },
    mandatory: true,
    order: 3,
  },
  composition: {
    slot: "composition",
    label: "구도",
    defaults: ["balanced composition"],
    sources: { roles: ["composition", "background"] },
    mandatory: false,
    order: 4,
  },
  quality: {
    slot: "quality",
    label: "품질",
    defaults: ["high quality", "highly detailed", "sharp focus"],
    sources: { categories: ["detail"] },
    mandatory: true,
    order: 5,
  },
};

// ────────────────────────────────────────────────────────────
// Stage 1: Slot detection
// ────────────────────────────────────────────────────────────

export interface SlotDetection {
  slot: VisualSlot;
  filled: boolean;
  contributions: string[]; // English tokens contributed by the scene
}

export function detectSlots(objects: SceneObject[]): SlotDetection[] {
  const result: SlotDetection[] = [];

  for (const slot of Object.values(SLOT_SPEC)) {
    const contributions: string[] = [];

    for (const obj of objects) {
      const roleMatch = slot.sources.roles?.includes(obj.role) ?? false;
      if (roleMatch && slot.slot === "subject") {
        contributions.push(obj.description);
      }
      if (roleMatch && slot.slot !== "subject") {
        const frags = objectAttributesToFragments(obj.attributes);
        contributions.push(...frags);
      }
      if (slot.sources.categories) {
        const matchingAttrs = obj.attributes.filter((a) =>
          slot.sources.categories!.includes(a.category)
        );
        contributions.push(...objectAttributesToFragments(matchingAttrs));
      }
    }

    // Composition slot: spatial phrases from user-placed canvas positions.
    // This is the single binding point between canvas drag and final prompt.
    if (slot.slot === "composition") {
      const positional = objects
        .filter((o) => o.position && (o.role === "subject" || o.role === "background"))
        .map((o) => describeObjectPosition(o))
        .filter((s): s is string => !!s);
      contributions.push(...positional);
    }

    const unique = Array.from(new Set(contributions.filter((c) => c.trim())));
    result.push({
      slot: slot.slot,
      filled: unique.length > 0,
      contributions: unique,
    });
  }

  return result;
}

// ────────────────────────────────────────────────────────────
// Stage 2: Slot augmentation
// ────────────────────────────────────────────────────────────

export interface AugmentedSlot extends SlotDetection {
  augmented: boolean;       // true if defaults were injected
  finalTokens: string[];
}

export function augmentSlots(detections: SlotDetection[]): AugmentedSlot[] {
  return detections.map((d) => {
    const spec = SLOT_SPEC[d.slot];
    if (d.filled || !spec.mandatory) {
      return { ...d, augmented: false, finalTokens: d.contributions };
    }
    return {
      ...d,
      augmented: true,
      finalTokens: [...d.contributions, ...spec.defaults],
    };
  });
}

// ────────────────────────────────────────────────────────────
// Stage 3: Structured composition
// ────────────────────────────────────────────────────────────

export interface StructuredPromptPipelineResult {
  promptEn: string;
  slots: AugmentedSlot[];
  injectedDefaults: { slot: VisualSlot; tokens: string[] }[];
}

/**
 * 결정론적 파이프라인 — LLM 없이 slot 기반으로 프롬프트 조립.
 * LLM 기반 composePrompt와 나란히 사용할 수 있도록 전체 결과를 반환한다.
 */
export function composeFromSlots(
  objects: SceneObject[]
): StructuredPromptPipelineResult {
  const detected = detectSlots(objects);
  const augmented = augmentSlots(detected);

  const ordered = [...augmented].sort(
    (a, b) => SLOT_SPEC[a.slot].order - SLOT_SPEC[b.slot].order
  );

  const parts: string[] = [];
  for (const slot of ordered) {
    if (slot.finalTokens.length === 0) continue;
    parts.push(slot.finalTokens.join(", "));
  }

  const injectedDefaults = augmented
    .filter((a) => a.augmented)
    .map((a) => ({ slot: a.slot, tokens: SLOT_SPEC[a.slot].defaults }));

  return {
    promptEn: parts.join(", "),
    slots: augmented,
    injectedDefaults,
  };
}

// ────────────────────────────────────────────────────────────
// LLM guidance — pipeline 결과를 LLM composer에게 힌트로 전달
// ────────────────────────────────────────────────────────────

export function buildAugmentationBriefing(
  result: StructuredPromptPipelineResult
): string {
  const slotLines = result.slots
    .map((s) => {
      const spec = SLOT_SPEC[s.slot];
      const status = s.augmented ? "자동 보완됨" : s.filled ? "채워짐" : "비어있음";
      return `  - ${spec.label}(${s.slot}) [${status}]: ${s.finalTokens.join(", ") || "(없음)"}`;
    })
    .join("\n");

  const injected =
    result.injectedDefaults.length === 0
      ? ""
      : `\n자동 주입된 기본 어휘:\n${result.injectedDefaults
          .map((i) => `  - ${SLOT_SPEC[i.slot].label}: ${i.tokens.join(", ")}`)
          .join("\n")}`;

  return `시각 슬롯 상태:\n${slotLines}${injected}\n\n결정론적 슬롯 조립 결과 (참고용):\n${result.promptEn}`;
}

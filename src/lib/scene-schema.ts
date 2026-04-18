/**
 * SceneObject Schema — 장면 구성 요소의 공식 명세.
 *
 * 이 모듈은 MyAngel의 "구조화된 표현 트리"를 구성하는 핵심 데이터 구조의
 * 스펙을 단일 소스로 정의한다. 분석기(analyzer), 조합기(composer),
 * 충돌 감지기(conflict), 강도 매퍼(intensity)가 모두 이 스키마를 참조한다.
 *
 * 설계 원칙:
 *   1. Role은 고정 enum — 장면 구성의 의미 단위를 제한적으로 정의.
 *   2. Category는 속성의 시각적 도메인 — 동일 category 내 속성은 충돌 가능성 있음.
 *   3. 각 category는 canonical vocabulary를 가짐 — LLM 출력을 표준 어휘로 정렬.
 */
import type {
  AttributeCategory,
  ObjectRole,
  SceneObject,
  ObjectAttribute,
} from "@/types";

// ────────────────────────────────────────────────────────────
// Role specification
// ────────────────────────────────────────────────────────────

export interface RoleSpec {
  role: ObjectRole;
  label: string;
  purpose: string;
  maxCount: number;
  positional: boolean;
  suggestedCategories: AttributeCategory[];
}

export const ROLE_SPEC: Record<ObjectRole, RoleSpec> = {
  subject: {
    role: "subject",
    label: "피사체",
    purpose: "이미지의 주제 — 카메라가 초점을 맞추는 대상",
    maxCount: 3,
    positional: true,
    suggestedCategories: ["style", "texture", "detail"],
  },
  background: {
    role: "background",
    label: "배경",
    purpose: "피사체를 둘러싼 공간·환경",
    maxCount: 1,
    positional: true,
    suggestedCategories: ["style", "texture", "detail"],
  },
  mood: {
    role: "mood",
    label: "분위기",
    purpose: "장면 전반의 정서적 톤",
    maxCount: 1,
    positional: false,
    suggestedCategories: ["mood", "color"],
  },
  lighting: {
    role: "lighting",
    label: "조명",
    purpose: "광원의 종류·방향·강도",
    maxCount: 1,
    positional: false,
    suggestedCategories: ["lighting", "color"],
  },
  color: {
    role: "color",
    label: "색감",
    purpose: "전체 팔레트·채도·톤",
    maxCount: 1,
    positional: false,
    suggestedCategories: ["color", "mood"],
  },
  texture: {
    role: "texture",
    label: "질감",
    purpose: "표면·재질·미시 디테일",
    maxCount: 1,
    positional: false,
    suggestedCategories: ["texture", "detail"],
  },
  composition: {
    role: "composition",
    label: "구도",
    purpose: "프레이밍·카메라 구도",
    maxCount: 1,
    positional: false,
    suggestedCategories: ["style", "detail"],
  },
  custom: {
    role: "custom",
    label: "커스텀",
    purpose: "사용자가 정의한 자유 요소",
    maxCount: 5,
    positional: false,
    suggestedCategories: ["style", "detail", "mood"],
  },
};

// ────────────────────────────────────────────────────────────
// Category specification & canonical vocabulary
// ────────────────────────────────────────────────────────────

export interface CategorySpec {
  category: AttributeCategory;
  label: string;
  purpose: string;
  /** 표준 영어 어휘 — LLM 출력을 이 어휘 중 가장 가까운 것으로 정렬한다. */
  vocabulary: string[];
}

export const CATEGORY_SPEC: Record<AttributeCategory, CategorySpec> = {
  style: {
    category: "style",
    label: "스타일",
    purpose: "예술 장르·화풍",
    vocabulary: [
      "realism",
      "photorealism",
      "abstraction",
      "illustration",
      "anime",
      "oil painting",
      "watercolor",
      "3d render",
      "cinematic",
      "vintage",
      "modern",
      "surreal",
      "minimalism",
      "maximalism",
    ],
  },
  texture: {
    category: "texture",
    label: "질감",
    purpose: "표면 물성·거칠기",
    vocabulary: [
      "smooth",
      "rough",
      "glossy",
      "matte",
      "soft",
      "coarse",
      "silky",
      "metallic",
      "fluffy",
      "grainy",
      "crystalline",
      "velvety",
    ],
  },
  color: {
    category: "color",
    label: "색감",
    purpose: "팔레트·채도·온도",
    vocabulary: [
      "warm tone",
      "cool tone",
      "pastel",
      "vivid",
      "muted",
      "monochrome",
      "saturated",
      "desaturated",
      "warmth",
      "coldness",
      "warm",
      "cool",
    ],
  },
  lighting: {
    category: "lighting",
    label: "조명",
    purpose: "광원의 성질",
    vocabulary: [
      "soft light",
      "harsh light",
      "backlight",
      "rim light",
      "golden hour",
      "blue hour",
      "studio lighting",
      "natural light",
      "warm lighting",
      "cool lighting",
      "brightness",
      "darkness",
      "bright",
      "dark",
    ],
  },
  mood: {
    category: "mood",
    label: "무드",
    purpose: "장면의 정서",
    vocabulary: [
      "dreamy",
      "melancholic",
      "joyful",
      "serene",
      "tense",
      "mysterious",
      "nostalgic",
      "calm",
      "intense",
      "ethereal",
      "gritty",
      "whimsical",
    ],
  },
  detail: {
    category: "detail",
    label: "디테일",
    purpose: "해상도·정밀도·샤프니스",
    vocabulary: [
      "detailed",
      "ultra detailed",
      "sharp focus",
      "soft focus",
      "blurred",
      "clean",
      "intricate",
      "realism",
      "abstraction",
    ],
  },
};

// ────────────────────────────────────────────────────────────
// Validation
// ────────────────────────────────────────────────────────────

export interface SchemaViolation {
  level: "error" | "warning";
  code: string;
  message: string;
  path: string;
}

export function validateScene(objects: SceneObject[]): SchemaViolation[] {
  const violations: SchemaViolation[] = [];

  if (objects.length === 0) {
    violations.push({
      level: "error",
      code: "EMPTY_SCENE",
      message: "장면에 오브젝트가 하나도 없습니다.",
      path: "$",
    });
    return violations;
  }

  const hasSubject = objects.some((o) => o.role === "subject");
  if (!hasSubject) {
    violations.push({
      level: "error",
      code: "MISSING_SUBJECT",
      message: "피사체(subject) 오브젝트가 반드시 1개 이상 있어야 합니다.",
      path: "$",
    });
  }

  const roleCounts = new Map<ObjectRole, number>();
  for (const obj of objects) {
    roleCounts.set(obj.role, (roleCounts.get(obj.role) ?? 0) + 1);
  }
  for (const [role, count] of roleCounts) {
    const spec = ROLE_SPEC[role];
    if (spec && count > spec.maxCount) {
      violations.push({
        level: "warning",
        code: "ROLE_OVERFLOW",
        message: `${spec.label}(${role})은 최대 ${spec.maxCount}개까지 권장됩니다 (현재 ${count}개).`,
        path: `$.objects[role=${role}]`,
      });
    }
  }

  objects.forEach((obj, i) => {
    if (!obj.description || obj.description.trim().length === 0) {
      violations.push({
        level: "error",
        code: "EMPTY_DESCRIPTION",
        message: `오브젝트 ${i}의 설명이 비어있습니다.`,
        path: `$.objects[${i}].description`,
      });
    }
    if (obj.attributes.length === 0) {
      violations.push({
        level: "warning",
        code: "NO_ATTRIBUTES",
        message: `오브젝트 "${obj.label}"에 속성이 없어 이미지 생성에 영향이 제한적일 수 있습니다.`,
        path: `$.objects[${i}].attributes`,
      });
    }
    obj.attributes.forEach((attr, j) => {
      if (attr.value < 0 || attr.value > 100) {
        violations.push({
          level: "error",
          code: "ATTR_VALUE_OUT_OF_RANGE",
          message: `속성 "${attr.name}"의 값은 0-100 범위여야 합니다 (현재 ${attr.value}).`,
          path: `$.objects[${i}].attributes[${j}].value`,
        });
      }
      if (!CATEGORY_SPEC[attr.category]) {
        violations.push({
          level: "warning",
          code: "UNKNOWN_CATEGORY",
          message: `알 수 없는 카테고리 "${attr.category}".`,
          path: `$.objects[${i}].attributes[${j}].category`,
        });
      }
    });
  });

  return violations;
}

// ────────────────────────────────────────────────────────────
// Vocabulary alignment
// ────────────────────────────────────────────────────────────

/**
 * LLM이 생성한 nameEn을 canonical vocabulary 중 가장 가까운 항목으로 정렬한다.
 * 일치하지 않으면 원본을 그대로 반환한다.
 */
export function alignToVocabulary(
  nameEn: string,
  category: AttributeCategory
): { aligned: string; canonical: boolean } {
  const vocab = CATEGORY_SPEC[category]?.vocabulary ?? [];
  const lower = nameEn.toLowerCase().trim();

  for (const word of vocab) {
    if (word === lower) return { aligned: word, canonical: true };
  }
  for (const word of vocab) {
    if (lower.includes(word) || word.includes(lower)) {
      return { aligned: word, canonical: true };
    }
  }
  return { aligned: nameEn, canonical: false };
}

export function normalizeAttribute(attr: ObjectAttribute): ObjectAttribute {
  const { aligned } = alignToVocabulary(attr.nameEn, attr.category);
  return { ...attr, nameEn: aligned };
}

export function normalizeScene(objects: SceneObject[]): SceneObject[] {
  return objects.map((obj) => ({
    ...obj,
    attributes: obj.attributes.map(normalizeAttribute),
  }));
}

// ────────────────────────────────────────────────────────────
// Schema descriptors for LLM prompts
// ────────────────────────────────────────────────────────────

/**
 * 분석기(analyzer)의 시스템 프롬프트에 삽입할 수 있는 스키마 요약.
 * LLM이 스키마를 따르도록 강제하는 데 사용한다.
 */
export function describeSchemaForLLM(): string {
  const roles = Object.values(ROLE_SPEC)
    .map((r) => `  - ${r.role}(${r.label}): ${r.purpose}, 최대 ${r.maxCount}개`)
    .join("\n");
  const categories = Object.values(CATEGORY_SPEC)
    .map(
      (c) =>
        `  - ${c.category}(${c.label}): ${c.purpose}. 어휘 예: ${c.vocabulary.slice(0, 5).join(", ")}`
    )
    .join("\n");
  return `장면 스키마:\nROLES:\n${roles}\n\nCATEGORIES (속성 카테고리):\n${categories}`;
}

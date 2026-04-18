/**
 * Object Conflict Detection Matrix — 속성 간 의미적 충돌 규칙.
 *
 * 목적: 서로 다른 오브젝트에서 상반된 속성이 동시에 강하게(≥ soft threshold)
 *       설정될 때, 이미지 생성 모델이 혼란스러운 결과를 내지 않도록 사전 감지.
 *
 * 설계:
 *   - Axis: 대립하는 두 의미 그룹 쌍 (예: warmth ↔ coldness)
 *   - Severity: hard (동시 강조 시 반드시 갈등) / soft (스타일적 조합 가능)
 *   - Threshold: band 기준 (strong band 이상 = 61+)
 *   - 카테고리 기반: 동일 category 내 대립 속성만 충돌로 간주
 */
import type { AttributeCategory, SceneObject } from "@/types";
import { getBand } from "./intensity-mapping";

// ────────────────────────────────────────────────────────────
// Axis definition
// ────────────────────────────────────────────────────────────

export interface ConflictAxis {
  id: string;
  category: AttributeCategory;
  /** 대립하는 두 어휘 그룹. 각 그룹의 토큰이 nameEn에 substring으로 포함되면 매칭. */
  poleA: string[];
  poleB: string[];
  severity: "hard" | "soft";
  /** 사용자에게 보여줄 설명 */
  reason: string;
}

export const CONFLICT_AXES: ConflictAxis[] = [
  {
    id: "color.temperature",
    category: "color",
    poleA: ["warm tone", "warmth", "warm"],
    poleB: ["cool tone", "coldness", "cool", "cold"],
    severity: "hard",
    reason: "색온도의 양극 — 한 장면에 동시에 지배시키면 톤이 깨집니다.",
  },
  {
    id: "lighting.intensity",
    category: "lighting",
    poleA: ["bright", "brightness"],
    poleB: ["dark", "darkness"],
    severity: "hard",
    reason: "조명 밝기의 양극 — 의도가 불분명해질 수 있습니다.",
  },
  {
    id: "lighting.temperature",
    category: "lighting",
    poleA: ["warm lighting"],
    poleB: ["cool lighting"],
    severity: "hard",
    reason: "조명 색온도 충돌.",
  },
  {
    id: "lighting.hardness",
    category: "lighting",
    poleA: ["soft light"],
    poleB: ["harsh light"],
    severity: "soft",
    reason: "광질의 부드러움과 거칠음이 반대 방향입니다.",
  },
  {
    id: "style.realism",
    category: "style",
    poleA: ["realism", "photorealism", "realistic"],
    poleB: ["abstraction", "abstract", "surreal"],
    severity: "soft",
    reason: "사실성과 추상성은 서로 완화할 수 있으나 강도 강조 시 혼란 발생.",
  },
  {
    id: "style.density",
    category: "style",
    poleA: ["minimalism", "minimal"],
    poleB: ["maximalism", "maximalist"],
    severity: "hard",
    reason: "구성 밀도의 양극 — 한쪽만 선택하세요.",
  },
  {
    id: "style.era",
    category: "style",
    poleA: ["vintage"],
    poleB: ["modern"],
    severity: "soft",
    reason: "시대감이 상반됩니다.",
  },
  {
    id: "texture.smoothness",
    category: "texture",
    poleA: ["smooth", "silky", "glossy"],
    poleB: ["rough", "coarse", "grainy"],
    severity: "hard",
    reason: "표면 거칠기의 양극.",
  },
  {
    id: "texture.finish",
    category: "texture",
    poleA: ["glossy"],
    poleB: ["matte"],
    severity: "hard",
    reason: "광택과 무광은 동시에 성립하기 어렵습니다.",
  },
  {
    id: "mood.energy",
    category: "mood",
    poleA: ["calm", "serene"],
    poleB: ["intense", "tense"],
    severity: "soft",
    reason: "에너지 레벨이 반대 방향입니다.",
  },
  {
    id: "mood.brightness",
    category: "mood",
    poleA: ["joyful", "whimsical"],
    poleB: ["melancholic", "gritty"],
    severity: "soft",
    reason: "정서의 밝기가 반대입니다.",
  },
  {
    id: "detail.focus",
    category: "detail",
    poleA: ["sharp focus", "ultra detailed"],
    poleB: ["soft focus", "blurred"],
    severity: "hard",
    reason: "초점·정밀도의 양극.",
  },
];

// ────────────────────────────────────────────────────────────
// Detection
// ────────────────────────────────────────────────────────────

export interface Conflict {
  axisId: string;
  severity: "hard" | "soft";
  category: AttributeCategory;
  reason: string;
  objA: { id: string; label: string };
  attrA: { name: string; nameEn: string; value: number };
  objB: { id: string; label: string };
  attrB: { name: string; nameEn: string; value: number };
  message: string;
}

const SOFT_THRESHOLD = 61;
const HARD_THRESHOLD = 46;

interface AttributeMatch {
  axis: ConflictAxis;
  pole: "A" | "B";
}

function matchAxes(nameEn: string, category: AttributeCategory): AttributeMatch[] {
  const lower = nameEn.toLowerCase();
  const matches: AttributeMatch[] = [];
  for (const axis of CONFLICT_AXES) {
    if (axis.category !== category) continue;
    if (axis.poleA.some((w) => lower.includes(w))) {
      matches.push({ axis, pole: "A" });
    } else if (axis.poleB.some((w) => lower.includes(w))) {
      matches.push({ axis, pole: "B" });
    }
  }
  return matches;
}

export function detectConflicts(objects: SceneObject[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const seen = new Set<string>();

  type Indexed = {
    obj: SceneObject;
    attr: SceneObject["attributes"][number];
    match: AttributeMatch;
  };
  const indexed: Indexed[] = [];
  for (const obj of objects) {
    for (const attr of obj.attributes) {
      const matches = matchAxes(attr.nameEn, attr.category);
      for (const match of matches) {
        indexed.push({ obj, attr, match });
      }
    }
  }

  for (let i = 0; i < indexed.length; i++) {
    for (let j = i + 1; j < indexed.length; j++) {
      const a = indexed[i];
      const b = indexed[j];
      if (a.obj.id === b.obj.id) continue;
      if (a.match.axis.id !== b.match.axis.id) continue;
      if (a.match.pole === b.match.pole) continue;

      const threshold =
        a.match.axis.severity === "hard" ? HARD_THRESHOLD : SOFT_THRESHOLD;
      if (a.attr.value < threshold || b.attr.value < threshold) continue;

      const key = [a.obj.id, a.attr.id, b.obj.id, b.attr.id].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);

      conflicts.push({
        axisId: a.match.axis.id,
        severity: a.match.axis.severity,
        category: a.match.axis.category,
        reason: a.match.axis.reason,
        objA: { id: a.obj.id, label: a.obj.label },
        attrA: { name: a.attr.name, nameEn: a.attr.nameEn, value: a.attr.value },
        objB: { id: b.obj.id, label: b.obj.label },
        attrB: { name: b.attr.name, nameEn: b.attr.nameEn, value: b.attr.value },
        message: formatMessage(a, b),
      });
    }
  }

  return conflicts;
}

function formatMessage(
  a: { obj: SceneObject; attr: SceneObject["attributes"][number]; match: AttributeMatch },
  b: { obj: SceneObject; attr: SceneObject["attributes"][number]; match: AttributeMatch }
): string {
  const bandA = getBand(a.attr.value).name;
  const bandB = getBand(b.attr.value).name;
  return `${a.obj.label}의 "${a.attr.name}"(${a.attr.value}, ${bandA})과 ${b.obj.label}의 "${b.attr.name}"(${b.attr.value}, ${bandB})이 충돌 축 [${a.match.axis.id}]에서 대립합니다.`;
}

/**
 * 각 충돌에 대해 자동 완화 제안을 생성한다.
 * - hard: 낮은 쪽을 absent band로 내리거나 둘 다 present로 낮추기
 * - soft: 둘 중 하나를 subtle band로 낮추기
 */
export interface ConflictResolution {
  conflict: Conflict;
  suggestion: string;
  targetAttributeId: string;
  targetValue: number;
}

export function suggestResolutions(
  conflicts: Conflict[],
  objects: SceneObject[]
): ConflictResolution[] {
  return conflicts.map((c) => {
    const attrA = findAttr(objects, c.objA.id, c.attrA.name);
    const attrB = findAttr(objects, c.objB.id, c.attrB.name);
    const [weaker, weakerObjId] =
      c.attrA.value <= c.attrB.value
        ? [attrA, c.objA.id]
        : [attrB, c.objB.id];
    const targetValue = c.severity === "hard" ? 10 : 35;
    return {
      conflict: c,
      targetAttributeId: weaker?.id ?? "",
      targetValue,
      suggestion: `${weakerObjId === c.objA.id ? c.objA.label : c.objB.label}의 "${weaker?.name ?? ""}"을(를) ${targetValue}로 내리면 충돌이 해소됩니다.`,
    };
  });
}

function findAttr(objects: SceneObject[], objId: string, attrName: string) {
  return objects.find((o) => o.id === objId)?.attributes.find((a) => a.name === attrName);
}

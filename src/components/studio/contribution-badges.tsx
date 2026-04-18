"use client";

import { useMemo } from "react";
import type { SceneObject, AttributeCategory } from "@/types";
import {
  positionToSpatialPhrase,
  composeFromSlots,
} from "@/lib/visual-augmentation";
import { detectConflicts } from "@/lib/conflict-matrix";

interface Badge {
  icon: string;
  label: string;
  hint: string;
  tone: "position" | "attr" | "ok" | "augment";
}

const CATEGORY_ICONS: Record<AttributeCategory, string> = {
  style: "🎨",
  texture: "🧶",
  color: "🌈",
  lighting: "💡",
  mood: "✨",
  detail: "🔍",
};

const SPATIAL_KO: Record<string, string> = {
  centered: "중앙",
  "upper center": "상단 중앙",
  "lower center": "하단 중앙",
  "left side": "좌측",
  "right side": "우측",
  "upper-left": "좌상단",
  "upper-right": "우상단",
  "lower-left": "좌하단",
  "lower-right": "우하단",
};

const TONE_STYLES: Record<Badge["tone"], string> = {
  position: "bg-sky-50 border-sky-200/70 text-sky-800",
  attr: "bg-indigo-50 border-indigo-200/70 text-indigo-800",
  ok: "bg-emerald-50 border-emerald-200/70 text-emerald-800",
  augment: "bg-amber-50 border-amber-200/70 text-amber-800",
};

export function ContributionBadges({ objects }: { objects: SceneObject[] }) {
  const badges = useMemo<Badge[]>(() => {
    const out: Badge[] = [];

    // 1. User-placed positions (subject/background only)
    for (const obj of objects) {
      if (!obj.position) continue;
      if (obj.role !== "subject" && obj.role !== "background") continue;
      const phrase = positionToSpatialPhrase(obj.position);
      const phraseKo = SPATIAL_KO[phrase] ?? phrase;
      out.push({
        icon: "📍",
        label: `${obj.label} ${phraseKo}`,
        hint: "캔버스에서 지정한 구도가 반영되었어요",
        tone: "position",
      });
      if (out.filter((b) => b.tone === "position").length >= 2) break;
    }

    // 2. Top strong attributes (value >= 61 = strong/dominant band)
    const strong = objects
      .flatMap((o) => o.attributes.map((attr) => ({ obj: o, attr })))
      .filter(({ attr }) => attr.value >= 61)
      .sort((a, b) => b.attr.value - a.attr.value)
      .slice(0, 3);

    for (const { attr } of strong) {
      out.push({
        icon: CATEGORY_ICONS[attr.category] ?? "✦",
        label: `${attr.name} ${attr.value}`,
        hint: "강도가 프롬프트에 반영되었어요",
        tone: "attr",
      });
    }

    // 3. Conflict status — only advertise if scene is non-trivial
    const conflicts = detectConflicts(objects);
    if (conflicts.length === 0 && objects.length >= 3) {
      out.push({
        icon: "✓",
        label: "속성 일관성 유지",
        hint: "충돌하는 속성이 없어 이미지가 안정적으로 생성되었어요",
        tone: "ok",
      });
    }

    // 4. Visual augmentation — slots auto-filled by pipeline
    const { injectedDefaults } = composeFromSlots(objects);
    if (injectedDefaults.length > 0) {
      out.push({
        icon: "✨",
        label: `시각 보완 ${injectedDefaults.length}개`,
        hint: "조명·구도·품질 등 비어있던 요소가 자동 보완되었어요",
        tone: "augment",
      });
    }

    return out;
  }, [objects]);

  if (badges.length === 0) return null;

  return (
    <div className="mx-auto mt-5 max-w-xl space-y-2">
      <p className="text-center text-[12px] text-[var(--angel-text-faint)]">
        이 이미지에 반영된 당신의 조정
      </p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {badges.map((b, i) => (
          <span
            key={i}
            title={b.hint}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] ${TONE_STYLES[b.tone]}`}
          >
            <span>{b.icon}</span>
            <span className="font-medium">{b.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

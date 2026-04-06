"use client";

import { useState } from "react";
import type { SceneObject } from "@/types";
import { AttributeSlider } from "./attribute-slider";

const ROLE_ICONS: Record<string, string> = {
  subject: "🎯",
  background: "🏞️",
  mood: "✨",
  lighting: "💡",
  color: "🎨",
  texture: "🧶",
  composition: "📐",
  custom: "⚙️",
};

const ROLE_COLORS: Record<string, string> = {
  subject: "border-blue-300/50 bg-blue-50/30",
  background: "border-emerald-300/50 bg-emerald-50/30",
  mood: "border-purple-300/50 bg-purple-50/30",
  lighting: "border-amber-300/50 bg-amber-50/30",
  color: "border-pink-300/50 bg-pink-50/30",
  texture: "border-orange-300/50 bg-orange-50/30",
  composition: "border-cyan-300/50 bg-cyan-50/30",
  custom: "border-gray-300/50 bg-gray-50/30",
};

interface ObjectCardProps {
  object: SceneObject;
  onChange: (updated: SceneObject) => void;
  onDelete: (id: string) => void;
}

export function ObjectCard({ object, onChange, onDelete }: ObjectCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleAttributeChange = (attrId: string, value: number) => {
    onChange({
      ...object,
      attributes: object.attributes.map((a) =>
        a.id === attrId ? { ...a, value } : a
      ),
    });
  };

  const handleDescriptionChange = (description: string) => {
    onChange({ ...object, description });
  };

  const roleColor = ROLE_COLORS[object.role] || ROLE_COLORS.custom;

  return (
    <div
      className={`rounded-xl border p-3 transition-all ${roleColor} ${
        expanded ? "shadow-md" : "shadow-sm hover:shadow-md"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-base">{ROLE_ICONS[object.role] || "⚙️"}</span>
        <span className="text-[12px] font-medium text-[var(--angel-text)]">
          {object.label}
        </span>
        <span className="text-[9px] text-[var(--angel-text-faint)] uppercase">
          {object.role}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-full p-1 text-[var(--angel-text-soft)] hover:bg-white/50 transition-colors"
            aria-label={expanded ? "접기" : "펼치기"}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(object.id)}
            className="rounded-full p-1 text-[var(--angel-text-faint)] hover:text-red-400 hover:bg-red-50/50 transition-colors"
            aria-label="삭제"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4 4L12 12M12 4L4 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Description */}
      <input
        type="text"
        value={object.description}
        onChange={(e) => handleDescriptionChange(e.target.value)}
        className="mt-2 w-full rounded-lg bg-white/60 border border-transparent px-2.5 py-1.5 text-[12px] text-[var(--angel-text)] outline-none transition-all focus:border-[var(--angel-blue)]/30 focus:bg-white"
        placeholder="설명을 입력하세요"
      />

      {/* Attributes (expandable) */}
      {expanded && (
        <div className="mt-3 space-y-2 border-t border-white/50 pt-3">
          {object.attributes.map((attr) => (
            <AttributeSlider
              key={attr.id}
              attribute={attr}
              onChange={(value) => handleAttributeChange(attr.id, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

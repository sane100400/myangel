"use client";

import type { SceneObject } from "@/types";
import { ObjectCard } from "./object-card";

interface ObjectEditorProps {
  objects: SceneObject[];
  onChange: (objects: SceneObject[]) => void;
}

export function ObjectEditor({ objects, onChange }: ObjectEditorProps) {
  const handleObjectChange = (updated: SceneObject) => {
    onChange(objects.map((o) => (o.id === updated.id ? updated : o)));
  };

  const handleDelete = (id: string) => {
    onChange(objects.filter((o) => o.id !== id));
  };

  const handleAddObject = () => {
    const newObj: SceneObject = {
      id: `obj_custom_${Date.now()}`,
      role: "custom",
      label: "사용자 정의",
      description: "",
      attributes: [
        {
          id: `attr_${Date.now()}_1`,
          name: "강도",
          nameEn: "intensity",
          value: 50,
          category: "detail",
        },
      ],
    };
    onChange([...objects, newObj]);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-medium text-[var(--angel-text)]">
          장면 구성 요소
        </h3>
        <span className="text-[10px] text-[var(--angel-text-faint)]">
          {objects.length}개 요소
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {objects.map((obj) => (
          <ObjectCard
            key={obj.id}
            object={obj}
            onChange={handleObjectChange}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <button
        onClick={handleAddObject}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--angel-border)] py-2.5 text-[12px] text-[var(--angel-text-soft)] transition-all hover:border-[var(--angel-blue)]/50 hover:text-[var(--angel-blue)] hover:bg-white/50"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        요소 추가
      </button>
    </div>
  );
}

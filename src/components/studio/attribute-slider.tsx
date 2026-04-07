"use client";

import type { ObjectAttribute } from "@/types";

interface AttributeSliderProps {
  attribute: ObjectAttribute;
  onChange: (value: number) => void;
}

export function AttributeSlider({ attribute, onChange }: AttributeSliderProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="min-w-[60px] text-[13px] text-[var(--angel-text-soft)] shrink-0">
        {attribute.name}
      </label>
      <input
        type="range"
        min={0}
        max={100}
        value={attribute.value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--angel-blue)]/15 accent-[var(--angel-blue)] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--angel-blue)] [&::-webkit-slider-thumb]:shadow-sm"
      />
      <span className="min-w-[28px] text-right text-[12px] font-medium text-[var(--angel-text-soft)]">
        {attribute.value}
      </span>
    </div>
  );
}

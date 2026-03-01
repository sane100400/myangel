"use client";

import type { AnalysisElements } from "@/types";
import { GothicCross } from "@/components/ui/gothic-cross";

interface AnalysisResultProps {
  elements: AnalysisElements;
}

const ELEMENT_LABELS: Record<keyof Omit<AnalysisElements, "overall_style">, string> = {
  materials: "Material",
  silhouettes: "Silhouette",
  details: "Detail",
  colors: "Color",
  mood: "Mood",
};

export function AnalysisResult({ elements }: AnalysisResultProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-[var(--angel-lavender)]">✦</span>
        <h3
          className="text-lg font-medium tracking-[0.08em] text-[var(--angel-text)]"
          style={{ fontFamily: "var(--font-serif-kr), var(--font-serif), 'Gowun Batang', 'Cormorant Garamond', serif" }}
        >
          Visual Analysis
        </h3>
      </div>
      <p className="text-[12px] leading-[1.8] text-[var(--angel-text-soft)]">{elements.overall_style}</p>

      <div className="space-y-4 pt-2">
        {Object.entries(ELEMENT_LABELS).map(([key, label]) => {
          const values = elements[key as keyof Omit<AnalysisElements, "overall_style">];
          if (!values?.length) return null;
          return (
            <div key={key}>
              <span className="mb-2 flex items-center gap-1.5 text-[9px] font-medium tracking-[0.15em] uppercase text-[var(--angel-text-faint)]">
                <GothicCross size={16} color="var(--angel-lavender)" />
                {label}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {values.map((v) => (
                  <span key={v} className="angel-tag text-[10px]">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

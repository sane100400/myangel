"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ── Demo objects ──

interface DemoObject {
  id: string;
  icon: string;
  label: string;
  desc: string;
  color: string;
}

const DEMO_OBJECTS: DemoObject[] = [
  { id: "penguin", icon: "🎯", label: "피사체: 펭귄", desc: "갓태어난 황제펭귄", color: "border-blue-300/60 bg-blue-50/60" },
  { id: "bg", icon: "🏞️", label: "배경", desc: "이불 속", color: "border-sky-300/60 bg-sky-50/60" },
  { id: "doll", icon: "🎯", label: "피사체: 인형", desc: "곰인형", color: "border-blue-300/60 bg-blue-50/60" },
];

const INITIAL_POSITIONS: Record<string, { x: number; y: number }> = {
  penguin: { x: 10, y: 15 },
  bg: { x: 55, y: 8 },
  doll: { x: 25, y: 58 },
};

// ── Sidebar sliders ──

interface SliderState {
  id: string;
  icon: string;
  label: string;
  attrName: string;
  value: number;
  borderColor: string;
  bgColor: string;
}

const INITIAL_SLIDERS: SliderState[] = [
  { id: "lighting", icon: "💡", label: "조명", attrName: "따뜻함", value: 75, borderColor: "border-amber-200/60", bgColor: "bg-amber-50/40" },
  { id: "mood", icon: "✨", label: "분위기", attrName: "포근함", value: 85, borderColor: "border-indigo-200/60", bgColor: "bg-indigo-50/40" },
  { id: "color", icon: "🎨", label: "색감", attrName: "따뜻한", value: 60, borderColor: "border-blue-200/60", bgColor: "bg-blue-50/30" },
];

// ── Component ──

export function StudioDemo() {
  const [positions, setPositions] = useState(INITIAL_POSITIONS);
  const [sliders, setSliders] = useState(INITIAL_SLIDERS);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const rafRef = useRef<number>(0);

  // ── Drag handlers ──

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();

      const pos = positions[id];
      dragRef.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        origX: pos.x,
        origY: pos.y,
      };
      setDraggingId(id);
    },
    [positions]
  );

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      const canvas = canvasRef.current;
      if (!drag || !canvas) return;

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = canvas.getBoundingClientRect();
        const dx = ((e.clientX - drag.startX) / rect.width) * 100;
        const dy = ((e.clientY - drag.startY) / rect.height) * 100;

        setPositions((prev) => ({
          ...prev,
          [drag.id]: {
            x: Math.max(0, Math.min(75, drag.origX + dx)),
            y: Math.max(0, Math.min(75, drag.origY + dy)),
          },
        }));
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      cancelAnimationFrame(rafRef.current);
      const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
      if (dist < 5) {
        setSelectedId((prev) => (prev === drag.id ? null : drag.id));
      }

      dragRef.current = null;
      setDraggingId(null);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const handleSliderChange = useCallback((id: string, newValue: number) => {
    setSliders((prev) =>
      prev.map((s) => (s.id === id ? { ...s, value: newValue } : s))
    );
  }, []);

  return (
    <div className="rounded-2xl border border-[var(--angel-blue)]/20 bg-white/80 p-3 shadow-md md:p-4">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 min-w-0 relative rounded-xl border border-[var(--angel-border)] bg-white/70 min-h-[220px] md:min-h-[280px]"
          style={{
            touchAction: "none",
            backgroundImage: "radial-gradient(circle, rgba(91,155,213,0.10) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          {DEMO_OBJECTS.map((obj) => {
            const pos = positions[obj.id];
            const isDragging = draggingId === obj.id;
            const isSelected = selectedId === obj.id;

            return (
              <div
                key={obj.id}
                className={`absolute select-none rounded-xl border px-3 py-1.5 transition-shadow ${obj.color} ${
                  isDragging
                    ? "cursor-grabbing shadow-lg z-30 scale-105"
                    : "cursor-grab shadow-sm hover:shadow-md z-10"
                } ${isSelected ? "ring-2 ring-blue-400/40 shadow-md z-20" : ""}`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  touchAction: "none",
                  maxWidth: "160px",
                }}
                onPointerDown={(e) => handlePointerDown(e, obj.id)}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{obj.icon}</span>
                  <span className="text-[13px] font-medium text-[var(--angel-text)] leading-tight">
                    {obj.label}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-[var(--angel-text-soft)] truncate leading-tight">
                  {obj.desc}
                </p>
              </div>
            );
          })}

          {/* Drag hint */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-white/80 border border-[var(--angel-border)] px-3 py-1 text-[11px] text-[var(--angel-text-faint)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3" />
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
            직접 드래그해보세요!
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:w-[200px] shrink-0 space-y-2">
          <p className="text-[12px] font-medium text-[var(--angel-text-soft)] mb-1">장면 속성</p>
          {sliders.map((s) => (
            <div key={s.id} className={`rounded-xl border ${s.borderColor} ${s.bgColor} px-3 py-2`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-xs">{s.icon}</span>
                <span className="text-[12px] font-medium text-[var(--angel-text)]">{s.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--angel-text-soft)] w-10 shrink-0">{s.attrName}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={s.value}
                  onChange={(e) => handleSliderChange(s.id, Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--angel-blue)]/15 accent-[var(--angel-blue)] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--angel-blue)] [&::-webkit-slider-thumb]:shadow-sm"
                />
                <span className="text-[11px] text-[var(--angel-text-soft)] w-5 text-right tabular-nums">{s.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-center text-[12px] text-[var(--angel-text-faint)] md:text-[13px]">
        피사체는 캔버스에서 배치 · 조명/분위기/색감은 사이드바에서 조절
      </p>
    </div>
  );
}

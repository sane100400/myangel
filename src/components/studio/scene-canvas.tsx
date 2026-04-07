"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { SceneObject } from "@/types";
import { AttributeSlider } from "./attribute-slider";

// ── Constants ──

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
  subject: "border-blue-300/60 bg-blue-50/50",
  background: "border-emerald-300/60 bg-emerald-50/50",
  mood: "border-purple-300/60 bg-purple-50/50",
  lighting: "border-amber-300/60 bg-amber-50/50",
  color: "border-pink-300/60 bg-pink-50/50",
  texture: "border-orange-300/60 bg-orange-50/50",
  composition: "border-cyan-300/60 bg-cyan-50/50",
  custom: "border-gray-300/60 bg-gray-50/50",
};

const ROLE_RING: Record<string, string> = {
  subject: "ring-blue-400/40",
  background: "ring-emerald-400/40",
  mood: "ring-purple-400/40",
  lighting: "ring-amber-400/40",
  color: "ring-pink-400/40",
  texture: "ring-orange-400/40",
  composition: "ring-cyan-400/40",
  custom: "ring-gray-400/40",
};

const ROLE_BG_ACCENT: Record<string, string> = {
  mood: "bg-purple-50/60",
  lighting: "bg-amber-50/60",
  color: "bg-pink-50/60",
  texture: "bg-orange-50/60",
  composition: "bg-cyan-50/60",
  custom: "bg-gray-50/60",
};

const ROLE_BORDER_ACCENT: Record<string, string> = {
  mood: "border-purple-200/60",
  lighting: "border-amber-200/60",
  color: "border-pink-200/60",
  texture: "border-orange-200/60",
  composition: "border-cyan-200/60",
  custom: "border-gray-200/60",
};

/** Roles that are placed on the canvas (positional) */
const CANVAS_ROLES = new Set(["subject", "background"]);

const DEFAULT_POSITIONS: Record<string, { x: number; y: number }> = {
  subject: { x: 38, y: 32 },
  background: { x: 32, y: 5 },
};

const MAX_SUBJECTS = 3;

// ── Types ──

interface SceneCanvasProps {
  objects: SceneObject[];
  onChange: (objects: SceneObject[]) => void;
}

interface DragState {
  id: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
}

// ── Component ──

export function SceneCanvas({ objects, onChange }: SceneCanvasProps) {
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [expandedSidebar, setExpandedSidebar] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const rafRef = useRef<number>(0);

  // Split objects into canvas (positional) and sidebar (global)
  const canvasObjects = objects.filter((o) => CANVAS_ROLES.has(o.role));
  const sidebarObjects = objects.filter((o) => !CANVAS_ROLES.has(o.role));

  // ── Initial layout (canvas objects only) ──

  useEffect(() => {
    setPositions((prev) => {
      const next = { ...prev };
      const roleCounts: Record<string, number> = {};
      let changed = false;

      for (const obj of canvasObjects) {
        if (!next[obj.id]) {
          const count = roleCounts[obj.role] || 0;
          roleCounts[obj.role] = count + 1;
          const base =
            DEFAULT_POSITIONS[obj.role] || DEFAULT_POSITIONS.subject;
          next[obj.id] = {
            x: Math.min(82, base.x + count * 14),
            y: Math.min(78, base.y + count * 10),
          };
          changed = true;
        }
      }

      // Clean deleted
      const canvasIds = new Set(canvasObjects.map((o) => o.id));
      for (const id of Object.keys(next)) {
        if (!canvasIds.has(id)) {
          delete next[id];
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [canvasObjects.map((o) => o.id).join(",")]);

  // ── Drag handlers ──

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      if ((e.target as HTMLElement).closest("[data-popover]")) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();

      const pos = positions[id] || { x: 50, y: 50 };
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

  const handlePointerMove = useCallback((e: PointerEvent) => {
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
          x: Math.max(0, Math.min(82, drag.origX + dx)),
          y: Math.max(0, Math.min(82, drag.origY + dy)),
        },
      }));
    });
  }, []);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    cancelAnimationFrame(rafRef.current);
    const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);

    if (dist < 5) {
      setSelectedId((prev) => (prev === drag.id ? null : drag.id));
    } else {
      setSelectedId(null);
    }

    dragRef.current = null;
    setDraggingId(null);
  }, []);

  useEffect(() => {
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // ── Outside click to close popover ──

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        const target = e.target as HTMLElement;
        if (target.closest("[data-card]")) return;
        setSelectedId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Object mutation ──

  const handleObjectChange = useCallback(
    (updated: SceneObject) => {
      onChange(objects.map((o) => (o.id === updated.id ? updated : o)));
    },
    [objects, onChange]
  );

  const handleDelete = useCallback(
    (id: string) => {
      onChange(objects.filter((o) => o.id !== id));
      setSelectedId(null);
      if (expandedSidebar === id) setExpandedSidebar(null);
    },
    [objects, onChange, expandedSidebar]
  );

  const handleAddSubject = useCallback(() => {
    const subjectCount = objects.filter((o) => o.role === "subject").length;
    if (subjectCount >= MAX_SUBJECTS) return;
    const newObj: SceneObject = {
      id: `obj_subject_${Date.now()}`,
      role: "subject",
      label: `피사체 ${subjectCount + 1}`,
      description: "",
      attributes: [
        {
          id: `attr_${Date.now()}_1`,
          name: "사실감",
          nameEn: "realism",
          value: 50,
          category: "style",
        },
        {
          id: `attr_${Date.now()}_2`,
          name: "디테일",
          nameEn: "detail level",
          value: 50,
          category: "detail",
        },
      ],
    };
    onChange([...objects, newObj]);
  }, [objects, onChange]);

  // ── Popover position ──

  const getPopoverPos = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedId) return null;
    const pos = positions[selectedId];
    if (!pos) return null;

    const rect = canvas.getBoundingClientRect();
    const isMobile = rect.width < 400;
    const popW = isMobile ? rect.width - 16 : 280;

    const cardX = (pos.x / 100) * rect.width;
    const cardY = (pos.y / 100) * rect.height;

    let top = cardY + 52;
    if (top + 280 > rect.height) {
      top = cardY - 280 - 8;
    }
    top = Math.max(8, Math.min(top, rect.height - 240));

    let left = isMobile ? 8 : cardX - popW / 2 + 50;
    left = Math.max(8, Math.min(left, rect.width - popW - 8));

    return { top, left, width: popW };
  }, [selectedId, positions]);

  const selectedObj = selectedId
    ? objects.find((o) => o.id === selectedId) || null
    : null;
  const popoverPos = getPopoverPos();
  const subjectCount = objects.filter((o) => o.role === "subject").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-medium text-[var(--angel-text)]">
          장면 구성
        </h3>
        <span className="text-[10px] text-[var(--angel-text-faint)]">
          피사체를 드래그로 배치 · 클릭으로 편집
        </span>
      </div>

      {/* Main layout: canvas + sidebar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* ── Canvas area ── */}
        <div className="flex-1 min-w-0">
          <div
            ref={canvasRef}
            className="relative min-h-[320px] w-full rounded-2xl border border-[var(--angel-border)] bg-white/70 overflow-hidden md:min-h-[420px]"
            style={{
              touchAction: "none",
              backgroundImage:
                "radial-gradient(circle, rgba(91,155,213,0.12) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          >
            {/* Empty state */}
            {canvasObjects.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[12px] text-[var(--angel-text-faint)]">
                  피사체와 배경이 여기에 표시됩니다
                </p>
              </div>
            )}

            {/* Draggable object cards */}
            {canvasObjects.map((obj) => {
              const pos = positions[obj.id];
              if (!pos) return null;
              const isSelected = selectedId === obj.id;
              const isDragging = draggingId === obj.id;
              const roleColor = ROLE_COLORS[obj.role] || ROLE_COLORS.custom;
              const roleRing = ROLE_RING[obj.role] || ROLE_RING.custom;

              return (
                <div
                  key={obj.id}
                  data-card
                  className={`absolute select-none rounded-xl border px-3 py-2 transition-shadow ${roleColor} ${
                    isDragging
                      ? "cursor-grabbing shadow-lg z-30 scale-105"
                      : "cursor-grab shadow-sm hover:shadow-md z-10"
                  } ${isSelected ? `ring-2 ${roleRing} shadow-md z-20` : ""}`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    touchAction: "none",
                    maxWidth: "160px",
                  }}
                  onPointerDown={(e) => handlePointerDown(e, obj.id)}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">
                      {ROLE_ICONS[obj.role] || "⚙️"}
                    </span>
                    <span className="text-[11px] font-medium text-[var(--angel-text)] leading-tight">
                      {obj.label}
                    </span>
                  </div>
                  {obj.description && (
                    <p className="mt-0.5 text-[9px] text-[var(--angel-text-soft)] truncate leading-tight">
                      {obj.description}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Popover (canvas objects only) */}
            {selectedObj && popoverPos && CANVAS_ROLES.has(selectedObj.role) && (
              <div
                ref={popoverRef}
                data-popover
                className="absolute z-40 rounded-xl border border-[var(--angel-border)] bg-white/95 backdrop-blur-sm shadow-xl overflow-hidden"
                style={{
                  top: popoverPos.top,
                  left: popoverPos.left,
                  width: popoverPos.width,
                }}
              >
                {/* Popover header */}
                <div className="flex items-center justify-between px-3.5 pt-3 pb-2 border-b border-[var(--angel-border)]/50 bg-gradient-to-r from-[var(--angel-blue)]/5 to-transparent">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {ROLE_ICONS[selectedObj.role] || "⚙️"}
                    </span>
                    <div>
                      <span className="text-[12px] font-medium text-[var(--angel-text)]">
                        {selectedObj.label}
                      </span>
                      <span className="ml-1.5 text-[9px] text-[var(--angel-text-faint)] uppercase">
                        {selectedObj.role}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="text-[var(--angel-text-faint)] hover:text-[var(--angel-text-soft)] transition-colors p-0.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M4 4L12 12M12 4L4 12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>

                {/* Description */}
                <div className="px-3.5 pt-2.5 pb-2">
                  <label className="text-[9px] text-[var(--angel-text-faint)] uppercase tracking-wider">
                    설명
                  </label>
                  <input
                    type="text"
                    value={selectedObj.description}
                    onChange={(e) =>
                      handleObjectChange({
                        ...selectedObj,
                        description: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg bg-[var(--angel-blue)]/5 border border-transparent px-2.5 py-1.5 text-[12px] text-[var(--angel-text)] outline-none transition-all focus:border-[var(--angel-blue)]/30 focus:bg-white"
                    placeholder="이 요소를 설명해주세요"
                  />
                </div>

                {/* Attributes */}
                {selectedObj.attributes.length > 0 && (
                  <div className="px-3.5 pb-2">
                    <label className="text-[9px] text-[var(--angel-text-faint)] uppercase tracking-wider">
                      속성
                    </label>
                    <div className="mt-1.5 space-y-1.5">
                      {selectedObj.attributes.map((attr) => (
                        <AttributeSlider
                          key={attr.id}
                          attribute={attr}
                          onChange={(value) =>
                            handleObjectChange({
                              ...selectedObj,
                              attributes: selectedObj.attributes.map((a) =>
                                a.id === attr.id ? { ...a, value } : a
                              ),
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Delete */}
                <div className="px-3.5 pb-3 pt-1">
                  <button
                    onClick={() => handleDelete(selectedObj.id)}
                    className="w-full rounded-lg border border-red-200/50 py-1.5 text-[11px] text-red-400 transition-colors hover:bg-red-50/50 hover:text-red-500"
                  >
                    요소 삭제
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add subject button */}
          <button
            onClick={handleAddSubject}
            disabled={subjectCount >= MAX_SUBJECTS}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--angel-border)] py-2 text-[12px] text-[var(--angel-text-soft)] transition-all hover:border-[var(--angel-blue)]/50 hover:text-[var(--angel-blue)] hover:bg-white/50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[var(--angel-border)] disabled:hover:text-[var(--angel-text-soft)] disabled:hover:bg-transparent"
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
            피사체 추가 ({subjectCount}/{MAX_SUBJECTS})
          </button>
        </div>

        {/* ── Sidebar: non-positional properties ── */}
        <div className="md:w-[260px] shrink-0 space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] font-medium text-[var(--angel-text-soft)]">
              장면 속성
            </span>
            <span className="text-[9px] text-[var(--angel-text-faint)]">
              · 조명 · 분위기 · 색감 등
            </span>
          </div>

          {sidebarObjects.length === 0 && (
            <div className="rounded-xl border border-dashed border-[var(--angel-border)] py-6 text-center">
              <p className="text-[11px] text-[var(--angel-text-faint)]">
                분석된 장면 속성이 여기에 표시됩니다
              </p>
            </div>
          )}

          {sidebarObjects.map((obj) => {
            const isExpanded = expandedSidebar === obj.id;
            const bgAccent =
              ROLE_BG_ACCENT[obj.role] || ROLE_BG_ACCENT.custom;
            const borderAccent =
              ROLE_BORDER_ACCENT[obj.role] || ROLE_BORDER_ACCENT.custom;

            return (
              <div
                key={obj.id}
                className={`rounded-xl border transition-all ${borderAccent} ${
                  isExpanded ? bgAccent : "bg-white/50"
                }`}
              >
                {/* Accordion header */}
                <button
                  onClick={() =>
                    setExpandedSidebar(isExpanded ? null : obj.id)
                  }
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">
                      {ROLE_ICONS[obj.role] || "⚙️"}
                    </span>
                    <div className="min-w-0">
                      <span className="text-[12px] font-medium text-[var(--angel-text)] block leading-tight">
                        {obj.label}
                      </span>
                      {obj.description && !isExpanded && (
                        <span className="text-[9px] text-[var(--angel-text-faint)] block truncate leading-tight mt-0.5">
                          {obj.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`shrink-0 text-[var(--angel-text-faint)] transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2.5 border-t border-[var(--angel-border)]/30">
                    {/* Description input */}
                    <div className="pt-2.5">
                      <label className="text-[9px] text-[var(--angel-text-faint)] uppercase tracking-wider">
                        설명
                      </label>
                      <input
                        type="text"
                        value={obj.description}
                        onChange={(e) =>
                          handleObjectChange({
                            ...obj,
                            description: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg bg-white/80 border border-transparent px-2.5 py-1.5 text-[12px] text-[var(--angel-text)] outline-none transition-all focus:border-[var(--angel-blue)]/30 focus:bg-white"
                        placeholder="이 속성을 설명해주세요"
                      />
                    </div>

                    {/* Attributes */}
                    {obj.attributes.length > 0 && (
                      <div>
                        <label className="text-[9px] text-[var(--angel-text-faint)] uppercase tracking-wider">
                          속성
                        </label>
                        <div className="mt-1.5 space-y-1.5">
                          {obj.attributes.map((attr) => (
                            <AttributeSlider
                              key={attr.id}
                              attribute={attr}
                              onChange={(value) =>
                                handleObjectChange({
                                  ...obj,
                                  attributes: obj.attributes.map((a) =>
                                    a.id === attr.id ? { ...a, value } : a
                                  ),
                                })
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(obj.id)}
                      className="w-full rounded-lg border border-red-200/50 py-1.5 text-[11px] text-red-400 transition-colors hover:bg-red-50/50 hover:text-red-500"
                    >
                      속성 삭제
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

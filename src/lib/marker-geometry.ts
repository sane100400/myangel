export interface MarkerRect {
  width: number;
  height: number;
}

export interface MarkerPoint {
  cx: number;
  cy: number;
}

const MIN_MARKER_RADIUS = 0.02;
const MAX_MARKER_RADIUS = 0.5;

function safeRect(rect: MarkerRect): MarkerRect {
  return {
    width: Number.isFinite(rect.width) && rect.width > 0 ? rect.width : 1,
    height: Number.isFinite(rect.height) && rect.height > 0 ? rect.height : 1,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (min > max) return (min + max) / 2;
  return Math.min(max, Math.max(min, value));
}

export function markerRadiusFractions(
  rect: MarkerRect,
  radius: number
): { x: number; y: number } {
  const safe = safeRect(rect);
  const minSide = Math.min(safe.width, safe.height);
  const safeRadius = Math.max(0, radius);
  return {
    x: (safeRadius * minSide) / safe.width,
    y: (safeRadius * minSide) / safe.height,
  };
}

export function clampMarkerCenter(point: MarkerPoint): MarkerPoint {
  return {
    cx: clamp(point.cx, 0, 1),
    cy: clamp(point.cy, 0, 1),
  };
}

export function clampMarkerRadius(radius: number): number {
  return clamp(radius, MIN_MARKER_RADIUS, MAX_MARKER_RADIUS);
}

import * as React from "react";

interface OrnProps {
  size?: number;
  className?: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
}

// ─── Latin Cross with trefoil flourishes ──────────────────────
export function OrnateCross({
  size = 18,
  className = "",
  stroke = "currentColor",
  strokeWidth = 1.2,
  fill = "none",
}: OrnProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="5.5" y1="9" x2="18.5" y2="9" />
      <path d="M10.5 3.2 Q12 1.6 13.5 3.2" />
      <path d="M10.5 20.8 Q12 22.4 13.5 20.8" />
      <path d="M5.7 7.5 Q4.1 9 5.7 10.5" />
      <path d="M18.3 7.5 Q19.9 9 18.3 10.5" />
      <circle cx="12" cy="9" r="0.9" fill={stroke} stroke="none" />
    </svg>
  );
}

// ─── Line heart ───────────────────────────────────────────────
export function LineHeart({
  size = 16,
  className = "",
  stroke = "currentColor",
  strokeWidth = 1.4,
  fill = "none",
}: OrnProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 20 C 12 20, 3.5 14, 3.5 8.2 C 3.5 5.4, 5.5 3.4, 8 3.4 C 9.9 3.4, 11.6 4.8, 12 6.8 C 12.4 4.8, 14.1 3.4, 16 3.4 C 18.5 3.4, 20.5 5.4, 20.5 8.2 C 20.5 14, 12 20, 12 20 Z" />
    </svg>
  );
}

// ─── 8-pointed sparkle star ───────────────────────────────────
export function SparkleStar({
  size = 14,
  className = "",
  stroke = "currentColor",
  strokeWidth = 1,
  fill = "currentColor",
}: OrnProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2 L13.2 9.6 L20.8 10.8 L14.4 14.6 L16.4 22 L12 17.4 L7.6 22 L9.6 14.6 L3.2 10.8 L10.8 9.6 Z" opacity="0.6" />
      <path d="M12 5 L13 10.4 L18.4 11.4 L13.6 14.2 L15 19.2 L12 16 L9 19.2 L10.4 14.2 L5.6 11.4 L11 10.4 Z" />
    </svg>
  );
}

// ─── Single angel wing ────────────────────────────────────────
export function AngelWing({
  size = 48,
  className = "",
  stroke = "currentColor",
  strokeWidth = 1,
  fill = "none",
  flip = false,
}: OrnProps & { flip?: boolean }) {
  return (
    <svg
      width={size}
      height={size * 0.58}
      viewBox="0 0 60 36"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden="true"
    >
      <path d="M2 30 Q 10 4, 58 3 Q 50 9, 44 13 Q 52 15, 54 20 Q 44 20, 36 24 Q 44 24, 44 30 Q 32 26, 20 28 Q 28 28, 26 33 Q 12 30, 2 30 Z" />
      <path d="M8 28 Q 16 16, 42 8" opacity="0.45" strokeWidth={0.8} />
      <path d="M14 29 Q 22 21, 46 14" opacity="0.4" strokeWidth={0.8} />
      <path d="M20 30 Q 28 24, 48 20" opacity="0.4" strokeWidth={0.8} />
      <path d="M26 31 Q 32 28, 46 26" opacity="0.35" strokeWidth={0.8} />
    </svg>
  );
}

// ─── Halo with rays ───────────────────────────────────────────
export function HaloRays({
  size = 56,
  className = "",
  stroke = "currentColor",
  strokeWidth = 1,
  fill = "none",
}: OrnProps) {
  const rays = Array.from({ length: 20 }, (_, i) => {
    const angle = (i * 18 * Math.PI) / 180;
    const inner = 14;
    const outer = i % 2 === 0 ? 23 : 19;
    const x1 = 28 + Math.cos(angle) * inner;
    const y1 = 28 + Math.sin(angle) * inner;
    const x2 = 28 + Math.cos(angle) * outer;
    const y2 = 28 + Math.sin(angle) * outer;
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
  });
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="28" cy="28" r="12" />
      <circle cx="28" cy="28" r="9" opacity="0.45" strokeWidth={0.6} />
      {rays}
    </svg>
  );
}

// ─── Quill pen ────────────────────────────────────────────────
export function Quill({
  size = 18,
  className = "",
  stroke = "currentColor",
  strokeWidth = 1.2,
  fill = "none",
}: OrnProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 3 Q 14 4, 9 9 Q 4 14, 3 21 Q 10 20, 15 15 Q 20 10, 20 3 Z" />
      <path d="M3 21 L 10 14" strokeWidth={strokeWidth * 0.9} />
      <path d="M9 12 L 13 8" opacity="0.5" />
      <path d="M11 14 L 15 10" opacity="0.5" />
    </svg>
  );
}

// ─── Hourglass ────────────────────────────────────────────────
export function Hourglass({
  size = 18,
  className = "",
  stroke = "currentColor",
  strokeWidth = 1.2,
  fill = "none",
}: OrnProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 3 L18 3" />
      <path d="M6 21 L18 21" />
      <path d="M6 3 Q6 9, 12 12 Q18 15, 18 21" />
      <path d="M18 3 Q18 9, 12 12 Q6 15, 6 21" />
      <circle cx="12" cy="12" r="0.8" fill={stroke} stroke="none" />
    </svg>
  );
}

// ─── Fleur / leaf flourish ────────────────────────────────────
export function Fleur({
  size = 18,
  className = "",
  stroke = "currentColor",
  strokeWidth = 1.2,
  fill = "none",
}: OrnProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3 Q 7 8, 12 13 Q 17 8, 12 3 Z" />
      <path d="M12 13 L12 21" />
      <path d="M8 17 Q 12 15, 16 17" />
      <circle cx="12" cy="8" r="0.9" fill={stroke} stroke="none" />
    </svg>
  );
}

// ─── Eye (for detection) ──────────────────────────────────────
export function RadiantEye({
  size = 18,
  className = "",
  stroke = "currentColor",
  strokeWidth = 1.2,
  fill = "none",
}: OrnProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 12 Q 12 5, 21 12 Q 12 19, 3 12 Z" />
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="1" fill={stroke} stroke="none" />
      <line x1="12" y1="2" x2="12" y2="4" opacity="0.6" />
      <line x1="3" y1="4" x2="5" y2="5.5" opacity="0.6" />
      <line x1="21" y1="4" x2="19" y2="5.5" opacity="0.6" />
    </svg>
  );
}

// ─── Chalice / cup ────────────────────────────────────────────
export function Chalice({
  size = 18,
  className = "",
  stroke = "currentColor",
  strokeWidth = 1.2,
  fill = "none",
}: OrnProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 4 L18 4 Q18 12, 12 13 Q6 12, 6 4 Z" />
      <line x1="12" y1="13" x2="12" y2="19" />
      <line x1="8" y1="20" x2="16" y2="20" />
      <path d="M6 7 L18 7" opacity="0.5" />
    </svg>
  );
}

// ─── Globe / orb ──────────────────────────────────────────────
export function Orb({
  size = 18,
  className = "",
  stroke = "currentColor",
  strokeWidth = 1.2,
  fill = "none",
}: OrnProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="13" r="8" />
      <path d="M4 13 Q12 7, 20 13" />
      <path d="M12 5 Q 7 13, 12 21" />
      <path d="M12 5 Q 17 13, 12 21" />
      <path d="M10 3 L14 3" />
      <line x1="12" y1="3" x2="12" y2="5" />
    </svg>
  );
}

// ─── Corner flourish (absolute decorative) ────────────────────
export function CornerFlourish({
  size = 72,
  className = "",
  stroke = "currentColor",
  strokeWidth = 1,
  rotate = 0,
}: OrnProps & { rotate?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <path d="M4 4 L 30 4" />
      <path d="M4 4 L 4 30" />
      <path d="M4 4 Q 12 12, 4 20" opacity="0.6" />
      <path d="M4 4 Q 12 4, 12 12 Q 12 20, 4 20" opacity="0.5" />
      <path d="M12 4 Q 20 4, 20 12" opacity="0.5" />
      <path d="M4 12 Q 4 20, 12 20" opacity="0.5" />
      <circle cx="4" cy="4" r="1.6" fill={stroke} stroke="none" />
      <circle cx="30" cy="4" r="1.2" fill={stroke} stroke="none" opacity="0.6" />
      <circle cx="4" cy="30" r="1.2" fill={stroke} stroke="none" opacity="0.6" />
    </svg>
  );
}

// ─── Ribbon tail — purely decorative flourish ─────────────────
export function RibbonTails({ className = "" }: { className?: string }) {
  return (
    <svg
      width="120"
      height="26"
      viewBox="0 0 120 26"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 13 Q 30 2, 60 13 Q 90 24, 116 13"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M10 13 Q 30 6, 60 13 Q 90 20, 110 13"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.35"
      />
      <circle cx="4" cy="13" r="1.4" fill="currentColor" opacity="0.6" />
      <circle cx="116" cy="13" r="1.4" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

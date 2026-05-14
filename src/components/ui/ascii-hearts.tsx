"use client";

/**
 * 4 visually distinct SVG hearts for the hero section.
 */

const HEART =
  "M50 88 C50 88 2 58 2 30 C2 10 16 0 34 0 C43 0 50 6 50 14 C50 6 57 0 66 0 C84 0 98 10 98 30 C98 58 50 88 50 88Z";

const HEART_COLOR = "white";
const HEART_SHADOW = "drop-shadow(0 0 6px rgba(255,255,255,0.7))";

/* ── 1. Dot-filled (브레일 도트) ── */
function DotHeart({ size, style, className }: HProps) {
  return (
    <svg viewBox="0 0 100 90" width={size} height={size * 0.9}
      className={className} style={style} aria-hidden="true">
      <defs>
        <pattern id="pat-dot" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.8" fill={HEART_COLOR} />
        </pattern>
      </defs>
      <path d={HEART} fill="url(#pat-dot)" filter={HEART_SHADOW} />
    </svg>
  );
}

/* ── 2. Outline dashed (윤곽선) ── */
function OutlineHeart({ size, style, className }: HProps) {
  return (
    <svg viewBox="0 0 100 90" width={size} height={size * 0.9}
      className={className} style={style} aria-hidden="true">
      <path d={HEART} fill="none" stroke={HEART_COLOR} strokeWidth="3"
        strokeDasharray="4 3" filter={HEART_SHADOW} />
    </svg>
  );
}

/* ── 3. Striped (가로줄) ── */
function StripedHeart({ size, style, className }: HProps) {
  return (
    <svg viewBox="0 0 100 90" width={size} height={size * 0.9}
      className={className} style={style} aria-hidden="true">
      <defs>
        <pattern id="pat-stripe" width="100" height="5" patternUnits="userSpaceOnUse">
          <line x1="0" y1="2" x2="100" y2="2" stroke={HEART_COLOR} strokeWidth="1.5" />
        </pattern>
      </defs>
      <path d={HEART} fill="url(#pat-stripe)" filter={HEART_SHADOW} />
    </svg>
  );
}

/* ── 4. Cross-hatch (격자) ── */
function CrossHeart({ size, style, className }: HProps) {
  return (
    <svg viewBox="0 0 100 90" width={size} height={size * 0.9}
      className={className} style={style} aria-hidden="true">
      <defs>
        <pattern id="pat-cross" width="8" height="8" patternUnits="userSpaceOnUse">
          <line x1="0" y1="4" x2="8" y2="4" stroke={HEART_COLOR} strokeWidth="0.8" />
          <line x1="4" y1="0" x2="4" y2="8" stroke={HEART_COLOR} strokeWidth="0.8" />
        </pattern>
      </defs>
      <path d={HEART} fill="url(#pat-cross)" filter={HEART_SHADOW} />
    </svg>
  );
}

interface HProps {
  size: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Each heart has a zone (top/left ranges in %) and size range.
 */
// Desktop zones (큰 하트, 넓은 영역)
const DESKTOP_ZONE_DEFS = [
  { Comp: DotHeart, size: 138, top: "18%", left: "9%" },
  { Comp: OutlineHeart, size: 112, top: "15%", right: "12%" },
  { Comp: CrossHeart, size: 96, top: "63%", right: "10%" },
  { Comp: StripedHeart, size: 78, top: "68%", left: "15%" },
];

// Mobile zones — 좌상단 + 우중단, 자연스럽게 분산
const MOBILE_ZONE_DEFS = [
  { Comp: OutlineHeart, size: 84, top: "9%", left: "5%" },
  { Comp: OutlineHeart, size: 72, top: "42%", right: "6%" },
];

interface HeartDef {
  Comp: React.ComponentType<HProps>;
  size: number;
  top: string;
  left?: string;
  right?: string;
}

export function AsciiHearts() {
  const desktopHearts: HeartDef[] = DESKTOP_ZONE_DEFS;
  const mobileHearts: HeartDef[] = MOBILE_ZONE_DEFS;

  return (
    <>
      {/* Desktop hearts */}
      {desktopHearts.map((h, i) => {
        const Comp = h.Comp;
        return (
          <Comp
            key={`d-${i}`}
            size={h.size}
            className="ascii-heart pointer-events-none absolute z-[1] select-none hidden md:block"
            style={{
              top: h.top,
              left: h.left,
              right: h.right,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        );
      })}
      {/* Mobile hearts — smaller, edge-positioned */}
      {mobileHearts.map((h, i) => {
        const Comp = h.Comp;
        return (
          <Comp
            key={`m-${i}`}
            size={h.size}
            className="ascii-heart pointer-events-none absolute z-[1] select-none opacity-80 md:hidden"
            style={{
              top: h.top,
              left: h.left,
              right: h.right,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        );
      })}
    </>
  );
}

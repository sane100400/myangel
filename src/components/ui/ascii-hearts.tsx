/**
 * 4 visually distinct SVG hearts for the hero section.
 * Each uses a different fill pattern for genuine variety.
 */

const HEART =
  "M50 88 C50 88 2 58 2 30 C2 10 16 0 34 0 C43 0 50 6 50 14 C50 6 57 0 66 0 C84 0 98 10 98 30 C98 58 50 88 50 88Z";

/* ── 1. Dot-filled heart (브레일 도트 느낌) ── */
function DotHeart({ size, style, className }: HProps) {
  return (
    <svg viewBox="0 0 100 90" width={size} height={size * 0.9}
      className={className} style={style} aria-hidden="true">
      <defs>
        <pattern id="pat-dot" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.8" fill="white" />
        </pattern>
      </defs>
      <path d={HEART} fill="url(#pat-dot)"
        filter="drop-shadow(0 0 6px rgba(255,255,255,0.7))" />
    </svg>
  );
}

/* ── 2. Outline heart (윤곽선만, ○ 느낌) ── */
function OutlineHeart({ size, style, className }: HProps) {
  return (
    <svg viewBox="0 0 100 90" width={size} height={size * 0.9}
      className={className} style={style} aria-hidden="true">
      <path d={HEART} fill="none" stroke="white" strokeWidth="3"
        strokeDasharray="4 3"
        filter="drop-shadow(0 0 6px rgba(255,255,255,0.7))" />
    </svg>
  );
}

/* ── 3. Striped heart (가로줄 패턴) ── */
function StripedHeart({ size, style, className }: HProps) {
  return (
    <svg viewBox="0 0 100 90" width={size} height={size * 0.9}
      className={className} style={style} aria-hidden="true">
      <defs>
        <pattern id="pat-stripe" width="100" height="5" patternUnits="userSpaceOnUse">
          <line x1="0" y1="2" x2="100" y2="2" stroke="white" strokeWidth="1.5" />
        </pattern>
      </defs>
      <path d={HEART} fill="url(#pat-stripe)"
        filter="drop-shadow(0 0 6px rgba(255,255,255,0.7))" />
    </svg>
  );
}

/* ── 4. Cross-hatch heart (격자 패턴, ┏┛ 프레임 느낌) ── */
function CrossHeart({ size, style, className }: HProps) {
  return (
    <svg viewBox="0 0 100 90" width={size} height={size * 0.9}
      className={className} style={style} aria-hidden="true">
      <defs>
        <pattern id="pat-cross" width="8" height="8" patternUnits="userSpaceOnUse">
          <line x1="0" y1="4" x2="8" y2="4" stroke="white" strokeWidth="0.8" />
          <line x1="4" y1="0" x2="4" y2="8" stroke="white" strokeWidth="0.8" />
        </pattern>
      </defs>
      <path d={HEART} fill="url(#pat-cross)"
        filter="drop-shadow(0 0 6px rgba(255,255,255,0.7))" />
    </svg>
  );
}

interface HProps {
  size: number;
  className?: string;
  style?: React.CSSProperties;
}

const POSITIONS = [
  { Comp: DotHeart,     size: 140, top: "18%", left: "12%" },
  { Comp: OutlineHeart, size: 110, top: "25%", right: "14%" },
  { Comp: CrossHeart,   size: 100, top: "65%", right: "12%" },
  { Comp: StripedHeart, size: 80,  top: "72%", left: "15%" },
];

export function AsciiHearts() {
  return (
    <>
      {POSITIONS.map((p, i) => {
        const Comp = p.Comp;
        return (
          <Comp
            key={i}
            size={p.size}
            className="ascii-heart pointer-events-none absolute z-[1] select-none"
            style={{
              top: p.top,
              left: p.left,
              right: p.right,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        );
      })}
    </>
  );
}

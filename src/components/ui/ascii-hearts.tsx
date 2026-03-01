/**
 * 4 dot-pattern SVG hearts for the hero section.
 * Renders perfectly on every device — no font dependency.
 * White dots + glow, mimics braille/ASCII dot-art aesthetic.
 */

/* Chubby heart SVG path (wide, round lobes) */
const HEART_PATH =
  "M50 88 C50 88 2 58 2 30 C2 10 16 0 34 0 C43 0 50 6 50 14 C50 6 57 0 66 0 C84 0 98 10 98 30 C98 58 50 88 50 88Z";

function DotHeart({
  size,
  dotR,
  gap,
  className,
  style,
}: {
  size: number;
  /** dot radius */
  dotR: number;
  /** grid cell size (controls dot density) */
  gap: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  /* Unique pattern id per instance */
  const id = `dots-${size}-${dotR}-${gap}`;

  return (
    <svg
      viewBox="0 0 100 90"
      width={size}
      height={size * 0.9}
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={id}
          width={gap}
          height={gap}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={gap / 2} cy={gap / 2} r={dotR} fill="white" />
        </pattern>
      </defs>
      <path
        d={HEART_PATH}
        fill={`url(#${id})`}
        filter="drop-shadow(0 0 6px rgba(255,255,255,0.7)) drop-shadow(0 0 14px rgba(180,160,220,0.25))"
      />
    </svg>
  );
}

const HEARTS = [
  { size: 140, dotR: 2.0, gap: 6.5, top: "18%", left: "12%" },
  { size: 110, dotR: 1.8, gap: 6,   top: "25%", right: "14%" },
  { size: 100, dotR: 1.6, gap: 5.5, top: "65%", right: "12%" },
  { size: 80,  dotR: 1.5, gap: 5,   top: "72%", left: "15%" },
];

export function AsciiHearts() {
  return (
    <>
      {HEARTS.map((h, i) => (
        <DotHeart
          key={i}
          size={h.size}
          dotR={h.dotR}
          gap={h.gap}
          className="ascii-heart pointer-events-none absolute z-[1] select-none"
          style={{
            top: h.top,
            left: h.left,
            right: h.right,
            animationDelay: `${i * 1.5}s`,
          }}
        />
      ))}
    </>
  );
}

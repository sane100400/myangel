/**
 * 4 distinct dot-pattern SVG hearts for the hero section.
 * Each heart has a different shape for variety.
 * White dots + glow, mimics braille/ASCII dot-art aesthetic.
 */

/* 1. Classic chubby — wide round lobes, pointy bottom */
const CHUBBY =
  "M50 88 C50 88 2 58 2 30 C2 10 16 0 34 0 C43 0 50 6 50 14 C50 6 57 0 66 0 C84 0 98 10 98 30 C98 58 50 88 50 88Z";

/* 2. Slim tall — elongated, elegant */
const SLIM =
  "M50 92 C50 92 12 62 12 38 C12 20 24 8 38 8 C45 8 50 16 50 24 C50 16 55 8 62 8 C76 8 88 20 88 38 C88 62 50 92 50 92Z";

/* 3. Round soft — wider, less pointy, cute */
const ROUND =
  "M50 82 C50 82 4 56 4 33 C4 14 17 3 34 3 C43 3 50 11 50 19 C50 11 57 3 66 3 C83 3 96 14 96 33 C96 56 50 82 50 82Z";

/* 4. Angular — geometric, slightly sharper lobes */
const ANGULAR =
  "M50 90 C50 90 3 52 3 28 C3 8 18 0 35 0 C45 0 50 10 50 16 C50 10 55 0 65 0 C82 0 97 8 97 28 C97 52 50 90 50 90Z";

function DotHeart({
  path,
  size,
  dotR,
  gap,
  className,
  style,
  id,
}: {
  path: string;
  size: number;
  dotR: number;
  gap: number;
  className?: string;
  style?: React.CSSProperties;
  id: string;
}) {
  return (
    <svg
      viewBox="0 0 100 95"
      width={size}
      height={size * 0.95}
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
        d={path}
        fill={`url(#${id})`}
        filter="drop-shadow(0 0 6px rgba(255,255,255,0.7)) drop-shadow(0 0 14px rgba(180,160,220,0.25))"
      />
    </svg>
  );
}

const HEARTS = [
  { path: CHUBBY,  size: 140, dotR: 2.0, gap: 6.5, top: "18%", left: "12%",  id: "h1" },
  { path: SLIM,    size: 110, dotR: 1.6, gap: 5,   top: "25%", right: "14%", id: "h2" },
  { path: ROUND,   size: 100, dotR: 1.8, gap: 6,   top: "65%", right: "12%", id: "h3" },
  { path: ANGULAR, size: 80,  dotR: 1.4, gap: 5,   top: "72%", left: "15%",  id: "h4" },
];

export function AsciiHearts() {
  return (
    <>
      {HEARTS.map((h, i) => (
        <DotHeart
          key={h.id}
          id={h.id}
          path={h.path}
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

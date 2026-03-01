/**
 * 4 dot-art hearts for the hero section.
 * Grid-aligned for perfect symmetry. Tiny dot size for delicate look.
 */

/* 11 wide × 9 tall — large filled */
const H1 = [
  "  ●●   ●●",
  " ●●●● ●●●●",
  "●●●●●●●●●●●",
  "●●●●●●●●●●●",
  " ●●●●●●●●●",
  "  ●●●●●●●",
  "   ●●●●●",
  "    ●●●",
  "     ●",
].join("\n");

/* 9 wide × 7 tall — medium filled */
const H2 = [
  " ●●   ●●",
  "●●●● ●●●●",
  "●●●●●●●●●",
  " ●●●●●●●",
  "  ●●●●●",
  "   ●●●",
  "    ●",
].join("\n");

/* 9 wide × 8 tall — medium outline */
const H3 = [
  " ○○   ○○",
  "○  ○ ○  ○",
  "○   ○   ○",
  "○       ○",
  " ○     ○",
  "  ○   ○",
  "   ○ ○",
  "    ○",
].join("\n");

/* 7 wide × 5 tall — small filled */
const H4 = [
  " ●   ●",
  "●●● ●●●",
  " ●●●●●",
  "  ●●●",
  "   ●",
].join("\n");

const SHADOW = "0 0 8px rgba(255,255,255,0.85), 0 0 20px rgba(180,160,220,0.2)";

const HEARTS = [
  { art: H1, top: "6%",  left: "3%",  fontSize: 6 },
  { art: H3, top: "8%",  right: "4%", fontSize: 7 },
  { art: H4, top: "70%", left: "5%",  fontSize: 7 },
  { art: H2, top: "66%", right: "3%", fontSize: 6 },
];

export function AsciiHearts() {
  return (
    <>
      {HEARTS.map((h, i) => (
        <pre
          key={i}
          aria-hidden="true"
          className="ascii-heart pointer-events-none absolute z-[1] select-none"
          style={{
            top: h.top,
            left: h.left,
            right: h.right,
            color: "#ffffff",
            fontSize: h.fontSize,
            fontFamily: "monospace",
            lineHeight: 1.4,
            letterSpacing: "0.02em",
            textShadow: SHADOW,
            animationDelay: `${i * 1.5}s`,
          }}
        >
          {h.art}
        </pre>
      ))}
    </>
  );
}

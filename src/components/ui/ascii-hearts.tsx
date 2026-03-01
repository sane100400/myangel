/**
 * 4 dot-art hearts for the hero section background.
 * Uses ● (BLACK CIRCLE) — renders perfectly in every OS/browser.
 * White color + glow shadow. No rotation. Monospace for alignment.
 */

const H1 = `\
  ●●    ●●
 ●●●●  ●●●●
●●●●●●●●●●●●
●●●●●●●●●●●●
 ●●●●●●●●●●
  ●●●●●●●●
   ●●●●●●
    ●●●●
     ●●`;

const H2 = `\
 ●●  ●●
●●●●●●●●
●●●●●●●●
 ●●●●●●
  ●●●●
   ●●`;

const H3 = `\
 ○○  ○○
○  ○○  ○
○      ○
 ○    ○
  ○  ○
   ○○`;

const H4 = `\
●● ●●
●●●●●
 ●●●
  ●`;

const FONT = 'monospace';
const SHADOW = "0 0 12px rgba(255,255,255,0.9), 0 0 30px rgba(180,160,220,0.3)";

interface Pos {
  art: string;
  top: string;
  left?: string;
  right?: string;
  fontSize: number;
}

const HEARTS: Pos[] = [
  { art: H1, top: "8%",  left: "3%",  fontSize: 10 },
  { art: H3, top: "12%", right: "4%", fontSize: 12 },
  { art: H2, top: "65%", right: "3%", fontSize: 9 },
  { art: H4, top: "72%", left: "5%",  fontSize: 14 },
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
            fontFamily: FONT,
            lineHeight: 1.3,
            letterSpacing: "0.05em",
            textShadow: SHADOW,
            animationDelay: `${i * 1.2}s`,
          }}
        >
          {h.art}
        </pre>
      ))}
    </>
  );
}

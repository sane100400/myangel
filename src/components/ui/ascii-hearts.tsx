/**
 * Decorative braille-dot heart ASCII art for the hero section.
 * Based on: https://a-zer0-c.tistory.com/10
 *
 * - White color + soft glow shadow
 * - Monospace font (braille-supporting) for alignment
 * - No rotation — straight placement
 * - Absolutely positioned inside the hero section (not fixed)
 */

const HEART = `\
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⡗⣄⠀⠀⠀⠀⠀⠜⡣⠤⠤⢄⠀⡠⠤⠤⣼⠣⠀⠀⠀⠀⢀⡰⢳
⠠⡓⠤⠍⠉⠉⠑⠢⡜⠀⠀⠀⠀⠑⠋⠀⠀⠀⠀⢣⠊⠉⣀⠀⡠⠔⣳
⠀⠹⣖⣂⢈⠉⠃⢀⢧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⠀⠋⢈⠇⢐⠾⠁
⠀⠀⠈⠁⠊⠉⠈⠁⠈⢷⢄⠀⠀⠀⠀⠀⢀⡠⠊⠀⠉⠈⠉⠉⠉⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠲⢄⡤⠒⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀`;

const FONT =
  '"DejaVu Sans Mono", "Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols 2", monospace';

const SHADOW =
  "0 0 10px rgba(255,255,255,0.8), 0 0 24px rgba(124,92,173,0.25)";

interface HeartPos {
  top: string;
  left?: string;
  right?: string;
  fontSize: number;
  show: "all" | "md" | "lg";
  delay: string;
}

const POSITIONS: HeartPos[] = [
  // ── mobile ──
  { top: "8%",   left: "1%",  fontSize: 12, show: "all", delay: "0s" },
  { top: "60%",  right: "1%", fontSize: 12, show: "all", delay: "2s" },

  // ── tablet ──
  { top: "5%",   right: "1%", fontSize: 14, show: "md",  delay: "1s" },
  { top: "50%",  left: "1%",  fontSize: 14, show: "md",  delay: "3s" },

  // ── desktop ──
  { top: "10%",  left: "1%",  fontSize: 18, show: "lg",  delay: "0s" },
  { top: "30%",  right: "1%", fontSize: 20, show: "lg",  delay: "1.5s" },
  { top: "65%",  left: "2%",  fontSize: 18, show: "lg",  delay: "2.5s" },
  { top: "80%",  right: "2%", fontSize: 16, show: "lg",  delay: "3.5s" },
];

const showClass: Record<string, string> = {
  all: "",
  md: "hidden md:block",
  lg: "hidden lg:block",
};

export function AsciiHearts() {
  return (
    <>
      {POSITIONS.map((p, i) => (
        <pre
          key={i}
          aria-hidden="true"
          className={`ascii-heart pointer-events-none absolute z-[1] select-none leading-none ${showClass[p.show]}`}
          style={{
            top: p.top,
            left: p.left,
            right: p.right,
            color: "#ffffff",
            fontSize: p.fontSize,
            fontFamily: FONT,
            textShadow: SHADOW,
            animationDelay: p.delay,
          }}
        >
          {HEART}
        </pre>
      ))}
    </>
  );
}

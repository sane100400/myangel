/**
 * Decorative ASCII-art hearts scattered across the page background.
 * Uses braille-dot characters for the heart shapes.
 * Fully responsive: fewer / smaller hearts on mobile.
 */

const TINY = `\
 ⣀⡀ ⣀⡀
 ⠹⣿⣿⠏
  ⠙⠋`;

const SM = `\
 ⣠⣶⣄ ⣠⣶⣄
⢰⣿⣿⣿⣿⣿⣿⡆
 ⠻⣿⣿⣿⣿⠟
   ⠻⠟`;

const MD = `\
  ⣠⣶⣶⣄ ⣠⣶⣶⣄
 ⣾⣿⣿⣿⣿⣿⣿⣿⣿⣷
  ⠻⣿⣿⣿⣿⣿⣿⠟
    ⠻⣿⣿⠟
     ⠙⠋`;

const LG = `\
   ⣠⣶⣶⣶⣄ ⣠⣶⣶⣶⣄
  ⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷
  ⠹⣿⣿⣿⣿⣿⣿⣿⣿⣿⠏
    ⠹⣿⣿⣿⣿⣿⠏
      ⠹⣿⠏
       ⠁`;

interface HeartDef {
  art: string;
  top: string;
  left?: string;
  right?: string;
  rotate: number;
  opacity: number;
  color: string;
  /** "all" | "md" | "lg" — minimum breakpoint to show */
  show: "all" | "md" | "lg";
  delay: string;
}

const HEARTS: HeartDef[] = [
  // ── mobile-visible (tiny, edges) ──
  { art: TINY, top: "6%",  left: "2%",  rotate: -12, opacity: 0.06, color: "var(--angel-blue-light)", show: "all", delay: "0s" },
  { art: TINY, top: "55%", right: "3%", rotate: 18,  opacity: 0.05, color: "var(--angel-lavender-light)", show: "all", delay: "1.5s" },
  { art: TINY, top: "85%", left: "4%",  rotate: -8,  opacity: 0.055, color: "var(--angel-pink-light)", show: "all", delay: "3s" },

  // ── tablet+ (sm / md hearts) ──
  { art: SM, top: "18%", right: "2%", rotate: 10,  opacity: 0.045, color: "var(--angel-lavender-light)", show: "md", delay: "0.5s" },
  { art: SM, top: "72%", left: "1%",  rotate: -15, opacity: 0.04,  color: "var(--angel-blue-light)", show: "md", delay: "2s" },
  { art: MD, top: "42%", right: "1%", rotate: 6,   opacity: 0.035, color: "var(--angel-pink-light)", show: "md", delay: "1s" },

  // ── desktop only (lg hearts + extras) ──
  { art: LG, top: "12%", left: "0%",  rotate: -5,  opacity: 0.03,  color: "var(--angel-blue-light)", show: "lg", delay: "0s" },
  { art: MD, top: "60%", right: "0%", rotate: 8,   opacity: 0.03,  color: "var(--angel-lavender-light)", show: "lg", delay: "2.5s" },
  { art: SM, top: "92%", right: "5%", rotate: -10, opacity: 0.04,  color: "var(--angel-pink-light)", show: "lg", delay: "3.5s" },
];

const showClass: Record<string, string> = {
  all: "",
  md:  "hidden md:block",
  lg:  "hidden lg:block",
};

export function AsciiHearts() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden"
    >
      {HEARTS.map((h, i) => (
        <pre
          key={i}
          className={`ascii-heart absolute leading-tight ${showClass[h.show]}`}
          style={{
            top: h.top,
            left: h.left,
            right: h.right,
            transform: `rotate(${h.rotate}deg)`,
            opacity: h.opacity,
            color: h.color,
            animationDelay: h.delay,
          }}
        >
          {h.art}
        </pre>
      ))}
    </div>
  );
}

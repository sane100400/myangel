/**
 * Decorative ASCII-art hearts — fixed overlay on the viewport.
 * Uses braille-dot characters for the heart shapes.
 * pointer-events: none so all clicks pass through.
 * Responsive: fewer hearts on mobile, more on desktop.
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
  // ── mobile + all ──
  { art: TINY, top: "10%",  left: "3%",   rotate: -12, opacity: 0.18, color: "var(--angel-blue)",     show: "all", delay: "0s" },
  { art: TINY, top: "75%",  right: "4%",  rotate: 15,  opacity: 0.15, color: "var(--angel-lavender)", show: "all", delay: "2s" },

  // ── tablet+ ──
  { art: SM,   top: "30%",  right: "3%",  rotate: 10,  opacity: 0.13, color: "var(--angel-pink)",     show: "md",  delay: "0.8s" },
  { art: SM,   top: "60%",  left: "2%",   rotate: -10, opacity: 0.14, color: "var(--angel-lavender)", show: "md",  delay: "1.5s" },
  { art: TINY, top: "90%",  left: "8%",   rotate: 20,  opacity: 0.16, color: "var(--angel-blue)",     show: "md",  delay: "3s" },

  // ── desktop ──
  { art: MD,   top: "15%",  right: "2%",  rotate: 8,   opacity: 0.10, color: "var(--angel-pink)",     show: "lg",  delay: "0.5s" },
  { art: LG,   top: "45%",  left: "1%",   rotate: -6,  opacity: 0.08, color: "var(--angel-blue)",     show: "lg",  delay: "1.2s" },
  { art: MD,   top: "82%",  right: "1%",  rotate: 12,  opacity: 0.09, color: "var(--angel-lavender)", show: "lg",  delay: "2.8s" },
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
      className="pointer-events-none fixed inset-0 z-[2] select-none overflow-hidden"
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

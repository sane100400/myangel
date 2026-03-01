/**
 * Decorative ASCII-art heart patterns — fixed overlay.
 * Uses universally-supported Unicode hearts (♡ ♥ ✦ ✧).
 * pointer-events: none so all clicks pass through.
 */

const HEART_A = `\
  ♡♡  ♡♡
 ♡♡♡♡♡♡♡
 ♡♡♡♡♡♡♡
  ♡♡♡♡♡
   ♡♡♡
    ♡`;

const HEART_B = `\
 ♥♥ ♥♥
♥♥♥♥♥♥♥
 ♥♥♥♥♥
  ♥♥♥
   ♥`;

const HEART_C = `\
 ♡  ♡
♡♡♡♡♡
 ♡♡♡
  ♡`;

const HEART_D = `\
✧ ♡ ✧`;

const HEART_E = `\
♡`;

interface HeartDef {
  art: string;
  top: string;
  left?: string;
  right?: string;
  rotate: number;
  opacity: number;
  color: string;
  fontSize: string;
  show: "all" | "md" | "lg";
  delay: string;
}

const HEARTS: HeartDef[] = [
  // ── mobile (small, visible) ──
  { art: HEART_C, top: "8%",   left: "2%",   rotate: -10, opacity: 0.10, color: "var(--angel-blue)",     fontSize: "14px", show: "all", delay: "0s" },
  { art: HEART_E, top: "35%",  right: "5%",  rotate: 15,  opacity: 0.12, color: "var(--angel-lavender)", fontSize: "28px", show: "all", delay: "1.5s" },
  { art: HEART_D, top: "62%",  left: "3%",   rotate: -5,  opacity: 0.10, color: "var(--angel-pink)",     fontSize: "16px", show: "all", delay: "3s" },
  { art: HEART_E, top: "85%",  right: "4%",  rotate: 12,  opacity: 0.11, color: "var(--angel-blue)",     fontSize: "24px", show: "all", delay: "2s" },

  // ── tablet ──
  { art: HEART_B, top: "18%",  right: "3%",  rotate: 8,   opacity: 0.08, color: "var(--angel-lavender)", fontSize: "14px", show: "md", delay: "0.5s" },
  { art: HEART_C, top: "50%",  left: "2%",   rotate: -12, opacity: 0.09, color: "var(--angel-blue)",     fontSize: "16px", show: "md", delay: "1.8s" },
  { art: HEART_E, top: "72%",  right: "8%",  rotate: -18, opacity: 0.10, color: "var(--angel-pink)",     fontSize: "20px", show: "md", delay: "2.5s" },

  // ── desktop ──
  { art: HEART_A, top: "12%",  left: "1%",   rotate: -6,  opacity: 0.07, color: "var(--angel-blue)",     fontSize: "16px", show: "lg", delay: "0s" },
  { art: HEART_B, top: "42%",  right: "1%",  rotate: 10,  opacity: 0.06, color: "var(--angel-pink)",     fontSize: "18px", show: "lg", delay: "1.2s" },
  { art: HEART_A, top: "75%",  left: "0%",   rotate: 5,   opacity: 0.06, color: "var(--angel-lavender)", fontSize: "14px", show: "lg", delay: "2.8s" },
  { art: HEART_D, top: "92%",  right: "3%",  rotate: -8,  opacity: 0.09, color: "var(--angel-blue)",     fontSize: "18px", show: "lg", delay: "3.5s" },
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
          className={`ascii-heart absolute leading-[1.1] ${showClass[h.show]}`}
          style={{
            top: h.top,
            left: h.left,
            right: h.right,
            transform: `rotate(${h.rotate}deg)`,
            opacity: h.opacity,
            color: h.color,
            fontSize: h.fontSize,
            animationDelay: h.delay,
          }}
        >
          {h.art}
        </pre>
      ))}
    </div>
  );
}

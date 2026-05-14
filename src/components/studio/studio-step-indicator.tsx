export function StudioStepDot({
  n,
  label,
  active = false,
}: {
  n: string;
  label: string;
  active?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${
          active
            ? "bg-[var(--angel-blue)] text-white shadow-[0_2px_6px_rgba(91,155,213,0.4)]"
            : "border border-[var(--angel-border)] bg-white/70 text-[var(--angel-text-faint)]"
        }`}
      >
        {n}
      </span>
      <span
        className={
          active
            ? "text-[var(--angel-text)] font-semibold"
            : "text-[var(--angel-text-faint)]"
        }
      >
        {label}
      </span>
    </span>
  );
}

export function StudioStepArrow() {
  return (
    <svg
      width="14"
      height="10"
      viewBox="0 0 14 10"
      fill="none"
      aria-hidden
      className="text-[var(--angel-lavender)]/55"
    >
      <path
        d="M1 5h11m0 0L8 1m4 4L8 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

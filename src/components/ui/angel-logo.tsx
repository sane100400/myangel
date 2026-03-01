interface AngelLogoProps {
  /** Height in px. Width is auto-calculated from aspect ratio. */
  size?: number;
  className?: string;
  priority?: boolean;
}

// Original: 604×524 → ratio ≈ 1.153
const ASPECT = 604 / 524;
// logo-sm.webp: 184×160 (≤80px 표시용), logo.webp: 604×524 (원본)
const SM_THRESHOLD = 48;

export function AngelLogo({ size = 32, className = "", priority = false }: AngelLogoProps) {
  const w = Math.round(size * ASPECT);
  const useSmall = size <= SM_THRESHOLD;

  return (
    <picture>
      {!useSmall && <source media="(max-width: 640px)" srcSet="/logo-sm.webp" type="image/webp" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={useSmall ? "/logo-sm.webp" : "/logo.webp"}
        alt="MyAngel"
        width={w}
        height={size}
        className={className}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        style={{ height: size, width: "auto", transform: "scaleX(0.82)" }}
      />
    </picture>
  );
}

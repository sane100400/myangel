interface AngelLogoProps {
  /** Height in px. Width is auto-calculated from aspect ratio. */
  size?: number;
  className?: string;
  priority?: boolean;
}

// Original: 604×524 → ratio ≈ 1.153
const ASPECT = 604 / 524;

export function AngelLogo({ size = 32, className = "", priority = false }: AngelLogoProps) {
  const w = Math.round(size * ASPECT);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.webp"
      alt="MyAngel"
      width={w}
      height={size}
      className={className}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      style={{ height: size, width: "auto", transform: "scaleX(0.82)" }}
    />
  );
}

import Image from "next/image";

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
    <Image
      src="/logo.png"
      alt="MyAngel"
      width={w}
      height={size}
      sizes={`${w}px`}
      priority={priority}
      className={className}
      style={{ height: size, width: "auto", transform: "scaleX(0.82)" }}
    />
  );
}

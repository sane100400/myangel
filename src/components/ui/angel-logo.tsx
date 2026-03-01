interface AngelLogoProps {
  /** Height in px. Width is auto-calculated from aspect ratio. */
  size?: number;
  className?: string;
  priority?: boolean;
}

export function AngelLogo({ size = 32, className = "", priority = false }: AngelLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.webp"
      alt="MyAngel"
      height={size}
      className={className}
      style={{ height: size, width: "auto" }}
      {...(priority ? { fetchPriority: "high" } : {})}
    />
  );
}

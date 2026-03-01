interface AngelLogoProps {
  size?: number;
  desktopSize?: number;
  className?: string;
  priority?: boolean;
}

export function AngelLogo({ size = 32, desktopSize, className = "", priority = false }: AngelLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.webp"
      alt="MyAngel"
      width={desktopSize ?? size}
      height={desktopSize ?? size}
      className={className}
      style={{ transform: "scaleX(0.85)" }}
      {...(priority ? { fetchPriority: "high" } : {})}
    />
  );
}

import Image from "next/image";

interface AngelLogoProps {
  /** Mobile size (px). Desktop will use desktopSize if provided. */
  size?: number;
  desktopSize?: number;
  className?: string;
  priority?: boolean;
}

export function AngelLogo({ size = 32, desktopSize, className = "", priority = false }: AngelLogoProps) {
  const ds = desktopSize ?? size;
  return (
    <Image
      src="/logo.webp"
      alt="MyAngel"
      width={Math.round(ds * 0.8)}
      height={ds}
      className={className}
      style={{
        transform: "scaleX(0.85)",
        width: desktopSize ? undefined : Math.round(size * 0.8),
        height: desktopSize ? undefined : size,
      }}
      priority={priority}
    />
  );
}

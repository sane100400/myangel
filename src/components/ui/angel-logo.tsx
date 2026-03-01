import Image from "next/image";

interface AngelLogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export function AngelLogo({ size = 32, className = "", priority = false }: AngelLogoProps) {
  return (
    <Image
      src="/logo.webp"
      alt="MyAngel"
      width={Math.round(size * 0.8)}
      height={size}
      className={className}
      style={{ transform: "scaleX(0.85)" }}
      priority={priority}
    />
  );
}

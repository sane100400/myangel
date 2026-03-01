/* eslint-disable @next/next/no-img-element */
interface AngelLogoProps {
  size?: number;
  className?: string;
}

export function AngelLogo({ size = 32, className = "" }: AngelLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="MyAngel"
      width={Math.round(size * 0.8)}
      height={size}
      className={className}
      style={{ transform: "scaleX(0.85)" }}
    />
  );
}

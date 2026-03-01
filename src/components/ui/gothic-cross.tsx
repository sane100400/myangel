interface GothicCrossProps {
  size?: number;
  className?: string;
  color?: string;
}

/**
 * 텍스트 십자가 아이콘. 크기/색상 props 유지.
 */
export function GothicCross({ size = 20, className = "", color = "#8b6cb8" }: GothicCrossProps) {
  return (
    <span
      className={className}
      style={{ fontSize: `${size}px`, color, lineHeight: 1 }}
    >
      ✟
    </span>
  );
}

"use client";

interface MoodboardGridProps {
  centerImage: string | null;
  surroundingImages: string[];
  onCenterClick: () => void;
}

export function MoodboardGrid({
  centerImage,
  surroundingImages,
  onCenterClick,
}: MoodboardGridProps) {
  const cells = Array.from({ length: 9 }, (_, i) => {
    if (i === 4) {
      return { type: "center" as const, image: centerImage };
    }
    const sIdx = i < 4 ? i : i - 1;
    return {
      type: "surrounding" as const,
      image: surroundingImages[sIdx] || null,
    };
  });

  return (
    <div className="grid grid-cols-3 gap-2 aspect-square max-w-[520px] mx-auto">
      {cells.map((cell, i) => (
        <div
          key={i}
          className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${
            cell.type === "center"
              ? "glass-card cursor-pointer pulse-glow"
              : "border border-white/30 bg-white/20 backdrop-blur-sm"
          } ${!cell.image ? "" : ""}`}
          onClick={cell.type === "center" ? onCenterClick : undefined}
        >
          {cell.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cell.image}
              alt={cell.type === "center" ? "중심 무드 이미지" : "무드 이미지"}
              className="h-full w-full object-cover"
            />
          ) : cell.type === "center" ? (
            <div className="flex h-full items-center justify-center p-4 text-center">
              <div>
                <div className="mb-2 text-xl text-[var(--angel-lavender)] twinkle">✦</div>
                <p className="text-[10px] text-[var(--angel-text-faint)] tracking-[0.06em]">
                  이미지를 넣어주세요
                </p>
                <p className="mt-1 text-[9px] text-[var(--angel-text-faint)] opacity-60">
                  클릭 또는 드래그
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--angel-lavender)]/20" />
            </div>
          )}

          {cell.type === "center" && cell.image && (
            <div className="absolute top-2 left-2 rounded-full bg-gradient-to-r from-[var(--angel-blue)]/90 to-[var(--angel-lavender)]/90 px-2.5 py-0.5 text-[8px] font-medium tracking-[0.12em] text-white shadow-sm backdrop-blur-sm">
              CENTER
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

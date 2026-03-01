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
    <div className="mx-auto max-w-[520px]">
      <div className="grid grid-cols-3 gap-2">
        {cells.map((cell, i) => (
          <div
            key={i}
            className="relative aspect-square overflow-hidden rounded-xl"
          >
            {/* Cell background */}
            <div
              className={`absolute inset-0 transition-all duration-300 ${
                cell.type === "center"
                  ? cell.image
                    ? "ring-2 ring-[var(--angel-blue)]/50"
                    : "bg-white/80 border-2 border-dashed border-[var(--angel-blue)]/40 cursor-pointer hover:bg-white hover:border-[var(--angel-blue)]/60"
                  : cell.image
                    ? "bg-[#e8ecf4]"
                    : "bg-[#edf0f8] border border-[#d8dde9]"
              } rounded-xl`}
              onClick={cell.type === "center" ? onCenterClick : undefined}
            />

            {/* Image */}
            {cell.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cell.image}
                alt={cell.type === "center" ? "중심 코디 사진" : "무드 이미지"}
                className="relative h-full w-full object-cover rounded-xl"
              />
            ) : cell.type === "center" ? (
              <div
                className="relative flex h-full items-center justify-center p-4 text-center cursor-pointer"
                onClick={onCenterClick}
              >
                <div>
                  <div className="mb-3 flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--angel-blue)]/10">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--angel-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[12px] font-medium text-[var(--angel-text)]">
                    사진을 올려주세요
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--angel-text-soft)]">
                    클릭 또는 드래그
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative flex h-full items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--angel-lavender)]/30" />
              </div>
            )}

            {/* Center badge */}
            {cell.type === "center" && cell.image && (
              <div className="absolute top-2 left-2 rounded-full bg-[var(--angel-blue)] px-2.5 py-0.5 text-[9px] font-medium tracking-[0.1em] text-white shadow-sm">
                CENTER
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

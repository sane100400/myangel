"use client";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

export function PromptInput({
  value,
  onChange,
  onAnalyze,
  isLoading,
}: PromptInputProps) {
  return (
    <div>
      <textarea
        placeholder={
          "원하는 이미지를 설명해주세요\n예: 하얀 침대가 있는 몽환적인 방, 창문으로 들어오는 부드러운 햇살"
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onAnalyze();
          }
        }}
        disabled={isLoading}
        rows={3}
        className="w-full rounded-xl bg-white/70 border border-[var(--angel-border)] px-4 py-3 text-[14px] text-[var(--angel-text)] placeholder-[var(--angel-text-soft)]/60 outline-none transition-all resize-none focus:bg-white focus:border-[var(--angel-blue)]/50 focus:shadow-[0_0_20px_rgba(126,184,216,0.15)]"
      />
      <button
        onClick={onAnalyze}
        disabled={!value.trim() || isLoading}
        className="mt-3 w-full angel-btn angel-btn-primary py-3 text-[15px] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="twinkle text-[12px]">✦</span>
            장면을 분석하고 있어요...
            <span
              className="twinkle text-[12px]"
              style={{ animationDelay: "0.5s" }}
            >
              ✦
            </span>
          </span>
        ) : (
          <>
            <span className="text-[12px]">✦</span>
            프롬프트 분석하기
          </>
        )}
      </button>
    </div>
  );
}

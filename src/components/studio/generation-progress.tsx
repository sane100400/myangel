"use client";

import { useEffect, useRef, useState } from "react";

export interface ProgressState {
  active: boolean;
  total: number;        // 요청한 장수
  completed: number;    // 성공한 장수
  failed: number;       // 실패한 장수
  startedAt: number | null;
  message?: string;     // 마지막 단계 메시지
}

export const initialProgress: ProgressState = {
  active: false,
  total: 0,
  completed: 0,
  failed: 0,
  startedAt: null,
  message: undefined,
};

interface Props {
  state: ProgressState;
  className?: string;
}

/**
 * 실제 SSE 이벤트 기반 progress bar.
 * - 진행률 = (completed + failed) / total
 * - 시뮬레이션 없음 — 모델 호출이 끝나면 카운트가 올라감
 */
export function GenerationProgress({ state, className }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (state.active) {
      setVisible(true);
      const tick = () => {
        if (state.startedAt) {
          setElapsed((Date.now() - state.startedAt) / 1000);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (visible) {
        const t = setTimeout(() => setVisible(false), 800);
        return () => clearTimeout(t);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.active, state.startedAt]);

  if (!visible) return null;

  const total = Math.max(1, state.total);
  const finished = state.completed + state.failed;
  const inFlight = Math.max(0, total - finished);
  // 모델은 진행률을 주지 않으므로, 경과 시간 기반 ease-out 추정 (장당 ~25s 가정, 최대 90%)
  const EXPECTED_SEC_PER_IMAGE = 25;
  const slotEstimate =
    state.active && inFlight > 0
      ? (1 - Math.exp(-elapsed / EXPECTED_SEC_PER_IMAGE)) * 0.9
      : 0;
  const ratio = state.active
    ? Math.min(0.99, (finished + inFlight * slotEstimate) / total)
    : finished / total;
  const pctDisplay = Math.round(ratio * 100);

  const stageText =
    !state.active && state.completed > 0
      ? `완료 (${state.completed}/${state.total}장)`
      : state.message ||
        (finished === 0
          ? "모델 호출 중"
          : `${finished}/${state.total}장 완료`);

  return (
    <div
      className={`rounded-lg border border-[var(--angel-border)] bg-[var(--angel-surface)] px-4 py-3.5 ${className ?? ""}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pctDisplay}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--angel-text)]">
          {state.active && (
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--angel-blue)] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--angel-blue)]" />
            </span>
          )}
          {stageText}
        </span>
        <span className="tabular-nums text-[12px] text-[var(--angel-text-faint)]">
          {pctDisplay}% · {elapsed < 1 ? "0s" : `${Math.floor(elapsed)}s`}
          {state.failed > 0 && (
            <span className="ml-1 text-amber-600">· 실패 {state.failed}</span>
          )}
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-md bg-[var(--angel-blue)]/10">
        <div
          className="absolute inset-y-0 left-0 rounded-md bg-[var(--angel-blue)]"
          style={{
            width: `${pctDisplay}%`,
            transition: "width 220ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
        {/* 도트로 각 슬롯 표시 */}
        <div className="absolute inset-0 flex pointer-events-none">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-white/40 last:border-r-0"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

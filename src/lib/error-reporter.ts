// 클라이언트 에러 자동 수집기. window.onerror + unhandledrejection 잡아서 /api/log-error로 전송.
// 재귀 방지·throttle·sampling 포함.

interface SendArgs {
  kind: "client" | "unhandled_rejection" | "react";
  level?: "warn" | "error" | "fatal";
  message: string;
  stack?: string;
  url?: string;
  meta?: Record<string, unknown>;
}

const RECENT_HASHES = new Map<string, number>();
const DEDUP_WINDOW_MS = 30_000;
const MAX_PER_MINUTE = 10;
let countSinceMinute = 0;
let minuteStart = Date.now();

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h.toString(36);
}

function shouldSend(message: string, stack?: string): boolean {
  const now = Date.now();
  // 분당 최대치
  if (now - minuteStart > 60_000) {
    minuteStart = now;
    countSinceMinute = 0;
  }
  if (countSinceMinute >= MAX_PER_MINUTE) return false;

  // dedup (같은 에러 30초 내 1회만)
  const k = hash(message + (stack ?? "").slice(0, 200));
  const last = RECENT_HASHES.get(k);
  if (last && now - last < DEDUP_WINDOW_MS) return false;
  RECENT_HASHES.set(k, now);
  if (RECENT_HASHES.size > 100) {
    const oldest = RECENT_HASHES.keys().next().value;
    if (oldest) RECENT_HASHES.delete(oldest);
  }
  countSinceMinute += 1;
  return true;
}

export function reportError(args: SendArgs): void {
  if (typeof window === "undefined") return;
  if (!shouldSend(args.message, args.stack)) return;
  try {
    const body = JSON.stringify({
      kind: args.kind,
      level: args.level ?? "error",
      message: args.message,
      stack: args.stack,
      url: args.url ?? window.location.href,
      meta: args.meta,
    });
    // sendBeacon이 있으면 page-unload 안전
    if (navigator.sendBeacon && typeof Blob !== "undefined") {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/log-error", blob);
    } else {
      void fetch("/api/log-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // 자체 실패는 silent
  }
}

let installed = false;
export function installGlobalHandlers(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (e) => {
    reportError({
      kind: "client",
      message: e.message || (e.error?.message as string) || "(unknown)",
      stack: e.error?.stack,
      meta: { filename: e.filename, lineno: e.lineno, colno: e.colno },
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason;
    let message = "(unhandled rejection)";
    let stack: string | undefined;
    if (reason instanceof Error) {
      message = reason.message;
      stack = reason.stack;
    } else if (typeof reason === "string") {
      message = reason;
    } else if (reason && typeof reason === "object") {
      try {
        message = JSON.stringify(reason).slice(0, 500);
      } catch {}
    }
    reportError({
      kind: "unhandled_rejection",
      message,
      stack,
    });
  });
}

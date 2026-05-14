// 가벼운 구조화 로거. JSON Lines 형식으로 stdout에 출력 — journalctl 파싱 친화.
// 외부 의존성 없음. 필요 시 pino/winston으로 교체 용이.

type Level = "debug" | "info" | "warn" | "error";

const LEVEL_RANK: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const MIN_LEVEL: Level =
  (process.env.LOG_LEVEL as Level) ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

interface LogContext {
  [k: string]: unknown;
}

function emit(level: Level, msg: string, ctx?: LogContext, base?: LogContext) {
  if (LEVEL_RANK[level] < LEVEL_RANK[MIN_LEVEL]) return;
  const entry = {
    t: new Date().toISOString(),
    level,
    msg,
    ...(base ?? {}),
    ...(ctx ?? {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export interface Logger {
  debug: (msg: string, ctx?: LogContext) => void;
  info: (msg: string, ctx?: LogContext) => void;
  warn: (msg: string, ctx?: LogContext) => void;
  error: (msg: string, ctx?: LogContext) => void;
  child: (ctx: LogContext) => Logger;
}

function build(base: LogContext = {}): Logger {
  return {
    debug: (m, c) => emit("debug", m, c, base),
    info: (m, c) => emit("info", m, c, base),
    warn: (m, c) => emit("warn", m, c, base),
    error: (m, c) => emit("error", m, c, base),
    child: (c) => build({ ...base, ...c }),
  };
}

export const logger: Logger = build();

// 서버 측 fatal/error를 error_logs에도 기록할 때 호출
// (logger 자체는 외부 의존성 없음을 유지하기 위해 별도 helper로 둠)
export async function reportServerError(args: {
  route: string;
  error: unknown;
  userId?: string | null;
  meta?: LogContext;
}): Promise<void> {
  const msg = args.error instanceof Error ? args.error.message : String(args.error);
  const stack = args.error instanceof Error ? args.error.stack : undefined;
  logger.error(`route ${args.route} error`, { msg, ...(args.meta ?? {}) });
  try {
    const { recordError } = await import("./error-store");
    await recordError({
      kind: "server",
      level: "error",
      message: msg,
      stack,
      url: args.route,
      meta: args.meta as Record<string, unknown> | undefined,
      user_id: args.userId ?? null,
    });
  } catch {
    // recordError 자체 실패는 무시 (재귀 방지)
  }
}

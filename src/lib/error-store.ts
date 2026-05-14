// 에러 로그 저장소. service-role로 RLS 우회.
import { getAdminClient } from "./supabase/admin";

export type ErrorKind = "client" | "server" | "unhandled_rejection" | "react";
export type ErrorLevel = "warn" | "error" | "fatal";

export interface ErrorLogInput {
  kind: ErrorKind;
  level?: ErrorLevel;
  message: string;
  stack?: string | null;
  url?: string | null;
  user_agent?: string | null;
  meta?: Record<string, unknown> | null;
  user_id?: string | null;
  ip_hash?: string | null;
}

const MAX_MESSAGE = 2000;
const MAX_STACK = 8000;
const MAX_URL = 1000;
const MAX_UA = 500;

export async function recordError(input: ErrorLogInput): Promise<void> {
  try {
    const sb = getAdminClient();
    await sb.from("error_logs").insert({
      kind: input.kind,
      level: input.level ?? "error",
      message: (input.message ?? "").slice(0, MAX_MESSAGE) || "(empty)",
      stack: input.stack ? input.stack.slice(0, MAX_STACK) : null,
      url: input.url ? input.url.slice(0, MAX_URL) : null,
      user_agent: input.user_agent ? input.user_agent.slice(0, MAX_UA) : null,
      meta: input.meta ?? null,
      user_id: input.user_id ?? null,
      ip_hash: input.ip_hash ?? null,
    });
  } catch {
    // 로깅 시스템 자체 실패 — silent (재귀 방지)
  }
}

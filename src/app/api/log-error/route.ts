import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordError } from "@/lib/error-store";
import { hashIP } from "@/lib/discover-store";
import { rateLimitOk, rateKey, assertSameOrigin } from "@/lib/api-guard";

const ALLOWED_KINDS = new Set(["client", "react", "unhandled_rejection"]);
const ALLOWED_LEVELS = new Set(["warn", "error", "fatal"]);

export async function POST(request: NextRequest) {
  const blocked = assertSameOrigin(request);
  if (blocked) return blocked;

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const ipHash = hashIP(ip);

  if (!rateLimitOk(rateKey("log-error", ipHash, request), 30, 60_000)) {
    return NextResponse.json({ ok: true, throttled: true });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const kind = typeof body.kind === "string" && ALLOWED_KINDS.has(body.kind) ? body.kind : "client";
  const level = typeof body.level === "string" && ALLOWED_LEVELS.has(body.level) ? body.level : "error";
  const message = typeof body.message === "string" ? body.message : "(no message)";
  const stack = typeof body.stack === "string" ? body.stack : null;
  const url = typeof body.url === "string" ? body.url : null;
  const meta =
    body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
      ? (body.meta as Record<string, unknown>)
      : null;
  const userAgent = request.headers.get("user-agent");

  // user_id 식별 (선택 — 로그인 안 했어도 OK)
  let userId: string | null = null;
  try {
    const sb = await createClient();
    const { data } = await sb.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {}

  await recordError({
    kind: kind as "client" | "react" | "unhandled_rejection",
    level: level as "warn" | "error" | "fatal",
    message,
    stack,
    url,
    user_agent: userAgent,
    meta,
    user_id: userId,
    ip_hash: ipHash,
  });

  return NextResponse.json({ ok: true });
}

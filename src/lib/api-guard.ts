import { NextRequest, NextResponse } from "next/server";

// ── 동일 출처 검증 (CSRF 가벼운 방어) ──
const ORIGIN_ALLOWLIST = new Set([
  "https://ku-myangel.site",
  "https://www.ku-myangel.site",
  "http://34.56.233.158",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
  "http://localhost",
  "http://localhost:80",
]);

function isLoopbackHttpOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "http:" &&
      (url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "::1" ||
        url.hostname === "[::1]")
    );
  } catch {
    return false;
  }
}

/** Origin 헤더가 있으면 화이트리스트 확인. 없으면 통과 (same-origin GET 등). */
export function assertSameOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  const requestOrigin = new URL(req.url).origin;
  if (origin === requestOrigin) return null;
  if (isLoopbackHttpOrigin(origin) && isLoopbackHttpOrigin(requestOrigin)) return null;
  if (!ORIGIN_ALLOWLIST.has(origin)) {
    return NextResponse.json({ error: "잘못된 요청 출처" }, { status: 403 });
  }
  return null;
}

// ── 가벼운 in-memory 레이트 리미터 ──
// 멀티 인스턴스 운영에선 부정확하지만, 단일 노드(GCP VM 1대) 환경에서 충분.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimitOk(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}

/** 부착된 Supabase 세션 user.id 또는 IP 해시를 키로 사용. */
export function rateKey(scope: string, userId: string | null, req: NextRequest): string {
  if (userId) return `${scope}:u:${userId}`;
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0]?.trim() || "unknown";
  return `${scope}:ip:${ip}`;
}

// ── 공통 image base64 검증 ──
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
};

export function verifyImageMagic(base64: string, claimedMime: string): boolean {
  const sigs = MAGIC_BYTES[claimedMime];
  if (!sigs) return false;
  try {
    const binaryStr = atob(base64.slice(0, 24));
    const bytes = Array.from(binaryStr, (c) => c.charCodeAt(0));
    return sigs.some((sig) => sig.every((byte, i) => bytes[i] === byte));
  } catch {
    return false;
  }
}

/** data: URL 전체에서 mime/base64 분리 + 매직바이트까지 검증. */
export function parseAndVerifyDataUrl(
  dataUrl: string,
  maxBase64Bytes: number
): { ok: true; mime: string; base64: string } | { ok: false; error: string } {
  const m = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
  if (!m) return { ok: false, error: "올바른 이미지 형식이 아닙니다." };
  const mime = m[1];
  const base64 = m[2];
  if (base64.length > maxBase64Bytes) {
    return { ok: false, error: "이미지가 너무 큽니다." };
  }
  if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
    return { ok: false, error: "잘못된 이미지 데이터입니다." };
  }
  if (!verifyImageMagic(base64, mime)) {
    return { ok: false, error: "이미지 파일 형식이 올바르지 않아요." };
  }
  return { ok: true, mime, base64 };
}

// ── 외부 fetch SSRF 방어용 호스트 화이트리스트 ──
const SAFE_FETCH_HOSTS = [
  "oaiusercontent.com",
  "openai.com",
  "openaiapi-site.azureedge.net",
];

export function isSafeFetchUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return SAFE_FETCH_HOSTS.some(
      (host) => u.hostname === host || u.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

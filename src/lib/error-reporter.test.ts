/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// 모듈 초기화 시점 카운터·맵을 매 테스트마다 새로 만들기 위해 동적 import + module 캐시 reset 사용
async function freshModule() {
  vi.resetModules();
  return await import("./error-reporter");
}

describe("error-reporter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } })
    );
    Object.defineProperty(navigator, "sendBeacon", { value: undefined, configurable: true });
  });

  it("dedups identical errors within window", async () => {
    const { reportError } = await freshModule();
    reportError({ kind: "client", message: "boom" });
    reportError({ kind: "client", message: "boom" });
    reportError({ kind: "client", message: "boom" });
    // 한 번만 fetch
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });

  it("differentiates distinct messages", async () => {
    const { reportError } = await freshModule();
    reportError({ kind: "client", message: "a" });
    reportError({ kind: "client", message: "b" });
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
  });

  it("throttles to MAX_PER_MINUTE (10) per minute", async () => {
    const { reportError } = await freshModule();
    for (let i = 0; i < 20; i++) {
      reportError({ kind: "client", message: `err-${i}` });
    }
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(10);
  });

  it("sends to /api/log-error with correct body", async () => {
    const { reportError } = await freshModule();
    reportError({
      kind: "client",
      message: "test",
      stack: "stack...",
      meta: { foo: 1 },
    });
    const fetchSpy = globalThis.fetch as ReturnType<typeof vi.fn>;
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/log-error");
    expect((init as RequestInit).method).toBe("POST");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.kind).toBe("client");
    expect(body.message).toBe("test");
    expect(body.stack).toBe("stack...");
    expect(body.meta.foo).toBe(1);
    expect(body.url).toBeTruthy();
  });
});

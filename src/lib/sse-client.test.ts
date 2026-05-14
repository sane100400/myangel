import { describe, it, expect, vi, beforeEach } from "vitest";
import { postSSE } from "./sse-client";

function makeSSEResponse(frames: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const f of frames) controller.enqueue(encoder.encode(f));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });
}

describe("postSSE", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("parses event/data frames and dispatches onMessage in order", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeSSEResponse([
        "event: stage\ndata: {\"stage\":\"started\"}\n\n",
        "event: image\ndata: {\"idx\":0}\n\n",
        "event: done\ndata: {\"count\":1}\n\n",
      ])
    );

    const events: { event: string; data: unknown }[] = [];
    await postSSE("/x", {}, {
      onMessage: (m) => events.push(m),
    });

    expect(events).toEqual([
      { event: "stage", data: { stage: "started" } },
      { event: "image", data: { idx: 0 } },
      { event: "done", data: { count: 1 } },
    ]);
  });

  it("handles split frames across chunks", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeSSEResponse([
        "event: stage\nda",
        "ta: {\"x\":1}\n\nevent: done\nda",
        "ta: {\"y\":2}\n\n",
      ])
    );

    const events: { event: string; data: unknown }[] = [];
    await postSSE("/x", {}, { onMessage: (m) => events.push(m) });
    expect(events).toEqual([
      { event: "stage", data: { x: 1 } },
      { event: "done", data: { y: 2 } },
    ]);
  });

  it("falls back to JSON error for non-stream content-type", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "크레딧 부족" }), {
        status: 402,
        headers: { "content-type": "application/json" },
      })
    );

    const onError = vi.fn();
    await postSSE("/x", {}, {
      onMessage: () => {},
      onError,
    });
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0].message).toBe("크레딧 부족");
  });

  it("forwards extra headers (e.g. Idempotency-Key)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeSSEResponse(["event: done\ndata: {}\n\n"])
    );
    await postSSE("/x", { foo: 1 }, {
      onMessage: () => {},
      headers: { "Idempotency-Key": "abc-123" },
    });
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toBe("abc-123");
    expect(headers["Content-Type"]).toBe("application/json");
  });
});

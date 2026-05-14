// Server-Sent Events 헬퍼. Next.js Route Handler에서 streaming Response 만들기.

export interface SSEStream {
  send: (event: string, data: unknown) => void;
  close: () => void;
  response: () => Response;
}

export function createSSEStream(): SSEStream {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
    cancel() {
      controller = null;
    },
  });

  function write(chunk: string) {
    if (!controller) return;
    try {
      controller.enqueue(encoder.encode(chunk));
    } catch {
      controller = null;
    }
  }

  return {
    send(event, data) {
      const payload = JSON.stringify(data);
      // SSE 데이터는 줄바꿈 분리 — 안전하게 escape
      write(`event: ${event}\ndata: ${payload}\n\n`);
    },
    close() {
      try {
        controller?.close();
      } catch {}
      controller = null;
    },
    response() {
      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no", // nginx buffering off
        },
      });
    },
  };
}

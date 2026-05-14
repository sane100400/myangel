// 클라이언트 측 SSE 파서. fetch + ReadableStream으로 POST body 지원.

export interface SSEMessage {
  event: string;
  data: unknown;
}

export interface SSEHandlers {
  onMessage: (msg: SSEMessage) => void;
  onError?: (err: Error) => void;
  onClose?: () => void;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export async function postSSE(
  url: string,
  body: unknown,
  handlers: SSEHandlers
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(handlers.headers ?? {}),
    },
    body: JSON.stringify(body),
    signal: handlers.signal,
  });

  // 비-스트리밍 에러 응답 처리 (401/402/400 등)
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/event-stream")) {
    let payload: { error?: string } = {};
    try {
      payload = await res.json();
    } catch {}
    const msg = payload.error || `요청 실패 (${res.status})`;
    handlers.onError?.(new Error(msg));
    handlers.onClose?.();
    return;
  }

  if (!res.body) {
    handlers.onError?.(new Error("응답 본문 없음"));
    handlers.onClose?.();
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE 메시지는 빈 줄(\n\n)로 구분
      let sepIdx;
      while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, sepIdx);
        buffer = buffer.slice(sepIdx + 2);
        const msg = parseSSEFrame(raw);
        if (msg) handlers.onMessage(msg);
      }
    }
  } catch (e) {
    if ((e as Error).name !== "AbortError") {
      handlers.onError?.(e as Error);
    }
  } finally {
    handlers.onClose?.();
  }
}

function parseSSEFrame(raw: string): SSEMessage | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of raw.split("\n")) {
    if (line.startsWith("event: ")) event = line.slice(7).trim();
    else if (line.startsWith("data: ")) dataLines.push(line.slice(6));
  }
  if (dataLines.length === 0) return null;
  const dataStr = dataLines.join("\n");
  let data: unknown;
  try {
    data = JSON.parse(dataStr);
  } catch {
    data = dataStr;
  }
  return { event, data };
}

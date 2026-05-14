import { describe, it, expect } from "vitest";
import { createSSEStream } from "./sse";

async function readAll(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let out = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  return out;
}

describe("createSSEStream", () => {
  it("encodes events as SSE frames", async () => {
    const sse = createSSEStream();
    const res = sse.response();
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    sse.send("stage", { stage: "started", n: 3 });
    sse.send("image", { idx: 0, image: "data:image/png;base64,AAA" });
    sse.send("done", { count: 1 });
    sse.close();

    const text = await readAll(res);
    expect(text).toContain('event: stage\ndata: {"stage":"started","n":3}\n\n');
    expect(text).toContain('event: image\ndata: {"idx":0,"image":"data:image/png;base64,AAA"}\n\n');
    expect(text).toContain('event: done\ndata: {"count":1}\n\n');
  });

  it("safely ignores send after close", async () => {
    const sse = createSSEStream();
    const res = sse.response();
    sse.send("a", { x: 1 });
    sse.close();
    sse.send("b", { x: 2 }); // 무시
    const text = await readAll(res);
    expect(text).toContain('event: a');
    expect(text).not.toContain('event: b');
  });
});

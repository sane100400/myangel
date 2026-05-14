import { describe, it, expect } from "vitest";
import {
  assertSameOrigin,
  rateLimitOk,
  verifyImageMagic,
  parseAndVerifyDataUrl,
  isSafeFetchUrl,
} from "./api-guard";

const TINY_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgAAIAAAUAAeImBZsAAAAASUVORK5CYII=";

describe("rateLimitOk", () => {
  it("allows requests under limit", () => {
    const key = `test-${Date.now()}-1`;
    expect(rateLimitOk(key, 3, 60_000)).toBe(true);
    expect(rateLimitOk(key, 3, 60_000)).toBe(true);
    expect(rateLimitOk(key, 3, 60_000)).toBe(true);
  });

  it("blocks once limit reached", () => {
    const key = `test-${Date.now()}-2`;
    rateLimitOk(key, 2, 60_000);
    rateLimitOk(key, 2, 60_000);
    expect(rateLimitOk(key, 2, 60_000)).toBe(false);
  });

  it("resets after window expires", async () => {
    const key = `test-${Date.now()}-3`;
    expect(rateLimitOk(key, 1, 50)).toBe(true);
    expect(rateLimitOk(key, 1, 50)).toBe(false);
    await new Promise((r) => setTimeout(r, 60));
    expect(rateLimitOk(key, 1, 50)).toBe(true);
  });
});

describe("verifyImageMagic", () => {
  it("accepts valid PNG", () => {
    expect(verifyImageMagic(TINY_PNG_B64, "image/png")).toBe(true);
  });
  it("rejects PNG bytes claimed as JPEG", () => {
    expect(verifyImageMagic(TINY_PNG_B64, "image/jpeg")).toBe(false);
  });
  it("rejects unsupported mime", () => {
    expect(verifyImageMagic(TINY_PNG_B64, "image/gif")).toBe(false);
  });
  it("rejects empty/garbage base64", () => {
    expect(verifyImageMagic("", "image/png")).toBe(false);
    expect(verifyImageMagic("!!!", "image/png")).toBe(false);
  });
});

describe("parseAndVerifyDataUrl", () => {
  it("parses valid PNG data URL", () => {
    const r = parseAndVerifyDataUrl(`data:image/png;base64,${TINY_PNG_B64}`, 1024 * 1024);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.mime).toBe("image/png");
      expect(r.base64).toBe(TINY_PNG_B64);
    }
  });

  it("rejects non-data-URL strings", () => {
    expect(parseAndVerifyDataUrl("not a data url", 1024).ok).toBe(false);
    expect(parseAndVerifyDataUrl("https://example.com/img.png", 1024).ok).toBe(false);
  });

  it("rejects oversize payload", () => {
    const r = parseAndVerifyDataUrl(
      `data:image/png;base64,${TINY_PNG_B64}`,
      10 // 10 byte cap
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/너무 큽/);
  });

  it("rejects bad base64 chars", () => {
    const r = parseAndVerifyDataUrl(`data:image/png;base64,$$$$$$`, 1024);
    expect(r.ok).toBe(false);
  });

  it("rejects forged mime", () => {
    const r = parseAndVerifyDataUrl(`data:image/jpeg;base64,${TINY_PNG_B64}`, 1024 * 1024);
    expect(r.ok).toBe(false);
  });
});

describe("isSafeFetchUrl", () => {
  it("allows https oaiusercontent.com host", () => {
    expect(isSafeFetchUrl("https://files.oaiusercontent.com/abc.png")).toBe(true);
  });

  it("allows https openai.com subdomain", () => {
    expect(isSafeFetchUrl("https://api.openai.com/v1/x")).toBe(true);
  });

  it("blocks http (insecure)", () => {
    expect(isSafeFetchUrl("http://files.oaiusercontent.com/abc.png")).toBe(false);
  });

  it("blocks unrelated host", () => {
    expect(isSafeFetchUrl("https://evil.example.com/leak")).toBe(false);
  });

  it("blocks localhost SSRF attempt", () => {
    expect(isSafeFetchUrl("http://localhost:9000/admin")).toBe(false);
    expect(isSafeFetchUrl("http://169.254.169.254/")).toBe(false);
  });

  it("blocks malformed URL", () => {
    expect(isSafeFetchUrl("not a url")).toBe(false);
  });

  it("blocks subdomain hijack with similar name", () => {
    expect(isSafeFetchUrl("https://oaiusercontent.com.evil.com/x")).toBe(false);
  });
});

describe("assertSameOrigin", () => {
  function makeReq(url: string, origin: string): Request {
    return new Request(url, { headers: { origin } });
  }

  it("allows loopback development origins across dynamic ports", () => {
    const result = assertSameOrigin(
      makeReq("http://localhost:3010/api/generate", "http://127.0.0.1:3010") as never
    );
    expect(result).toBeNull();
  });

  it("does not allow loopback origin against public production host", async () => {
    const result = assertSameOrigin(
      makeReq("https://ku-myangel.site/api/generate", "http://127.0.0.1:3010") as never
    );
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });
});

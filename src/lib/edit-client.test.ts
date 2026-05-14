import { describe, it, expect, vi, beforeEach } from "vitest";
import sharp from "sharp";
import type { EditRequest, ImageRef } from "./marker-protocol";

// gemini, openai 모듈을 mock해서 외부 호출 없이 dispatcher 흐름만 검증.
vi.mock("./gemini", () => ({
  genai: {
    models: {
      generateContent: vi.fn(),
    },
  },
}));
vi.mock("./openai", () => ({
  openai: {
    images: {
      edit: vi.fn(),
    },
  },
}));

import { genai } from "./gemini";
import { openai } from "./openai";
import { runMarkerEdit } from "./edit-client";

// 테스트용 base 이미지 (작은 PNG)
async function makeBaseImage(width = 64, height = 64): Promise<ImageRef> {
  const png = await sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 100, b: 50 } },
  })
    .png()
    .toBuffer();
  return { base64: png.toString("base64"), mimeType: "image/png" };
}

const PNG_PIXEL_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("runMarkerEdit dispatcher", () => {
  it("calls Gemini for nano-banana-pro and returns each image via onResult callback", async () => {
    (genai.models.generateContent as ReturnType<typeof vi.fn>).mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              { inlineData: { data: PNG_PIXEL_B64, mimeType: "image/png" } },
            ],
          },
        },
      ],
    });

    const base = await makeBaseImage();
    const req: EditRequest = {
      base,
      markers: [{ id: "m1", op: "remove", circle: { cx: 0.5, cy: 0.5, r: 0.1 } }],
      references: [],
      count: 3,
      quality: "1K",
      model: "nano-banana-pro",
    };

    const onStart = vi.fn();
    const onResult = vi.fn();
    const result = await runMarkerEdit(req, { onStart, onResult });

    expect(genai.models.generateContent).toHaveBeenCalledTimes(3);
    expect(openai.images.edit).not.toHaveBeenCalled();
    expect(result.images).toHaveLength(3);
    expect(result.errors).toHaveLength(0);
    expect(onStart).toHaveBeenCalledTimes(3);
    expect(onResult).toHaveBeenCalledTimes(3);
    // 모든 callback은 ok: true 결과여야 함
    for (const call of onResult.mock.calls) {
      expect(call[1].ok).toBe(true);
    }
  });

  it("calls OpenAI for gpt-image-2 with alpha mask", async () => {
    (openai.images.edit as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [{ b64_json: PNG_PIXEL_B64 }],
    });

    const base = await makeBaseImage();
    const req: EditRequest = {
      base,
      markers: [{ id: "m1", op: "replace", circle: { cx: 0.5, cy: 0.5, r: 0.1 }, refIndex: 0 }],
      references: [base], // ref이 있어야 replace 통과
      count: 1,
      quality: "1K",
      model: "gpt-image-2",
    };

    const result = await runMarkerEdit(req);

    expect(openai.images.edit).toHaveBeenCalledTimes(1);
    expect(genai.models.generateContent).not.toHaveBeenCalled();
    expect(result.images).toHaveLength(1);

    // 호출 인자에 mask가 들어갔는지
    const callArg = (openai.images.edit as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg.model).toBe("gpt-image-2");
    expect(Array.isArray(callArg.image)).toBe(true);
    expect(callArg.image).toHaveLength(2);
    expect(callArg.mask).toBeDefined();
    expect(callArg.prompt).toContain("op=replace");
    expect(callArg.input_fidelity).toBeUndefined();
    expect(callArg.quality).toBeUndefined();
    expect(Object.keys(callArg).sort()).toEqual(
      ["image", "mask", "model", "n", "prompt", "size"].sort()
    );
  });

  it("normalizes OpenAI masked edit inputs to a matching PNG canvas", async () => {
    (openai.images.edit as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [{ b64_json: PNG_PIXEL_B64 }],
    });

    const base = await makeBaseImage(160, 90);
    const ref = await makeBaseImage(48, 96);
    const req: EditRequest = {
      base,
      markers: [{ id: "m1", op: "replace", circle: { cx: 0.5, cy: 0.5, r: 0.1 }, refIndex: 0 }],
      references: [ref],
      count: 1,
      quality: "1K",
      model: "gpt-image-2",
    };

    await runMarkerEdit(req);

    const callArg = (openai.images.edit as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const imageFiles = Array.isArray(callArg.image) ? callArg.image : [callArg.image];
    expect(imageFiles).toHaveLength(2);
    expect(imageFiles[0].type).toBe("image/png");
    expect(imageFiles[1].type).toBe("image/png");
    expect(callArg.mask?.type).toBe("image/png");

    const baseMeta = await sharp(Buffer.from(await imageFiles[0].arrayBuffer())).metadata();
    const refMeta = await sharp(Buffer.from(await imageFiles[1].arrayBuffer())).metadata();
    const maskMeta = await sharp(Buffer.from(await callArg.mask!.arrayBuffer())).metadata();

    expect(baseMeta).toMatchObject({ width: 160, height: 90, format: "png" });
    expect(refMeta).toMatchObject({ width: 160, height: 90, format: "png" });
    expect(maskMeta).toMatchObject({ width: 160, height: 90, format: "png" });
    expect(maskMeta.hasAlpha).toBe(true);
  });

  it("passes the source aspect ratio to Gemini edit requests", async () => {
    (genai.models.generateContent as ReturnType<typeof vi.fn>).mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              { inlineData: { data: PNG_PIXEL_B64, mimeType: "image/png" } },
            ],
          },
        },
      ],
    });

    const base = await makeBaseImage(160, 90);
    const req: EditRequest = {
      base,
      markers: [{ id: "m1", op: "remove", circle: { cx: 0.5, cy: 0.5, r: 0.1 } }],
      references: [],
      count: 1,
      quality: "2K",
      model: "nano-banana-pro",
    };

    const result = await runMarkerEdit(req);
    expect(result.images).toHaveLength(1);

    const callArg = (genai.models.generateContent as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg.config.imageConfig).toMatchObject({
      aspectRatio: "16:9",
      imageSize: "2K",
    });
    expect(callArg.config.httpOptions.retryOptions.attempts).toBe(2);
    expect(callArg.contents[0].parts).toHaveLength(3);
    expect(callArg.contents[0].parts[0].inlineData).toBeDefined();
    expect(callArg.contents[0].parts[1].inlineData).toBeDefined();
    expect(callArg.contents[0].parts[2].text).toContain("Preserve the original canvas aspect ratio");
    expect(callArg.contents[0].parts[2].text).toContain(
      "Do not reproduce the mask, marker circles"
    );
  });

  it("uses only OpenAI-supported edit size values for 2K requests", async () => {
    (openai.images.edit as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [{ b64_json: PNG_PIXEL_B64 }],
    });

    const base = await makeBaseImage();
    const req: EditRequest = {
      base,
      markers: [{ id: "m1", op: "remove", circle: { cx: 0.5, cy: 0.5, r: 0.1 } }],
      references: [],
      count: 1,
      quality: "2K",
      model: "gpt-image-2",
    };

    const result = await runMarkerEdit(req);
    expect(result.images).toHaveLength(1);
    const callArg = (openai.images.edit as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(["1024x1024", "1536x1024", "1024x1536"]).toContain(callArg.size);
    expect(callArg.size).not.toBe("2048x2048");
    expect(callArg.quality).toBeUndefined();

    const outputBase64 = result.images[0].split(",")[1] ?? "";
    const outputMeta = await sharp(Buffer.from(outputBase64, "base64")).metadata();
    expect(outputMeta.width).toBe(2048);
    expect(outputMeta.height).toBe(2048);
  });

  it("post-processes GPT Image 2 edits to the source aspect ratio", async () => {
    (openai.images.edit as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [{ b64_json: PNG_PIXEL_B64 }],
    });

    const base = await makeBaseImage(160, 90);
    const req: EditRequest = {
      base,
      markers: [{ id: "m1", op: "remove", circle: { cx: 0.5, cy: 0.5, r: 0.1 } }],
      references: [],
      count: 1,
      quality: "2K",
      model: "gpt-image-2",
    };

    const result = await runMarkerEdit(req);
    const outputBase64 = result.images[0].split(",")[1] ?? "";
    const outputMeta = await sharp(Buffer.from(outputBase64, "base64")).metadata();
    expect(outputMeta.width).toBe(2048);
    expect(outputMeta.height).toBe(1152);
  });

  it("does not call OpenAI for unsupported 4K requests", async () => {
    const base = await makeBaseImage();
    const req: EditRequest = {
      base,
      markers: [{ id: "m1", op: "remove", circle: { cx: 0.5, cy: 0.5, r: 0.1 } }],
      references: [],
      count: 1,
      quality: "4K",
      model: "gpt-image-2",
    };

    const result = await runMarkerEdit(req);
    expect(openai.images.edit).not.toHaveBeenCalled();
    expect(result.images).toHaveLength(0);
    expect(result.errors[0]).toMatch(/4K/);
  });

  it("propagates per-call errors via onResult and aggregates them", async () => {
    let calls = 0;
    (genai.models.generateContent as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      calls += 1;
      if (calls === 1) throw new Error("rate limit");
      return {
        candidates: [{ content: { parts: [{ inlineData: { data: PNG_PIXEL_B64, mimeType: "image/png" } }] } }],
      };
    });

    const base = await makeBaseImage();
    const req: EditRequest = {
      base,
      markers: [{ id: "m1", op: "remove", circle: { cx: 0.5, cy: 0.5, r: 0.1 } }],
      references: [],
      count: 2,
      quality: "1K",
      model: "nano-banana-pro",
    };

    const onResult = vi.fn();
    const result = await runMarkerEdit(req, { onResult });
    expect(result.images).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/rate limit/);
    // 콜백 두 번 호출 — 1 ok, 1 fail
    const okCount = onResult.mock.calls.filter((c) => c[1].ok).length;
    const failCount = onResult.mock.calls.filter((c) => !c[1].ok).length;
    expect(okCount).toBe(1);
    expect(failCount).toBe(1);
  });

  it("returns empty for global-adjust only request (no markers, no mask)", async () => {
    (genai.models.generateContent as ReturnType<typeof vi.fn>).mockResolvedValue({
      candidates: [{ content: { parts: [{ inlineData: { data: PNG_PIXEL_B64, mimeType: "image/png" } }] } }],
    });

    const base = await makeBaseImage();
    const req: EditRequest = {
      base,
      markers: [],
      references: [],
      count: 1,
      quality: "1K",
      model: "nano-banana-pro",
      globalAdjust: { mood: "차분함", lighting: "푸른시간" },
    };

    const result = await runMarkerEdit(req);
    expect(result.images).toHaveLength(1);
    // mask/guide 없이 호출했는지 — parts에 mask inlineData가 없어야 함
    const callArg = (genai.models.generateContent as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const parts = callArg.contents[0].parts;
    // base 1개 + 텍스트 1개 = 2개 (mask 미포함)
    expect(parts.length).toBe(2);
  });

  it("handles Gemini empty-response gracefully without crashing", async () => {
    (genai.models.generateContent as ReturnType<typeof vi.fn>).mockResolvedValue({
      candidates: [{ content: { parts: [] } }],
    });

    const base = await makeBaseImage();
    const req: EditRequest = {
      base,
      markers: [{ id: "m1", op: "remove", circle: { cx: 0.5, cy: 0.5, r: 0.1 } }],
      references: [],
      count: 1,
      quality: "1K",
      model: "nano-banana-pro",
    };

    const result = await runMarkerEdit(req);
    expect(result.images).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("이미지 파트 없음");
  });
});

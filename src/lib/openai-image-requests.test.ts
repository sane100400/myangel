import { describe, expect, it } from "vitest";
import {
  buildGptImage2EditRequest,
  buildGptImage2GenerateRequest,
} from "./openai-image-requests";

const fakeImage = new File(["image"], "image.png", { type: "image/png" });
const fakeMask = new File(["mask"], "mask.png", { type: "image/png" });

describe("gpt-image-2 request builders", () => {
  it("keeps generate payload keys limited to the supported contract", () => {
    const payload = buildGptImage2GenerateRequest({
      prompt: "create an angel",
      size: "1024x1024",
    });

    expect(Object.keys(payload).sort()).toEqual(
      ["model", "n", "prompt", "size"].sort()
    );
    expect(payload).toMatchObject({
      model: "gpt-image-2",
      n: 1,
      size: "1024x1024",
    });
    expect("quality" in payload).toBe(false);
    expect("input_fidelity" in payload).toBe(false);
    expect("response_format" in payload).toBe(false);
  });

  it("keeps edit payload keys limited to the supported contract", () => {
    const payload = buildGptImage2EditRequest({
      image: [fakeImage],
      mask: fakeMask,
      prompt: "replace the selected area",
      size: "1536x1024",
    });

    expect(Object.keys(payload).sort()).toEqual(
      ["image", "mask", "model", "n", "prompt", "size"].sort()
    );
    expect(payload).toMatchObject({
      model: "gpt-image-2",
      n: 1,
      size: "1536x1024",
    });
    expect("quality" in payload).toBe(false);
    expect("input_fidelity" in payload).toBe(false);
    expect("response_format" in payload).toBe(false);
  });

  it("omits mask when no mask file is supplied", () => {
    const payload = buildGptImage2EditRequest({
      image: fakeImage,
      prompt: "edit globally",
      size: "1024x1536",
    });

    expect("mask" in payload).toBe(false);
  });

  it("rejects unsupported runtime size values", () => {
    expect(() =>
      buildGptImage2GenerateRequest({
        prompt: "create",
        size: "2048x2048" as never,
      })
    ).toThrow(/Unsupported gpt-image-2 image size/);
  });
});

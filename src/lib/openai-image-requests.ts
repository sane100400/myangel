import type {
  ImageEditParamsNonStreaming,
  ImageGenerateParamsNonStreaming,
} from "openai/resources/images";
import type { OpenAIImageSize } from "./image-models";

const GPT_IMAGE_2_MODEL = "gpt-image-2" as const;
const GPT_IMAGE_2_SIZES = new Set<OpenAIImageSize>([
  "1024x1024",
  "1536x1024",
  "1024x1536",
]);

export const GPT_IMAGE_2_GENERATE_KEYS = ["model", "prompt", "n", "size"] as const;
export const GPT_IMAGE_2_EDIT_KEYS = [
  "model",
  "image",
  "mask",
  "prompt",
  "n",
  "size",
] as const;

type GptImage2GenerateRequest = {
  model: typeof GPT_IMAGE_2_MODEL;
  prompt: string;
  n: 1;
  size: OpenAIImageSize;
};

type GptImage2EditRequest = {
  model: typeof GPT_IMAGE_2_MODEL;
  image: ImageEditParamsNonStreaming["image"];
  mask?: ImageEditParamsNonStreaming["mask"];
  prompt: string;
  n: 1;
  size: OpenAIImageSize;
};

function assertGptImage2Size(size: OpenAIImageSize): void {
  if (!GPT_IMAGE_2_SIZES.has(size)) {
    throw new Error(`Unsupported gpt-image-2 image size: ${size}`);
  }
}

function assertExactKeys(
  operation: string,
  payload: Record<string, unknown>,
  allowedKeys: readonly string[]
): void {
  const allowed = new Set(allowedKeys);
  const extra = Object.keys(payload).filter((key) => !allowed.has(key));
  if (extra.length > 0) {
    throw new Error(`Unsupported ${operation} payload key(s): ${extra.join(", ")}`);
  }
}

export function buildGptImage2GenerateRequest(args: {
  prompt: string;
  size: OpenAIImageSize;
}): ImageGenerateParamsNonStreaming {
  assertGptImage2Size(args.size);
  const payload = {
    model: GPT_IMAGE_2_MODEL,
    prompt: args.prompt,
    n: 1,
    size: args.size,
  } satisfies GptImage2GenerateRequest;
  assertExactKeys("gpt-image-2 generate", payload, GPT_IMAGE_2_GENERATE_KEYS);
  return payload;
}

export function buildGptImage2EditRequest(args: {
  image: ImageEditParamsNonStreaming["image"];
  mask?: ImageEditParamsNonStreaming["mask"];
  prompt: string;
  size: OpenAIImageSize;
}): ImageEditParamsNonStreaming {
  assertGptImage2Size(args.size);
  const payload = {
    model: GPT_IMAGE_2_MODEL,
    image: args.image,
    ...(args.mask ? { mask: args.mask } : {}),
    prompt: args.prompt,
    n: 1,
    size: args.size,
  } satisfies GptImage2EditRequest;
  assertExactKeys("gpt-image-2 edit", payload, GPT_IMAGE_2_EDIT_KEYS);
  return payload;
}

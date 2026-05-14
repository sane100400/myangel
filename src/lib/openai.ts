import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy",
  maxRetries: 0,
  timeout: 180_000,
});

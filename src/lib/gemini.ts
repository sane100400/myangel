import { GoogleGenAI } from "@google/genai";

export const genai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || "",
  httpOptions: {
    timeout: 180_000,
    retryOptions: { attempts: 2 },
  },
});

import { GoogleGenAI } from "@google/genai";
import { GeminiServiceError } from "./errors";

let clientInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!clientInstance) {
    let apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      apiKey = apiKey.trim();
      if ((apiKey.startsWith("'") && apiKey.endsWith("'")) || (apiKey.startsWith('"') && apiKey.endsWith('"'))) {
        apiKey = apiKey.slice(1, -1).trim();
      }
    }
    if (!apiKey) {
      throw new GeminiServiceError(
        "GEMINI_API_KEY environment variable is not configured. Please add GEMINI_API_KEY in Vercel Project Settings.",
        "MISSING_API_KEY",
        503
      );
    }
    clientInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return clientInstance;
}

import { GoogleGenAI } from "@google/genai";
import { GeminiServiceError } from "./errors";

let clientInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!clientInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new GeminiServiceError(
        "The AI diagnostic service is not configured on this deployment.",
        "CONFIG_MISSING",
        503,
        false,
        "GEMINI_API_KEY environment variable is not set."
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

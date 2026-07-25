import { GoogleGenAI } from "@google/genai";
import { GeminiServiceError } from "./errors";

let clientInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!clientInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new GeminiServiceError(
        "GEMINI_API_KEY environment variable is not configured.",
        "MISSING_API_KEY",
        500
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

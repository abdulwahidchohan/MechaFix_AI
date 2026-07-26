import { getGeminiClient } from "./client";
import { MODELS } from "./models";
import { SYSTEM_SAFETY_INSTRUCTIONS } from "./prompts";
import { fullAnalysisResponseSchema, stepResultEvaluationSchema } from "./schemas";
import { GeminiServiceError } from "./errors";

export interface EvidenceInputPart {
  inlineData: {
    mimeType: string;
    data: string; // Base64
  };
}

/** Detects quota / rate-limit errors from Gemini API error messages */
function isQuotaError(message: string): boolean {
  const lower = (message || "").toLowerCase();
  return lower.includes("429") || lower.includes("quota") || lower.includes("rate limit") || lower.includes("resource_exhausted");
}

export async function runGeminiAnalysis(params: {
  prompt: string;
  images?: EvidenceInputPart[];
}) {
  const primaryModel = MODELS.diagnosisModel;

  const parts: any[] = [{ text: params.prompt }];
  if (params.images && params.images.length > 0) {
    for (const img of params.images) {
      parts.push(img);
    }
  }

  let client: any = null;
  try {
    client = getGeminiClient();

    // Gemini multimodal API: images must come before text in parts array
    const orderedParts: any[] = [];
    if (params.images && params.images.length > 0) {
      for (const img of params.images) {
        orderedParts.push(img);
      }
    }
    orderedParts.push({ text: params.prompt });

    const response = await client.models.generateContent({
      model: primaryModel,
      contents: [{ role: "user", parts: orderedParts }],
      config: {
        systemInstruction: SYSTEM_SAFETY_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: fullAnalysisResponseSchema,
        temperature: 0.2,
      },
    });

    const rawText = response.text || "";
    return JSON.parse(rawText);
  } catch (err: any) {
    // If this is already a typed error (e.g. CONFIG_MISSING from client.ts), re-throw immediately
    if (err?.name === "GeminiServiceError") throw err;

    console.warn(`Primary model ${primaryModel} analysis failed, trying fallback:`, err?.message || err);
    try {
      if (!client) client = getGeminiClient();
      const response = await client.models.generateContent({
        model: MODELS.fallbackDiagnosisModel,
        contents: [{ role: "user", parts: orderedParts }],
        config: {
          systemInstruction: SYSTEM_SAFETY_INSTRUCTIONS,
          responseMimeType: "application/json",
          responseSchema: fullAnalysisResponseSchema,
          temperature: 0.2,
        },
      });
      return JSON.parse(response.text || "{}");
    } catch (fallbackErr: any) {
      if (fallbackErr?.name === "GeminiServiceError") throw fallbackErr;

      const combinedMessage = fallbackErr?.message || err?.message || "";
      console.error("Gemini analysis failed on both primary and fallback models:", combinedMessage);

      if (isQuotaError(combinedMessage)) {
        throw new GeminiServiceError(
          "The AI diagnostic service quota has been reached. Please try again in a few moments.",
          "GEMINI_QUOTA_EXCEEDED",
          429,
          true
        );
      }
      throw new GeminiServiceError(
        "The AI diagnostic service is temporarily unavailable.",
        "GEMINI_SERVICE_UNAVAILABLE",
        503,
        true,
        combinedMessage
      );
    }
  }
}

export async function runStepEvaluation(params: {
  prompt: string;
}) {
  const primaryModel = MODELS.diagnosisModel;

  let client: any = null;
  try {
    client = getGeminiClient();
    const response = await client.models.generateContent({
      model: primaryModel,
      contents: params.prompt,
      config: {
        systemInstruction: SYSTEM_SAFETY_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: stepResultEvaluationSchema,
        temperature: 0.2,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (err: any) {
    if (err?.name === "GeminiServiceError") throw err;

    console.warn(`Step evaluation with ${primaryModel} failed, trying fallback:`, err?.message || err);
    try {
      if (!client) client = getGeminiClient();
      const response = await client.models.generateContent({
        model: MODELS.fallbackDiagnosisModel,
        contents: params.prompt,
        config: {
          systemInstruction: SYSTEM_SAFETY_INSTRUCTIONS,
          responseMimeType: "application/json",
          responseSchema: stepResultEvaluationSchema,
          temperature: 0.2,
        },
      });
      return JSON.parse(response.text || "{}");
    } catch (fallbackErr: any) {
      if (fallbackErr?.name === "GeminiServiceError") throw fallbackErr;

      const combinedMessage = fallbackErr?.message || err?.message || "";
      console.error("Gemini step evaluation failed on both primary and fallback models:", combinedMessage);

      if (isQuotaError(combinedMessage)) {
        throw new GeminiServiceError(
          "The AI step evaluation service quota has been reached. Please try again in a few moments.",
          "GEMINI_QUOTA_EXCEEDED",
          429,
          true
        );
      }
      throw new GeminiServiceError(
        "The AI step evaluation service is temporarily unavailable. Please try again.",
        "GEMINI_SERVICE_UNAVAILABLE",
        503,
        true,
        combinedMessage
      );
    }
  }
}

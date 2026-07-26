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
    const response = await client.models.generateContent({
      model: primaryModel,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_SAFETY_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: fullAnalysisResponseSchema,
        temperature: 0.2,
      },
    });

    const rawText = response.text || "";
    const parsed = JSON.parse(rawText);
    return parsed;
  } catch (err: any) {
    console.warn(`Primary model ${primaryModel} analysis failed, trying fallback:`, err?.message || err);
    try {
      if (!client) client = getGeminiClient();
      const response = await client.models.generateContent({
        model: MODELS.fallbackDiagnosisModel,
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_SAFETY_INSTRUCTIONS,
          responseMimeType: "application/json",
          responseSchema: fullAnalysisResponseSchema,
          temperature: 0.2,
        },
      });
      return JSON.parse(response.text || "{}");
    } catch (fallbackErr: any) {
      console.error("Gemini API call failed:", fallbackErr?.message || err?.message);
      const isQuota = (fallbackErr?.message || err?.message || "").includes("429") || (fallbackErr?.message || err?.message || "").includes("quota");
      if (isQuota) {
        throw new GeminiServiceError(
          "The AI diagnostic service quota has been reached. Please try again in a few moments.",
          "GEMINI_QUOTA_EXCEEDED",
          429
        );
      }
      throw new GeminiServiceError(
        "The AI diagnostic service is temporarily unavailable. Please verify your GEMINI_API_KEY configuration and try again.",
        "SERVICE_UNAVAILABLE",
        503
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
      console.error("Gemini step evaluation failed:", fallbackErr?.message || err?.message);
      const isQuota = (fallbackErr?.message || err?.message || "").includes("429") || (fallbackErr?.message || err?.message || "").includes("quota");
      if (isQuota) {
        throw new GeminiServiceError(
          "The AI step evaluation service quota has been reached. Please try again in a few moments.",
          "GEMINI_QUOTA_EXCEEDED",
          429
        );
      }
      throw new GeminiServiceError(
        "The AI step evaluation service is temporarily unavailable. Please try again.",
        "SERVICE_UNAVAILABLE",
        503
      );
    }
  }
}

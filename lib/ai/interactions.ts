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
  const client = getGeminiClient();
  const primaryModel = MODELS.diagnosisModel;

  const parts: any[] = [{ text: params.prompt }];
  if (params.images && params.images.length > 0) {
    for (const img of params.images) {
      parts.push(img);
    }
  }

  try {
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
      throw new GeminiServiceError(
        `Gemini analysis failed: ${fallbackErr?.message || err?.message}`,
        "GEMINI_ANALYSIS_FAILED",
        500
      );
    }
  }
}

export async function runStepEvaluation(params: {
  prompt: string;
}) {
  const client = getGeminiClient();
  const primaryModel = MODELS.diagnosisModel;

  try {
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
      throw new GeminiServiceError(
        `Step re-evaluation failed: ${fallbackErr?.message || err?.message}`,
        "GEMINI_STEP_EVAL_FAILED",
        500
      );
    }
  }
}

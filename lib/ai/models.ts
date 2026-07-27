import { getGeminiClient } from "./client";

export const ALLOWED_DIAGNOSIS_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
] as const;

export const ALLOWED_FAST_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
] as const;

export const ALLOWED_EMBEDDING_MODELS = [
  "gemini-embedding-2",
  "text-embedding-004",
] as const;

export const ALLOWED_IMAGE_MODELS = [
  "imagen-3.0-generate-002",
  "imagen-3.0-fast-generate-001",
  "gemini-3.1-flash-image",
  "gemini-3.1-flash-lite-image",
  "gemini-3-pro-image",
] as const;

export const MODELS = {
  get diagnosisModel(): string {
    const configured = process.env.GEMINI_DIAGNOSIS_MODEL || "gemini-3.6-flash";
    if (!ALLOWED_DIAGNOSIS_MODELS.includes(configured as any)) {
      console.warn(`[Model Registry] Invalid diagnosis model "${configured}". Falling back to gemini-3.6-flash.`);
      return "gemini-3.6-flash";
    }
    return configured;
  },

  get fastModel(): string {
    const configured = process.env.GEMINI_FAST_MODEL || "gemini-3.5-flash-lite";
    if (!ALLOWED_FAST_MODELS.includes(configured as any)) {
      console.warn(`[Model Registry] Invalid fast model "${configured}". Falling back to gemini-3.5-flash-lite.`);
      return "gemini-3.5-flash-lite";
    }
    return configured;
  },

  get imageModel(): string {
    const configured = process.env.GEMINI_IMAGE_MODEL || "imagen-3.0-generate-002";
    if (!ALLOWED_IMAGE_MODELS.includes(configured as any)) {
      console.warn(`[Model Registry] Invalid image model "${configured}". Falling back to imagen-3.0-generate-002.`);
      return "imagen-3.0-generate-002";
    }
    return configured;
  },

  get embeddingModel(): string {
    const configured = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";
    if (!ALLOWED_EMBEDDING_MODELS.includes(configured as any)) {
      console.warn(`[Model Registry] Invalid embedding model "${configured}". Falling back to gemini-embedding-2.`);
      return "gemini-embedding-2";
    }
    return configured;
  },

  get isReferenceDiagramsEnabled(): boolean {
    return process.env.ENABLE_REFERENCE_DIAGRAMS === "true";
  },

  fallbackDiagnosisModel: "gemini-3.5-flash-lite",
  fallbackImageModel: "gemini-3.1-flash-lite-image",
};

/**
 * Validates model registry configuration at startup.
 */
export function validateModelRegistry(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!ALLOWED_DIAGNOSIS_MODELS.includes(MODELS.diagnosisModel as any)) {
    errors.push(`Invalid GEMINI_DIAGNOSIS_MODEL: ${MODELS.diagnosisModel}`);
  }
  if (!ALLOWED_FAST_MODELS.includes(MODELS.fastModel as any)) {
    errors.push(`Invalid GEMINI_FAST_MODEL: ${MODELS.fastModel}`);
  }
  if (!ALLOWED_IMAGE_MODELS.includes(MODELS.imageModel as any)) {
    errors.push(`Invalid GEMINI_IMAGE_MODEL: ${MODELS.imageModel}`);
  }
  if (!ALLOWED_EMBEDDING_MODELS.includes(MODELS.embeddingModel as any)) {
    errors.push(`Invalid GEMINI_EMBEDDING_MODEL: ${MODELS.embeddingModel}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

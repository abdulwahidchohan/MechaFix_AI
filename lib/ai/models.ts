/**
 * Model Registry — maps Vercel env vars to validated Gemini model IDs.
 *
 * Real Gemini API model names (as of 2025):
 *   Text/multimodal: gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash
 *   Image generation: gemini-2.0-flash-preview-image-generation, imagen-3.0-generate-002
 *   Embedding:        text-embedding-004, gemini-embedding-exp-03-07
 */

export const ALLOWED_DIAGNOSIS_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite-preview-06-17",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
  // Legacy aliases kept for backward-compat
  "gemini-3.6-flash",
  "gemini-3.5-flash",
] as const;

export const ALLOWED_FAST_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite-preview-06-17",
  "gemini-1.5-flash-8b",
  // Legacy aliases
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
] as const;

export const ALLOWED_EMBEDDING_MODELS = [
  "text-embedding-004",
  "gemini-embedding-exp-03-07",
  // Legacy alias
  "gemini-embedding-2",
] as const;

export const ALLOWED_IMAGE_MODELS = [
  // Correct Gemini image-generation models
  "gemini-2.0-flash-preview-image-generation",
  "imagen-3.0-generate-002",
  "imagen-3.0-fast-generate-001",
  // Legacy alias kept so existing env var is silently upgraded
  "gemini-3.1-flash-image",
  "gemini-3.1-flash-lite-image",
] as const;

/** Normalized alias: maps legacy model names to real API names */
function resolveModelAlias(name: string): string {
  const aliases: Record<string, string> = {
    // Diagnosis / text-multimodal
    "gemini-3.6-flash": "gemini-2.5-flash",
    "gemini-3.5-flash": "gemini-2.0-flash",
    "gemini-3.5-flash-lite": "gemini-2.0-flash-lite",
    // Image generation
    "gemini-3.1-flash-image": "gemini-2.0-flash-preview-image-generation",
    "gemini-3.1-flash-lite-image": "gemini-2.0-flash-preview-image-generation",
    "gemini-3-pro-image": "imagen-3.0-generate-002",
    // Embedding
    "gemini-embedding-2": "text-embedding-004",
  };
  return aliases[name] ?? name;
}

export const MODELS = {
  get diagnosisModel(): string {
    const configured = process.env.GEMINI_DIAGNOSIS_MODEL || "gemini-2.5-flash";
    const resolved = resolveModelAlias(configured);
    if (!ALLOWED_DIAGNOSIS_MODELS.includes(configured as any) && resolved === configured) {
      console.warn(`[Model Registry] Unknown diagnosis model "${configured}". Using gemini-2.5-flash.`);
      return "gemini-2.5-flash";
    }
    return resolved;
  },

  get fastModel(): string {
    const configured = process.env.GEMINI_FAST_MODEL || "gemini-2.0-flash-lite";
    const resolved = resolveModelAlias(configured);
    if (!ALLOWED_FAST_MODELS.includes(configured as any) && resolved === configured) {
      console.warn(`[Model Registry] Unknown fast model "${configured}". Using gemini-2.0-flash-lite.`);
      return "gemini-2.0-flash-lite";
    }
    return resolved;
  },

  get imageModel(): string {
    const configured = process.env.GEMINI_IMAGE_MODEL || "gemini-2.0-flash-preview-image-generation";
    const resolved = resolveModelAlias(configured);
    if (!ALLOWED_IMAGE_MODELS.includes(configured as any) && resolved === configured) {
      console.warn(`[Model Registry] Unknown image model "${configured}". Using gemini-2.0-flash-preview-image-generation.`);
      return "gemini-2.0-flash-preview-image-generation";
    }
    return resolved;
  },

  get embeddingModel(): string {
    const configured = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
    const resolved = resolveModelAlias(configured);
    if (!ALLOWED_EMBEDDING_MODELS.includes(configured as any) && resolved === configured) {
      console.warn(`[Model Registry] Unknown embedding model "${configured}". Using text-embedding-004.`);
      return "text-embedding-004";
    }
    return resolved;
  },

  get isReferenceDiagramsEnabled(): boolean {
    return process.env.ENABLE_REFERENCE_DIAGRAMS === "true";
  },

  /** Fallback used when primary model fails */
  get fallbackDiagnosisModel(): string {
    return "gemini-2.0-flash";
  },

  get fallbackImageModel(): string {
    return "gemini-2.0-flash-preview-image-generation";
  },
};

/**
 * Validates model registry configuration at startup.
 */
export function validateModelRegistry(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const dm = MODELS.diagnosisModel;
  const fm = MODELS.fastModel;
  const im = MODELS.imageModel;
  const em = MODELS.embeddingModel;

  // After alias resolution, these should all be real model names
  const knownReal = [
    "gemini-2.5-flash", "gemini-2.5-flash-lite-preview-06-17",
    "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash-preview-image-generation",
    "gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro",
    "imagen-3.0-generate-002", "imagen-3.0-fast-generate-001",
    "text-embedding-004", "gemini-embedding-exp-03-07",
  ];

  if (!knownReal.includes(dm)) errors.push(`Unrecognised resolved diagnosisModel: ${dm}`);
  if (!knownReal.includes(fm)) errors.push(`Unrecognised resolved fastModel: ${fm}`);
  if (!knownReal.includes(im)) errors.push(`Unrecognised resolved imageModel: ${im}`);
  if (!knownReal.includes(em)) errors.push(`Unrecognised resolved embeddingModel: ${em}`);

  return { valid: errors.length === 0, errors };
}

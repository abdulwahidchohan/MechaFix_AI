export class GeminiServiceError extends Error {
  constructor(
    message: string,
    public code: string = "GEMINI_ERROR",
    public status: number = 500,
    public retryAfter?: number,
    public details?: any
  ) {
    super(message);
    this.name = "GeminiServiceError";
  }
}

export function parseGeminiError(err: any): GeminiServiceError {
  if (err instanceof GeminiServiceError) {
    return err;
  }

  const errStr = String(err?.message || err?.status || err || "");

  const isQuota =
    err?.status === 429 ||
    err?.code === 429 ||
    errStr.includes("429") ||
    errStr.includes("RESOURCE_EXHAUSTED") ||
    errStr.includes("Quota exceeded");

  if (isQuota) {
    let retryAfterSecs: number | undefined;
    const retryMatch = errStr.match(/retry in ([0-9.]+)s/i) || errStr.match(/retryDelay"?:\s*"?([0-9.]+)/i);
    if (retryMatch && retryMatch[1]) {
      retryAfterSecs = Math.ceil(parseFloat(retryMatch[1]));
    }
    return new GeminiServiceError(
      "Gemini API quota exceeded. Please try again shortly.",
      "GEMINI_QUOTA_EXCEEDED",
      429,
      retryAfterSecs,
      err
    );
  }

  const isConfigMissing = errStr.includes("GEMINI_API_KEY") || errStr.includes("CONFIG_MISSING");
  if (isConfigMissing) {
    return new GeminiServiceError(
      "Gemini API key environment variable is missing or unconfigured.",
      "CONFIG_MISSING",
      503,
      undefined,
      err
    );
  }

  return new GeminiServiceError(
    err?.message || "Gemini AI service unavailable.",
    "GEMINI_SERVICE_UNAVAILABLE",
    503,
    undefined,
    err
  );
}

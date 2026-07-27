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

export class AppApiError extends Error {
  constructor(
    message: string,
    public code: string = "INTERNAL_SERVER_ERROR",
    public status: number = 500,
    public retryAfter?: number
  ) {
    super(message);
    this.name = "AppApiError";
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

export function parseApiError(err: any): AppApiError {
  if (err instanceof AppApiError) {
    return err;
  }
  if (err instanceof GeminiServiceError) {
    return new AppApiError(err.message, err.code, err.status, err.retryAfter);
  }

  const errCode = String(err?.code || "").toLowerCase();
  const errStr = String(err?.message || err || "");

  if (errCode === "unavailable" || errCode === "deadline-exceeded" || errStr.includes("UNAVAILABLE")) {
    return new AppApiError("Database service temporarily unavailable. Please retry.", "FIRESTORE_UNAVAILABLE", 503);
  }
  if (errCode === "permission-denied" || errStr.includes("permission-denied")) {
    return new AppApiError("Access denied.", "ACCESS_DENIED", 403);
  }
  if (errCode === "not-found" || errStr.includes("not-found")) {
    return new AppApiError("Requested resource not found.", "DIAGNOSIS_NOT_FOUND", 404);
  }
  if (errCode === "already-exists" || errCode === "stale_step" || errCode === "duplicate_request") {
    return new AppApiError(errStr || "Duplicate or stale request.", "DUPLICATE_REQUEST", 409);
  }
  if (errCode === "invalid-argument") {
    return new AppApiError("Invalid argument provided.", "INVALID_REQUEST", 400);
  }
  if (errCode === "unauthenticated") {
    return new AppApiError("Authentication token invalid or missing.", "AUTH_TOKEN_INVALID", 401);
  }

  return new AppApiError(err?.message || "Internal server error.", err?.code || "INTERNAL_SERVER_ERROR", err?.status || 500);
}

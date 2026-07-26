/**
 * Typed error for Gemini AI service failures.
 * publicMessage is safe to surface to the browser.
 * internalMessage may contain deployment details — never serialize to client.
 */
export class GeminiServiceError extends Error {
  constructor(
    /** Safe user-facing message */
    public readonly publicMessage: string,
    /** Machine-readable error code */
    public readonly code: string = "GEMINI_ERROR",
    /** HTTP status to return to the caller */
    public readonly status: number = 500,
    /** Whether the caller may safely retry the same request */
    public readonly retryable: boolean = false,
    /** Internal deployment detail — NOT for browser responses */
    public readonly internalMessage?: string
  ) {
    super(publicMessage);
    this.name = "GeminiServiceError";
  }
}

/**
 * Typed error for Firebase Admin SDK initialization / access failures.
 * Thrown when the Admin SDK is unavailable due to missing or invalid configuration.
 */
export class FirebaseAdminError extends Error {
  constructor(
    public readonly publicMessage: string,
    public readonly code: string = "FIREBASE_ADMIN_UNAVAILABLE",
    public readonly status: number = 503,
    public readonly retryable: boolean = false
  ) {
    super(publicMessage);
    this.name = "FirebaseAdminError";
  }
}

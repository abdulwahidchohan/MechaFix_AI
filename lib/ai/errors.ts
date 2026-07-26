export class GeminiServiceError extends Error {
  constructor(
    message: string,
    public code: string = "GEMINI_ERROR",
    public status: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = "GeminiServiceError";
  }
}

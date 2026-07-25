# MechaFix AI - Gemini Interactions API Migration Plan

## Migration Strategy
- **SDK**: `@google/genai` (v2.4.0+)
- **Server-Side Client Layer**: `lib/ai/client.ts`, `lib/ai/interactions.ts`, `lib/ai/schemas.ts`, `lib/ai/prompts.ts`, `lib/ai/models.ts`
- **Configurable Models via Environment Variables**:
  - `GEMINI_DIAGNOSIS_MODEL`: Default `gemini-3.6-flash` (or fallback `gemini-2.5-flash`)
  - `GEMINI_IMAGE_MODEL`: Default `gemini-3.1-flash-image`
  - `GEMINI_EMBEDDING_MODEL`: Default `gemini-embedding-2`
- **Interactions API Configuration**:
  - `store`: Default `false` for user privacy
  - `httpOptions`: `{ headers: { 'User-Agent': 'aistudio-build' } }`
  - Handles text, inline images, bounding box structured outputs, and step continuation.

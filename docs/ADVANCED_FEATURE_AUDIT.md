# MechaFix AI - Advanced Feature Audit & Baseline Report

## Repository Baseline Inspection
- **Package SDK Version**: `@google/genai`: `^2.4.0`
- **Next.js Version**: `^15.4.9` (App Router)
- **React Version**: `^19.2.1`
- **Existing Routes**:
  - `/app/api/gemini/analyze/route.ts` - Hardware analysis with RAG + multimodal inputs
  - `/app/api/gemini/follow-up/route.ts` - Contextual Q&A follow-up
  - `/app/api/diagnoses/status/route.ts` - Status updates (in_progress, resolved, partially_resolved)
  - `/app/api/diagnoses/measurements/route.ts` - Measurement logging
- **Firestore Collections**:
  - `users/{userId}/diagnoses/{diagnosisId}`
- **Baseline Test Results**:
  - `npm run lint`: PASSED
  - `npm run typecheck`: PASSED
  - `npm run build`: PASSED

## Module Implementation Plan
1. **Gemini Interactions API Service Layer**: Unified server-side client with model configurable environment variables (`GEMINI_DIAGNOSIS_MODEL`, `GEMINI_IMAGE_MODEL`, `GEMINI_EMBEDDING_MODEL`). Default `store: false`.
2. **RAG Upgrade**: Support dual mode (`RAG_MODE=tfidf` default, `RAG_MODE=embedding` optional).
3. **Automatic Diagnostic State Machine**: Class A state machine with `DiagnosticStep`, `StepResult`, active hypotheses, next-step generation API (`/api/diagnoses/step-result`), and Firestore transaction state updates.
4. **Multiple-Image Evidence**: Support up to 5 evidence items with image type tags, quality checks, and base64/storage handling.
5. **Annotated Image Overlays**: Bounding boxes `[y_min, x_min, y_max, x_max]` normalized 0-1000 with `AnnotatedImageViewer` component.
6. **Verified Component Pinout Viewer**: Static curated pinout dataset with official source links and safety voltage notes.
7. **Direct PDF Report Generation**: Client/server downloadable PDF report generator using `jspdf`.
8. **AI-Generated Reference Diagrams**: Endpoint `/api/gemini/generate-reference-diagram` using `GEMINI_IMAGE_MODEL` (`gemini-3.1-flash-image`) with prominent synthetic reference disclaimers.

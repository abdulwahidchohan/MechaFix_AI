# MechaFix AI Project Status

## Product Summary
MechaFix AI is a hardware diagnostic lab application that enables users to troubleshoot circuit boards, microcontrollers, and electronic components using photo analysis, diagnostic state machines, annotated image overlays, pinout view, PDF exports, and AI-assisted troubleshooting powered by Gemini AI.

## Current Architecture
- **Frontend Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4 with custom hybrid-neumorphic design tokens
- **Authentication**: Firebase Authentication (Google Sign-In) with client AuthContext & server ID token verification via `firebase-admin`
- **Database**: Firestore (`users/{uid}/diagnoses/{diagnosisId}`)
- **AI Integration**: Server-side `@google/genai`
  - `GEMINI_DIAGNOSIS_MODEL`: `gemini-3.6-flash` (Primary reasoning & multimodal diagnosis)
  - `GEMINI_FAST_MODEL`: `gemini-3.5-flash-lite` (Helper & metadata normalization)
  - `GEMINI_EMBEDDING_MODEL`: `gemini-embedding-2` (Vector retrieval with TF-IDF fallback)
  - `GEMINI_IMAGE_MODEL`: `gemini-3.1-flash-image` (Optional reference diagrams, disabled by default in free mode via `ENABLE_REFERENCE_DIAGRAMS=false`)
- **Deployment Target**: Cloud Run / Node.js container (Port 3000)

## Active Advanced Modules & Verification Status
- [x] **Automatic Diagnostic State Machine**: Dynamic state machine tracking `currentDiagnosticStep`, `activeHypotheses`, and `diagnosticProgress` timeline.
- [x] **Multiple-Image Evidence**: Support for up to 5 evidence attachments with per-image quality assessment.
- [x] **Annotated Image Overlays**: Normalized bounding box overlays (0 to 1000 scale) highlighting observed components and potential faults.
- [x] **Verified Pinout Viewer**: Interactive pinout viewer for Arduino, ESP32, and Raspberry Pi Pico with disclaimer notices for unverified board variants.
- [x] **Direct PDF Export**: Client-side client report generation with multi-page safety and sanitized metadata.
- [x] **Reference Diagram Generation**: Migrated away from deprecated Imagen to `gemini-3.1-flash-image`, featuring a fallback vector schematic engine and safety refusal checks.
- [x] **Model Governance & Registry**: Model registry (`/lib/ai/models.ts`) enforcing feature allowlists, startup validation, and free-tier fallback handling.

## Firestore Data Model
- Collection: `users/{userId}/diagnoses/{diagnosisId}`
  - `version`: string ("1.0")
  - `createdAt`: serverTimestamp
  - `updatedAt`: serverTimestamp
  - `status`: "in_progress" | "resolved" | "partially_resolved" | "safety_stop"
  - `setup`: `{ board, component, powerSource, problemCategory }`
  - `originalInput`: `{ expectedBehavior, actualBehavior, errorMessage, notes, evidenceType }`
  - `result`: `{ issue_summary, components_detected, potential_causes, troubleshooting_steps, safetyLevel, currentDiagnosticStep, followUpQuestions }`
  - `currentDiagnosticStep`: `{ stepId, title, instruction, rationale, expectedOutcome, options, dependsOnStepId, isFinalStep }`
  - `activeHypotheses`: array of `{ id, title, probability, status, reasoning }`
  - `diagnosticProgress`: array of step result records
  - `evidenceList`: array of evidence image objects with annotations
  - `resolution`: `{ rootCause, actionTaken, finalNote, resolvedAt }`

## API Routes
- `POST /api/gemini/analyze`: Multi-image analysis & initial state machine generation via `gemini-3.6-flash`.
- `POST /api/diagnoses/step-result`: Evaluates test results, updates state machine hypotheses, and generates next diagnostic step.
- `POST /api/gemini/follow-up`: Contextual hardware chat follow-up powered by `gemini-3.6-flash` with safety system instructions.
- `POST /api/gemini/generate-reference-diagram`: Generates educational reference schematics using `gemini-3.1-flash-image` (when enabled) with fallback vector graphics.

## Security Controls
- **Zero-Trust Security Rules**: Deployed to Firestore project `mystic-core-pgtt6`.
- **Server-Side AI Proxy**: All Gemini API keys stored securely in server environment (`process.env.GEMINI_API_KEY`).
- **Token Verification**: User identity verified on all `/api/*` routes via Firebase Admin SDK.

## Change Log
- 2026-07-25: Completed model governance modernization, migrated image generation to `gemini-3.1-flash-image`, removed deprecated Gemini 2.0/2.5 active fallbacks, and updated model registry.

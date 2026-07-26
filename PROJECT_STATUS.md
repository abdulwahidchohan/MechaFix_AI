# MechaFix AI Project Status

## Product Summary
MechaFix AI is a hardware diagnostic lab application that enables users to troubleshoot circuit boards, microcontrollers, and electronic components using photo analysis, diagnostic state machines, annotated image overlays, pinout views, PDF exports, reference diagrams, and AI-assisted troubleshooting powered by Gemini AI.

## Current Architecture
- **Frontend Framework**: Next.js 15.5.21 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4 with custom hybrid-neumorphic design tokens
- **Authentication**: Firebase Authentication (Google Sign-In) with client AuthContext & server ID token verification via `firebase-admin`
- **Database**: Cloud Firestore (`users/{uid}/diagnoses/{diagnosisId}`) for project `hekto-awm` with local browser storage fallback
- **AI Integration**: Server-side `@google/genai`
  - `GEMINI_DIAGNOSIS_MODEL`: `gemini-3.6-flash` (Primary reasoning & multimodal hardware diagnosis)
  - `GEMINI_FAST_MODEL`: `gemini-3.5-flash-lite` (Fast helper & free-tier fallback)
  - `GEMINI_EMBEDDING_MODEL`: `gemini-embedding-2` (Vector retrieval with TF-IDF fallback)
  - `GEMINI_IMAGE_MODEL`: `gemini-3.1-flash-image` (Optional reference diagrams, with SVG vector schematic engine fallback)
- **Deployment Target**: Vercel & Node.js production server (`https://mecha-fix-ai.vercel.app`)

## Active Modules & Verification Status
- [x] **Gemini 3.6 Flash Engine**: Resilient hardware analysis with automatic fallback to `gemini-3.5-flash-lite`.
- [x] **Automatic Diagnostic State Machine**: Dynamic state machine tracking sequence numbers, active hypotheses, and diagnostic progress timeline.
- [x] **Hybrid Storage Sync**: Automatic local browser storage and Cloud Firestore synchronization.
- [x] **Annotated Image Overlays**: Normalized bounding box overlays (0 to 1000 scale) highlighting observed components and potential faults.
- [x] **Verified Pinout Viewer**: Interactive pinout viewer for Arduino, ESP32, Raspberry Pi Pico, HC-SR04, L298N, and DHT11.
- [x] **Direct PDF Export**: Multi-page PDF report generation with sanitized metadata and safety guidelines.
- [x] **Reference Diagram Generation**: SVG schematic vector engine fallback and model image generation.
- [x] **Safety System Refusal**: Emergency hazard warnings and high-voltage AC mains refusal rules.

## Cloud Firestore Data Model
- Collection: `users/{userId}/diagnoses/{diagnosisId}`
  - `version`: string ("2")
  - `createdAt`: serverTimestamp
  - `updatedAt`: serverTimestamp
  - `status`: "in_progress" | "resolved" | "partially_resolved" | "safety_stop"
  - `setup`: `{ board, component, powerSource, problemCategory }`
  - `originalInput`: `{ expectedBehavior, actualBehavior, errorMessage, notes, evidenceType }`
  - `result`: `{ issue_summary, components_detected, potential_causes, troubleshooting_steps, safetyLevel }`
  - `currentStep`: `{ id, sequence, title, instruction, reason, safetyNote, expectedResult, resultOptions, requiresPowerDisconnected, requiresMeasurement, status }`
  - `activeHypotheses`: array of `{ id, title, explanation, state, evidenceFor, evidenceAgainst }`
  - `diagnosticProgress`: array of step result records
  - `resolution`: `{ rootCause, actionTaken, finalNote, resolvedAt }`

## API Routes
- `POST /api/gemini/analyze`: Multi-image analysis & initial state machine generation via `gemini-3.6-flash`.
- `POST /api/diagnoses/step-result`: Evaluates test results, updates state machine hypotheses, and generates next diagnostic step.
- `POST /api/gemini/follow-up`: Contextual hardware chat follow-up powered by `gemini-3.6-flash`.
- `POST /api/gemini/generate-reference-diagram`: Generates educational reference schematics using SVG vector graphics & Gemini.
- `POST /api/diagnoses/status`: Updates diagnosis session status (in_progress, resolved, partially_resolved).

## Change Log
- 2026-07-26: Updated project configuration to project `hekto-awm`, added local session fallback to all API routes, verified 10/10 feature checks, and deployed latest build to Vercel and GitHub.

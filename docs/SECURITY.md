# MechaFix AI - Security Architecture & Audit Report

## Core Security Controls

1. **Zero-Trust Client Data Isolation**
   - All user diagnoses are strictly isolated to `users/{userId}/diagnoses/{diagnosisId}`.
   - Cloud Firestore security rules default to deny-all and strictly enforce `request.auth.uid == userId`.

2. **Server-Side API Key Protection**
   - `GEMINI_API_KEY` is strictly accessed server-side in Next.js API route handlers (`/api/gemini/analyze` and `/api/gemini/follow-up`).
   - The API key is never prefixed with `NEXT_PUBLIC_` and never enters the browser bundle.

3. **Authentication Token Verification**
   - Every API endpoint verifies the incoming HTTP Bearer token using Firebase Admin `adminAuth.verifyIdToken(token)`.
   - The authenticated user ID is derived directly from the verified token payload; client-supplied user IDs are ignored.

4. **Input Sanitization & Payload Controls**
   - Request bodies are sanitized and capped (e.g. text fields limited to 150 - 1000 characters).
   - Image payloads are limited to 5 MB base64 strings and validated against allowed image MIME types (JPG, PNG, WebP).

5. **AI Safety Systems Instruction Guardrails**
   - Non-negotiable safety rules prohibit procedural instructions for exposed mains AC wiring or hazardous high-voltage modifications.
   - Smoke, burning smell, or thermal runaway prompts trigger an immediate emergency shutdown instruction.

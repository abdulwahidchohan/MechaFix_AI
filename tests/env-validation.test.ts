import test from "node:test";
import assert from "node:assert/strict";
import { MODELS } from "../lib/ai/models";
import { FirebaseAdminError } from "../lib/firebase-admin";
import { normalizeFirestoreDate } from "../lib/date-utils";
import { parseGeminiError, parseApiError } from "../lib/ai/errors";
import { validateFirebaseClientConfig } from "../lib/firebase";
import { getAppCapabilities } from "../lib/utils";

test("getAppCapabilities returns referenceDiagrams true ONLY when ENABLE_REFERENCE_DIAGRAMS is 'true'", () => {
  const orig = process.env.ENABLE_REFERENCE_DIAGRAMS;

  process.env.ENABLE_REFERENCE_DIAGRAMS = "true";
  const capsTrue = getAppCapabilities();
  assert.equal(capsTrue.referenceDiagrams, true);
  assert.equal(capsTrue.imageAnnotations, true);
  assert.equal(capsTrue.multipleImages, true);
  assert.equal(capsTrue.directPdf, true);

  process.env.ENABLE_REFERENCE_DIAGRAMS = "false";
  assert.equal(getAppCapabilities().referenceDiagrams, false);

  process.env.ENABLE_REFERENCE_DIAGRAMS = "1";
  assert.equal(getAppCapabilities().referenceDiagrams, false);

  process.env.ENABLE_REFERENCE_DIAGRAMS = "0";
  assert.equal(getAppCapabilities().referenceDiagrams, false);

  process.env.ENABLE_REFERENCE_DIAGRAMS = orig;
});

test("Model policy defaults match target production policy", () => {
  assert.equal(MODELS.diagnosisModel, "gemini-3.6-flash");
  assert.equal(MODELS.fastModel, "gemini-3.5-flash-lite");
  assert.equal(MODELS.imageModel, "gemini-3.1-flash-image");
  assert.equal(MODELS.embeddingModel, "gemini-embedding-2");
});

test("FirebaseAdminError constructs typed 503 error", () => {
  const err = new FirebaseAdminError("Missing key", "CONFIG_MISSING", 503);
  assert.equal(err.name, "FirebaseAdminError");
  assert.equal(err.code, "CONFIG_MISSING");
  assert.equal(err.status, 503);
});

test("validateFirebaseClientConfig detects missing environment variables", () => {
  const incompleteConfig = {
    apiKey: "",
    authDomain: "hekto-awm.firebaseapp.com",
    projectId: "hekto-awm",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  };
  const result = validateFirebaseClientConfig(incompleteConfig);
  assert.equal(result.valid, false);
  assert.equal(result.missing.includes("apiKey"), true);
  assert.equal(result.missing.includes("storageBucket"), true);
});

test("parseGeminiError maps 429 quota errors with Retry-After", () => {
  const rawErr = {
    status: 429,
    message: "Quota exceeded for metric: generate_content_free_tier_requests, Please retry in 21.5s.",
  };
  const parsed = parseGeminiError(rawErr);
  assert.equal(parsed.status, 429);
  assert.equal(parsed.code, "GEMINI_QUOTA_EXCEEDED");
  assert.equal(parsed.retryAfter, 22);
});

test("parseApiError maps Firestore error codes to standard HTTP status codes", () => {
  const unavailableErr = { code: "unavailable", message: "Service unavailable" };
  assert.equal(parseApiError(unavailableErr).status, 503);
  assert.equal(parseApiError(unavailableErr).code, "FIRESTORE_UNAVAILABLE");

  const permErr = { code: "permission-denied", message: "Permission denied" };
  assert.equal(parseApiError(permErr).status, 403);
  assert.equal(parseApiError(permErr).code, "ACCESS_DENIED");

  const notFoundErr = { code: "not-found", message: "Document not found" };
  assert.equal(parseApiError(notFoundErr).status, 404);
  assert.equal(parseApiError(notFoundErr).code, "DIAGNOSIS_NOT_FOUND");
});

test("Safety refusal detection rejects high-voltage AC mains or swollen battery conditions", () => {
  const checkHazardous = (text: string) =>
    /110v|220v|mains|ac voltage|burning|smoke|swollen|lipo direct/i.test(text);

  assert.equal(checkHazardous("Connected 220V AC mains directly"), true);
  assert.equal(checkHazardous("Battery is swollen and emitting smoke"), true);
  assert.equal(checkHazardous("Connecting HC-SR04 sensor to 5V pin"), false);
});

test("APP_URL validation rejects HTML corrupted strings", () => {
  const isHtmlCorrupted = (url: string) => {
    return /<[^>]*>|&quot;|-<\/a>/i.test(url);
  };

  assert.equal(isHtmlCorrupted("https://mecha-fix-ai.vercel.app"), false);
  assert.equal(isHtmlCorrupted("https://mecha-fix-ai.vercel.app-</a>"), true);
  assert.equal(isHtmlCorrupted("&quot;https://mecha-fix-ai.vercel.app&quot;"), true);
});

test("Escaped newline conversion converts \\n to actual newlines", () => {
  const rawKey = "-----BEGIN PRIVATE KEY-----\\nline1\\nline2\\n-----END PRIVATE KEY-----";
  const formatted = rawKey.replace(/\\n/g, "\n");
  assert.equal(formatted.includes("\nline1\n"), true);
  assert.equal(formatted.includes("-----BEGIN PRIVATE KEY-----"), true);
  assert.equal(formatted.includes("-----END PRIVATE KEY-----"), true);
});

test("normalizeFirestoreDate handles Timestamps, ISO strings, Epoch numbers, and null fallbacks safely", () => {
  const fallback = new Date("2026-01-01T00:00:00.000Z");

  const mockTimestamp = { toDate: () => new Date("2026-05-15T10:00:00.000Z") };
  assert.equal(normalizeFirestoreDate(mockTimestamp, fallback).toISOString(), "2026-05-15T10:00:00.000Z");

  const jsDate = new Date("2026-07-27T15:00:00.000Z");
  assert.equal(normalizeFirestoreDate(jsDate, fallback).toISOString(), "2026-07-27T15:00:00.000Z");

  assert.equal(normalizeFirestoreDate("2026-03-20T08:30:00.000Z", fallback).toISOString(), "2026-03-20T08:30:00.000Z");

  assert.equal(normalizeFirestoreDate(null, fallback).toISOString(), "2026-01-01T00:00:00.000Z");
  assert.equal(normalizeFirestoreDate(undefined, fallback).toISOString(), "2026-01-01T00:00:00.000Z");
  assert.equal(normalizeFirestoreDate("invalid-date-string", fallback).toISOString(), "2026-01-01T00:00:00.000Z");
});

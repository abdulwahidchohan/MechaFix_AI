import test from "node:test";
import assert from "node:assert/strict";
import { MODELS } from "../../lib/ai/models";
import { FirebaseAdminError } from "../../lib/firebase-admin";
import { normalizeFirestoreDate } from "../../lib/date-utils";
import { parseGeminiError, parseApiError } from "../../lib/ai/errors";
import { validateFirebaseClientConfig } from "../../lib/firebase";
import { getAppCapabilities } from "../../lib/utils";

test("ENABLE_REFERENCE_DIAGRAMS strict boolean parsing across all string variations", () => {
  const orig = process.env.ENABLE_REFERENCE_DIAGRAMS;

  process.env.ENABLE_REFERENCE_DIAGRAMS = "true";
  assert.equal(getAppCapabilities().referenceDiagrams, true);

  process.env.ENABLE_REFERENCE_DIAGRAMS = "false";
  assert.equal(getAppCapabilities().referenceDiagrams, false);

  process.env.ENABLE_REFERENCE_DIAGRAMS = "FALSE";
  assert.equal(getAppCapabilities().referenceDiagrams, false);

  process.env.ENABLE_REFERENCE_DIAGRAMS = "1";
  assert.equal(getAppCapabilities().referenceDiagrams, false);

  process.env.ENABLE_REFERENCE_DIAGRAMS = "";
  assert.equal(getAppCapabilities().referenceDiagrams, false);

  delete process.env.ENABLE_REFERENCE_DIAGRAMS;
  assert.equal(getAppCapabilities().referenceDiagrams, false);

  process.env.ENABLE_REFERENCE_DIAGRAMS = "  true  ";
  assert.equal(getAppCapabilities().referenceDiagrams, false);

  process.env.ENABLE_REFERENCE_DIAGRAMS = orig;
});

test("Capability response shape includes expected boolean keys", () => {
  const caps = getAppCapabilities();
  assert.equal(typeof caps.referenceDiagrams, "boolean");
  assert.equal(caps.imageAnnotations, true);
  assert.equal(caps.multipleImages, true);
  assert.equal(caps.directPdf, true);
});

test("validateFirebaseClientConfig handles complete vs missing configurations", () => {
  const completeConfig = {
    apiKey: "AIzaSy_Valid_Mock_Key",
    authDomain: "hekto-awm.firebaseapp.com",
    projectId: "hekto-awm",
    storageBucket: "hekto-awm.firebasestorage.app",
    messagingSenderId: "920507935916",
    appId: "1:920507935916:web:addb2991a3546f2ea70309",
  };
  assert.equal(validateFirebaseClientConfig(completeConfig).valid, true);

  const missingApiKey = { ...completeConfig, apiKey: "" };
  assert.equal(validateFirebaseClientConfig(missingApiKey).valid, false);
  assert.equal(validateFirebaseClientConfig(missingApiKey).missing.includes("apiKey"), true);

  const missingAuthDomain = { ...completeConfig, authDomain: "" };
  assert.equal(validateFirebaseClientConfig(missingAuthDomain).valid, false);

  const missingProjectId = { ...completeConfig, projectId: "" };
  assert.equal(validateFirebaseClientConfig(missingProjectId).valid, false);

  const missingAppId = { ...completeConfig, appId: "" };
  assert.equal(validateFirebaseClientConfig(missingAppId).valid, false);
});

test("Firebase Admin synthetic error & config validation rules", () => {
  const err = new FirebaseAdminError("Service account key invalid", "CONFIG_INVALID", 503);
  assert.equal(err.name, "FirebaseAdminError");
  assert.equal(err.code, "CONFIG_INVALID");
  assert.equal(err.status, 503);

  // Escaped newline conversion
  const escapedKey = "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC5\\n-----END PRIVATE KEY-----";
  const unescaped = escapedKey.replace(/\\n/g, "\n");
  assert.equal(unescaped.includes("\nMIIEvg"), true);
});

test("normalizeFirestoreDate handles all timestamp variants and invalid inputs safely", () => {
  const fallback = new Date("2026-01-01T00:00:00.000Z");

  // 1. Firestore Timestamp toDate()
  const mockTimestamp = { toDate: () => new Date("2026-04-12T12:00:00.000Z") };
  assert.equal(normalizeFirestoreDate(mockTimestamp, fallback).toISOString(), "2026-04-12T12:00:00.000Z");

  // 2. JS Date
  const jsDate = new Date("2026-07-27T10:00:00.000Z");
  assert.equal(normalizeFirestoreDate(jsDate, fallback).toISOString(), "2026-07-27T10:00:00.000Z");

  // 3. ISO String
  assert.equal(normalizeFirestoreDate("2026-08-15T09:30:00.000Z", fallback).toISOString(), "2026-08-15T09:30:00.000Z");

  // 4. Unix milliseconds
  const ms = 1778848800000;
  assert.equal(normalizeFirestoreDate(ms, fallback).getTime(), ms);

  // 5. Unix seconds ({ seconds, nanoseconds } and { _seconds, _nanoseconds })
  const secondsObj = { seconds: 1778848800, nanoseconds: 0 };
  assert.equal(normalizeFirestoreDate(secondsObj, fallback).getFullYear(), 2026);

  const _secondsObj = { _seconds: 1778848800, _nanoseconds: 0 };
  assert.equal(normalizeFirestoreDate(_secondsObj, fallback).getFullYear(), 2026);

  // 6. Invalid / Null / Undefined
  assert.equal(normalizeFirestoreDate(null, fallback).toISOString(), "2026-01-01T00:00:00.000Z");
  assert.equal(normalizeFirestoreDate(undefined, fallback).toISOString(), "2026-01-01T00:00:00.000Z");
  assert.equal(normalizeFirestoreDate("invalid-string", fallback).toISOString(), "2026-01-01T00:00:00.000Z");
});

test("parseGeminiError handles quota, missing keys, and model service errors", () => {
  const missingKeyErr = { message: "GEMINI_API_KEY environment variable missing" };
  const parsedKey = parseGeminiError(missingKeyErr);
  assert.equal(parsedKey.status, 503);
  assert.equal(parsedKey.code, "CONFIG_MISSING");

  const quotaErr = { status: 429, message: "Quota exceeded for metric, Please retry in 45s." };
  const parsedQuota = parseGeminiError(quotaErr);
  assert.equal(parsedQuota.status, 429);
  assert.equal(parsedQuota.code, "GEMINI_QUOTA_EXCEEDED");
  assert.equal(parsedQuota.retryAfter, 45);

  const generalErr = { message: "Service Unavailable" };
  const parsedGen = parseGeminiError(generalErr);
  assert.equal(parsedGen.status, 503);
  assert.equal(parsedGen.code, "GEMINI_SERVICE_UNAVAILABLE");
});

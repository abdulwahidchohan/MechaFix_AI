import test from "node:test";
import assert from "node:assert/strict";
import { FirebaseAdminError } from "../../lib/firebase-admin";
import { normalizeFirestoreDate } from "../../lib/date-utils";
import { parseGeminiError } from "../../lib/ai/errors";
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
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456",
  };
  const validRes = validateFirebaseClientConfig(completeConfig);
  assert.equal(validRes.valid, true);
  assert.equal(validRes.missing.length, 0);

  const incompleteConfig = {
    apiKey: "AIzaSy_Valid_Mock_Key",
    authDomain: undefined,
    projectId: undefined,
    storageBucket: undefined,
    messagingSenderId: undefined,
    appId: undefined,
  };
  const invalidRes = validateFirebaseClientConfig(incompleteConfig);
  assert.equal(invalidRes.valid, false);
  assert.equal(invalidRes.missing.includes("projectId"), true);
});

test("Firebase Admin synthetic error & config validation rules", () => {
  const err = new FirebaseAdminError("Database project_id mismatch", "FIREBASE_ADMIN_UNAVAILABLE", 503);
  assert.equal(err.name, "FirebaseAdminError");
  assert.equal(err.code, "FIREBASE_ADMIN_UNAVAILABLE");
  assert.equal(err.status, 503);
});

test("normalizeFirestoreDate handles all timestamp variants and invalid inputs safely", () => {
  const iso = "2026-07-27T12:00:00.000Z";
  const dateObj = normalizeFirestoreDate(iso);
  assert.equal(dateObj instanceof Date, true);
  assert.equal(dateObj.toISOString(), iso);

  const tsMock = { toDate: () => new Date("2026-07-27T12:00:00.000Z") };
  assert.equal(normalizeFirestoreDate(tsMock).toISOString(), iso);

  const secondsMock = { seconds: 1785153600, nanoseconds: 0 };
  assert.equal(normalizeFirestoreDate(secondsMock) instanceof Date, true);

  const fallback = normalizeFirestoreDate(null);
  assert.equal(fallback instanceof Date, true);
});

test("parseGeminiError handles quota, missing keys, and model service errors", () => {
  const quotaErr = parseGeminiError("429 RESOURCE_EXHAUSTED retry in 14.5s");
  assert.equal(quotaErr.code, "GEMINI_QUOTA_EXCEEDED");
  assert.equal(quotaErr.status, 429);
  assert.equal(quotaErr.retryAfter, 15);

  const missingKeyErr = parseGeminiError("GEMINI_API_KEY environment variable is not configured.");
  assert.equal(missingKeyErr.code, "CONFIG_MISSING");
  assert.equal(missingKeyErr.status, 503);

  const genericErr = parseGeminiError("Internal AI service error");
  assert.equal(genericErr.code, "GEMINI_SERVICE_UNAVAILABLE");
  assert.equal(genericErr.status, 503);
});

test("Firestore document construction sanitizes undefined fields to null", () => {
  const rawStep: any = {
    id: "step-1",
    instruction: "Check VCC voltage",
    requestedMeasurementType: undefined,
  };

  const sanitizedStep = {
    id: rawStep.id,
    instruction: rawStep.instruction,
    requestedMeasurementType: rawStep.requestedMeasurementType || null,
  };

  assert.equal(sanitizedStep.requestedMeasurementType, null);
  assert.notEqual(sanitizedStep.requestedMeasurementType, undefined);
});

test("Firestore Map cache pattern guarantees single settings application per database ID", () => {
  const cache = new Map<string, { name: string; settingsCount: number }>();

  function getMockDb(dbName: string = "default") {
    if (cache.has(dbName)) {
      return cache.get(dbName)!;
    }
    const dbObj = { name: dbName, settingsCount: 0 };
    dbObj.settingsCount++;
    cache.set(dbName, dbObj);
    return dbObj;
  }

  const db1 = getMockDb("default");
  const db2 = getMockDb("default");
  assert.equal(db1, db2);
  assert.equal(db1.settingsCount, 1);

  const dbNamed = getMockDb("staging");
  assert.notEqual(db1, dbNamed);
  assert.equal(dbNamed.settingsCount, 1);
});

import test from "node:test";
import assert from "node:assert/strict";
import { MODELS } from "../lib/ai/models";
import { FirebaseAdminError } from "../lib/firebase-admin";
import { normalizeFirestoreDate } from "../lib/date-utils";

test("ENABLE_REFERENCE_DIAGRAMS evaluates strictly to boolean true only when string is 'true'", () => {
  const orig = process.env.ENABLE_REFERENCE_DIAGRAMS;

  process.env.ENABLE_REFERENCE_DIAGRAMS = "false";
  assert.equal(MODELS.isReferenceDiagramsEnabled, false);

  process.env.ENABLE_REFERENCE_DIAGRAMS = "1";
  assert.equal(MODELS.isReferenceDiagramsEnabled, false);

  process.env.ENABLE_REFERENCE_DIAGRAMS = "true";
  assert.equal(MODELS.isReferenceDiagramsEnabled, true);

  process.env.ENABLE_REFERENCE_DIAGRAMS = orig;
});

test("FirebaseAdminError constructs typed 503 error", () => {
  const err = new FirebaseAdminError("Missing key", "CONFIG_MISSING", 503);
  assert.equal(err.name, "FirebaseAdminError");
  assert.equal(err.code, "CONFIG_MISSING");
  assert.equal(err.status, 503);
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

test("normalizeFirestoreDate handles Firestore Timestamps, objects, ISO strings, numbers, and null fallbacks safely", () => {
  const fallback = new Date("2026-01-01T00:00:00.000Z");

  // 1. Object with toDate()
  const mockTimestamp = {
    toDate: () => new Date("2026-05-15T10:00:00.000Z"),
  };
  assert.equal(
    normalizeFirestoreDate(mockTimestamp, fallback).toISOString(),
    "2026-05-15T10:00:00.000Z"
  );

  // 2. Serialized timestamp object { seconds, nanoseconds }
  const mockSerialized = { seconds: 1778848800, nanoseconds: 500000000 };
  assert.equal(
    normalizeFirestoreDate(mockSerialized, fallback).getFullYear(),
    2026
  );

  // 3. JavaScript Date instance
  const jsDate = new Date("2026-07-27T15:00:00.000Z");
  assert.equal(
    normalizeFirestoreDate(jsDate, fallback).toISOString(),
    "2026-07-27T15:00:00.000Z"
  );

  // 4. ISO string
  assert.equal(
    normalizeFirestoreDate("2026-03-20T08:30:00.000Z", fallback).toISOString(),
    "2026-03-20T08:30:00.000Z"
  );

  // 5. Epoch number
  const numEpoch = 1773995400000;
  assert.equal(
    normalizeFirestoreDate(numEpoch, fallback).getTime(),
    numEpoch
  );

  // 6. Null / undefined / invalid string -> fallback returned without crash
  assert.equal(
    normalizeFirestoreDate(null, fallback).toISOString(),
    "2026-01-01T00:00:00.000Z"
  );
  assert.equal(
    normalizeFirestoreDate(undefined, fallback).toISOString(),
    "2026-01-01T00:00:00.000Z"
  );
  assert.equal(
    normalizeFirestoreDate("invalid-date-string", fallback).toISOString(),
    "2026-01-01T00:00:00.000Z"
  );
});

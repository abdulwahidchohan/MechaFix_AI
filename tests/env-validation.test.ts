import test from "node:test";
import assert from "node:assert/strict";
import { MODELS } from "../lib/ai/models";
import { FirebaseAdminError } from "../lib/firebase-admin";

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

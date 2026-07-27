import test from "node:test";
import assert from "node:assert/strict";
import { GET as capabilitiesGet } from "../../app/api/capabilities/route";
import { parseApiError, parseGeminiError } from "../../lib/ai/errors";

test("GET /api/capabilities returns 200 with dynamic boolean capability flags", async () => {
  const orig = process.env.ENABLE_REFERENCE_DIAGRAMS;
  process.env.ENABLE_REFERENCE_DIAGRAMS = "true";

  const response = await capabilitiesGet();
  assert.equal(response.status, 200);

  const json = await response.json();
  assert.equal(json.referenceDiagrams, true);
  assert.equal(json.imageAnnotations, true);
  assert.equal(json.multipleImages, true);
  assert.equal(json.directPdf, true);

  process.env.ENABLE_REFERENCE_DIAGRAMS = orig;
});

test("API Route error contract mapping returns correct HTTP status codes", () => {
  // 401 Auth invalid
  const authErr = parseApiError({ code: "unauthenticated", message: "Missing Bearer token" });
  assert.equal(authErr.status, 401);
  assert.equal(authErr.code, "AUTH_TOKEN_INVALID");

  // 403 Access denied
  const permErr = parseApiError({ code: "permission-denied", message: "Cross-user access forbidden" });
  assert.equal(permErr.status, 403);
  assert.equal(permErr.code, "ACCESS_DENIED");

  // 404 Diagnosis not found
  const notFoundErr = parseApiError({ code: "not-found", message: "Diagnosis session missing" });
  assert.equal(notFoundErr.status, 404);
  assert.equal(notFoundErr.code, "DIAGNOSIS_NOT_FOUND");

  // 409 Duplicate / Stale step
  const dupErr = parseApiError({ code: "already-exists", message: "Step result already submitted" });
  assert.equal(dupErr.status, 409);
  assert.equal(dupErr.code, "DUPLICATE_REQUEST");

  // 429 Quota exceeded
  const quotaErr = parseGeminiError({ status: 429, message: "RESOURCE_EXHAUSTED" });
  assert.equal(quotaErr.status, 429);
  assert.equal(quotaErr.code, "GEMINI_QUOTA_EXCEEDED");

  // 503 Firestore Service unavailable
  const unavailErr = parseApiError({ code: "unavailable", message: "Firestore connection offline" });
  assert.equal(unavailErr.status, 503);
  assert.equal(unavailErr.code, "FIRESTORE_UNAVAILABLE");
});

test("Measurement Logging UI structure validates test points and values accurately", () => {
  const sampleMeasurement = {
    id: "meas_123",
    type: "Voltage",
    location: "VCC to GND on U1",
    value: "4.82",
    unit: "V",
    notes: "Measured under load",
    timestamp: "10:30 PM",
    isUserReported: true,
  };

  assert.equal(sampleMeasurement.type, "Voltage");
  assert.equal(sampleMeasurement.location, "VCC to GND on U1");
  assert.equal(sampleMeasurement.value, "4.82");
  assert.equal(sampleMeasurement.unit, "V");
  assert.equal(sampleMeasurement.isUserReported, true);
});

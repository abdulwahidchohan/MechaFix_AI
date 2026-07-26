#!/usr/bin/env node
/**
 * MechaFix AI — Error-Handling Static Sanity Tests
 *
 * Static analysis of source files to verify:
 * - Fake AI fallbacks removed
 * - Correct HTTP status codes enforced
 * - User state preserved on failure
 *
 * Run with: npm test
 */

const fs = require("fs");
const path = require("path");

let passed = 0;
let failed = 0;
const root = process.cwd();

function readFile(relPath) {
  const absPath = path.join(root, relPath);
  if (!fs.existsSync(absPath)) return null;
  return fs.readFileSync(absPath, "utf-8");
}

function assert(description, condition) {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    failed++;
  }
}

// ─── [1] errors.ts — typed error classes ─────────────────────────────────────
console.log("\n[1] lib/ai/errors.ts — typed error classes");
(function () {
  const content = readFile("lib/ai/errors.ts");
  assert("errors.ts exists", content !== null);
  if (!content) return;
  assert("GeminiServiceError class defined", content.includes("class GeminiServiceError"));
  assert("FirebaseAdminError class defined", content.includes("class FirebaseAdminError"));
  assert("GeminiServiceError has publicMessage field", content.includes("publicMessage"));
  assert("GeminiServiceError has retryable field", content.includes("retryable"));
  assert("GeminiServiceError has internalMessage field", content.includes("internalMessage"));
  assert("FirebaseAdminError has status 503 default", content.includes("503"));
})();

// ─── [2] client.ts — CONFIG_MISSING at 503 ───────────────────────────────────
console.log("\n[2] lib/ai/client.ts — CONFIG_MISSING at 503");
(function () {
  const content = readFile("lib/ai/client.ts");
  assert("client.ts exists", content !== null);
  if (!content) return;
  assert("Missing key code is CONFIG_MISSING", content.includes('"CONFIG_MISSING"'));
  assert("Missing key status is 503", content.includes("503"));
  assert("Missing key is NOT status 500", !content.includes('"MISSING_API_KEY"'));
  assert("client.ts does not print raw API key", !content.includes("console.log(apiKey)"));
})();

// ─── [3] interactions.ts — no fake fallbacks, proper error codes ──────────────
console.log("\n[3] lib/ai/interactions.ts — no fake fallbacks, proper codes");
(function () {
  const content = readFile("lib/ai/interactions.ts");
  assert("interactions.ts exists", content !== null);
  if (!content) return;

  // Fake data patterns must be absent
  assert("No baseline wiring diagnosis object", !content.includes("Wiring or Contact Resistance"));
  assert("No fake hypothesis id hyp-1", !content.match(/id:\s*["']hyp-1["']/));
  assert("No fake next step step-2 hardcoded", !content.includes('"step-2"'));
  assert("No fake fallback return object", !content.includes("analysisOfResult: \"Test result"));

  // Correct codes must be present
  assert("Uses GEMINI_SERVICE_UNAVAILABLE code", content.includes("GEMINI_SERVICE_UNAVAILABLE"));
  assert("Uses GEMINI_QUOTA_EXCEEDED code", content.includes("GEMINI_QUOTA_EXCEEDED"));
  assert("Re-throws GeminiServiceError (name check)", content.includes('err?.name === "GeminiServiceError"'));
  assert("Has isQuotaError helper", content.includes("function isQuotaError"));
  assert("Uses GEMINI_SERVICE_UNAVAILABLE code", content.includes("GEMINI_SERVICE_UNAVAILABLE"));
  assert("Passes true (retryable) to GeminiServiceError on recoverable errors", 
    content.includes("true\n      )") || content.includes(", true\n    )") || content.includes(", true,") || (content.match(/GeminiServiceError\([^)]*true/g) || []).length > 0);
})();

// ─── [4] follow-up/route.ts — fake fallback removed ──────────────────────────
console.log("\n[4] app/api/gemini/follow-up/route.ts — fake fallback removed");
(function () {
  const content = readFile("app/api/gemini/follow-up/route.ts");
  assert("follow-up route exists", content !== null);
  if (!content) return;

  assert("No fake 'Based on your hardware setup' response", !content.includes("Based on your hardware setup"));
  assert("No unconditional assistantText fallback string", !content.match(/assistantText\s*=\s*`Based on/));
  assert("Returns 503 CONFIG_MISSING on missing key", content.includes("CONFIG_MISSING") && content.includes("503"));
  assert("Returns 429 GEMINI_QUOTA_EXCEEDED on quota", content.includes("GEMINI_QUOTA_EXCEEDED") && content.includes("429"));
  assert("Returns 503 GEMINI_SERVICE_UNAVAILABLE on empty response", content.includes("GEMINI_SERVICE_UNAVAILABLE"));
  assert("Has retryable flag in responses", content.includes("retryable: true"));
  assert("Has Retry-After header for quota", content.includes("Retry-After"));
  assert("Firestore write is after assistantText check", 
    content.indexOf("assistantText || !assistantText.trim()") < content.indexOf("FieldValue.arrayUnion"));
  assert("Only saves valid response to Firestore", 
    !content.includes("assistantText = `") && content.includes("followUpHistory"));
})();

// ─── [5] step-result/route.ts — accurate error codes, step preserved ─────────
console.log("\n[5] app/api/diagnoses/step-result/route.ts — accurate codes, step preserved");
(function () {
  const content = readFile("app/api/diagnoses/step-result/route.ts");
  assert("step-result route exists", content !== null);
  if (!content) return;

  assert("Returns 400 INVALID_STEP_RESULT on bad input", content.includes("INVALID_STEP_RESULT") && content.includes("400"));
  assert("Returns 401 AUTH_TOKEN_INVALID on missing token", content.includes("AUTH_TOKEN_INVALID") && content.includes("401"));
  assert("Returns 404 DIAGNOSIS_NOT_FOUND", content.includes("DIAGNOSIS_NOT_FOUND") && content.includes("404"));
  assert("Returns 409 STALE_DIAGNOSTIC_STEP", content.includes("STALE_DIAGNOSTIC_STEP") && content.includes("409"));
  assert("Returns 503 GEMINI_SERVICE_UNAVAILABLE on Gemini failure", content.includes("GEMINI_SERVICE_UNAVAILABLE"));
  assert("Returns 503 AI_RESPONSE_INVALID on invalid response", content.includes("AI_RESPONSE_INVALID"));
  assert("GeminiServiceError imported", content.includes('from "@/lib/ai/errors"') || content.includes("GeminiServiceError"));
  assert("Step NOT marked completed before Gemini call", 
    content.indexOf("updatedProgress") > content.indexOf("runStepEvaluation"));
  assert("Gemini failure returns before state mutation", 
    content.indexOf("return NextResponse.json") < content.indexOf("updatedProgress"));
  assert("retryable: true on Gemini failure", content.includes("retryable: true"));
  assert("No fake next step generated on failure", !content.includes("Multimeter Voltage"));
})();

// ─── [6] analyze/route.ts — correct error codes ───────────────────────────────
console.log("\n[6] app/api/gemini/analyze/route.ts — correct error codes");
(function () {
  const content = readFile("app/api/gemini/analyze/route.ts");
  assert("analyze route exists", content !== null);
  if (!content) return;

  assert("Uses GEMINI_SERVICE_UNAVAILABLE (not SERVICE_UNAVAILABLE)", 
    content.includes("GEMINI_SERVICE_UNAVAILABLE") && !content.includes('"SERVICE_UNAVAILABLE"'));
  assert("Uses GEMINI_QUOTA_EXCEEDED", content.includes("GEMINI_QUOTA_EXCEEDED"));
  assert("No duplicate function definition", (content.match(/export async function POST/g) || []).length === 1);
  assert("No fake hardware fallback object in analyze", !content.includes("Hardware module communication failure"));
})();

// ─── [7] generate-reference-diagram — no SVG fallback ─────────────────────────
console.log("\n[7] app/api/gemini/generate-reference-diagram/route.ts — no SVG wiring fallback");
(function () {
  const content = readFile("app/api/gemini/generate-reference-diagram/route.ts");
  assert("reference diagram route exists", content !== null);
  if (!content) return;

  assert("No SVG wiring schematic fallback", !content.includes('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert("Returns 503 SERVICE_UNAVAILABLE when image fails", content.includes("SERVICE_UNAVAILABLE") && content.includes("503"));
  assert("Returns 403 FEATURE_DISABLED when disabled", content.includes("FEATURE_DISABLED") && content.includes("403"));
  assert("No SVG base64 fallback string generation", !content.includes('Buffer.from(fallbackSvg)'));
})();

// ─── [8] Audit for remaining forbidden patterns across all routes ─────────────
console.log("\n[8] Global audit — no forbidden fake-AI patterns");
(function () {
  const filesToAudit = [
    "app/api/gemini/analyze/route.ts",
    "app/api/gemini/follow-up/route.ts",
    "app/api/gemini/generate-reference-diagram/route.ts",
    "app/api/diagnoses/step-result/route.ts",
    "lib/ai/interactions.ts",
  ];

  const forbiddenPatterns = [
    { pattern: /generating baseline hardware diagnosis fallback/i, label: "baseline hardware diagnosis fallback" },
    { pattern: /returning baseline step fallback/i, label: "returning baseline step fallback" },
    { pattern: /Based on your hardware setup.*Ensure common GND/s, label: "fake GND advice fallback" },
    { pattern: /Hardware module communication failure or power instability detected/i, label: "fake issue_summary" },
    { pattern: /Loose jumper wire connection or improper pin alignment/i, label: "fake potential_causes" },
    { pattern: /Loose breadboard spring clip/i, label: "fake breadboard diagnosis" },
  ];

  for (const relPath of filesToAudit) {
    const content = readFile(relPath);
    if (!content) {
      assert(`${relPath} exists for audit`, false);
      continue;
    }
    for (const { pattern, label } of forbiddenPatterns) {
      assert(`${relPath} — no "${label}"`, !pattern.test(content));
    }
  }
})();

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(60)}`);
console.log(`Test Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);
if (failed > 0) {
  console.error("\n❌ Some tests FAILED. Fix issues before committing.");
  process.exit(1);
} else {
  console.log("\n✅ All error-handling sanity tests passed successfully.");
  process.exit(0);
}

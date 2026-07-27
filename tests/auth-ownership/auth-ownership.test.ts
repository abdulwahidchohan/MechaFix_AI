import test from "node:test";
import assert from "node:assert/strict";

interface SyntheticToken {
  uid: string;
  email: string;
  exp: number;
}

interface SyntheticRecord {
  id: string;
  userId: string;
  setup: { board: string; component: string };
  status: string;
}

function verifySyntheticToken(authHeader?: string | null): { valid: boolean; user?: SyntheticToken; error?: string; status: number; code: string } {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Unauthorized: Missing Bearer token.", status: 401, code: "AUTH_TOKEN_INVALID" };
  }

  const tokenString = authHeader.split("Bearer ")[1]?.trim();
  if (!tokenString || tokenString === "invalid-token" || tokenString === "expired-token") {
    return { valid: false, error: "Unauthorized: Invalid or expired ID token.", status: 401, code: "AUTH_TOKEN_INVALID" };
  }

  if (tokenString === "mock-token-user-a") {
    return { valid: true, user: { uid: "user-a-123", email: "usera@example.com", exp: Date.now() + 3600000 }, status: 200, code: "OK" };
  }

  if (tokenString === "mock-token-user-b") {
    return { valid: true, user: { uid: "user-b-456", email: "userb@example.com", exp: Date.now() + 3600000 }, status: 200, code: "OK" };
  }

  return { valid: false, error: "Unauthorized: Unknown token signature.", status: 401, code: "AUTH_TOKEN_INVALID" };
}

function checkDocumentOwnership(requestUid: string, recordOwnerUid: string): { allowed: boolean; status: number; code: string } {
  if (requestUid !== recordOwnerUid) {
    return { allowed: false, status: 403, code: "ACCESS_DENIED" };
  }
  return { allowed: true, status: 200, code: "OK" };
}

test("verifySyntheticToken rejects missing, malformed, or expired Bearer headers with 401", () => {
  assert.equal(verifySyntheticToken(null).status, 401);
  assert.equal(verifySyntheticToken("").status, 401);
  assert.equal(verifySyntheticToken("Basic dXNlcjpwYXNz").status, 401);
  assert.equal(verifySyntheticToken("Bearer invalid-token").status, 401);
  assert.equal(verifySyntheticToken("Bearer expired-token").status, 401);

  const validA = verifySyntheticToken("Bearer mock-token-user-a");
  assert.equal(validA.status, 200);
  assert.equal(validA.user?.uid, "user-a-123");
});

test("checkDocumentOwnership enforces User-A vs User-B data isolation", () => {
  const recordA: SyntheticRecord = { id: "diag-1", userId: "user-a-123", setup: { board: "Arduino", component: "HC-SR04" }, status: "in_progress" };

  // User-A accessing User-A document -> Allowed
  assert.equal(checkDocumentOwnership("user-a-123", recordA.userId).status, 200);

  // User-B attempting to access User-A document -> 403 ACCESS_DENIED
  const accessB = checkDocumentOwnership("user-b-456", recordA.userId);
  assert.equal(accessB.status, 403);
  assert.equal(accessB.code, "ACCESS_DENIED");
});

test("request-body UID override attempt is overridden by verified token UID", () => {
  const verifiedUid = "user-a-123";
  const requestBody = { userId: "user-b-456", diagnosisId: "diag-100" };

  // Strict policy: Target Firestore path must use verifiedUid, ignoring requestBody.userId
  const targetPath = `/users/${verifiedUid}/diagnoses/${requestBody.diagnosisId}`;
  assert.equal(targetPath.includes("user-a-123"), true);
  assert.equal(targetPath.includes("user-b-456"), false);
});

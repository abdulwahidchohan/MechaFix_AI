import { initializeApp, getApps, getApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

export class FirebaseAdminError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = "FIREBASE_ADMIN_UNAVAILABLE", status = 503) {
    super(message);
    this.name = "FirebaseAdminError";
    this.code = code;
    this.status = status;
  }
}

function ensureFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!rawServiceAccount || !rawServiceAccount.trim()) {
    throw new FirebaseAdminError(
      "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not configured.",
      "CONFIG_MISSING",
      503
    );
  }

  let serviceAccount: any;
  try {
    const trimmed = rawServiceAccount.trim();
    serviceAccount = typeof trimmed === "string" ? JSON.parse(trimmed) : trimmed;
  } catch (err) {
    throw new FirebaseAdminError(
      "FIREBASE_SERVICE_ACCOUNT_KEY contains malformed JSON.",
      "FIREBASE_ADMIN_UNAVAILABLE",
      503
    );
  }

  if (
    !serviceAccount ||
    serviceAccount.type !== "service_account" ||
    !serviceAccount.project_id ||
    !serviceAccount.client_email ||
    !serviceAccount.private_key
  ) {
    throw new FirebaseAdminError(
      "FIREBASE_SERVICE_ACCOUNT_KEY is missing required service account properties.",
      "FIREBASE_ADMIN_UNAVAILABLE",
      503
    );
  }

  const expectedProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hekto-awm";
  if (serviceAccount.project_id !== expectedProjectId) {
    throw new FirebaseAdminError(
      `Firebase Admin project_id (${serviceAccount.project_id}) mismatch with expected (${expectedProjectId}).`,
      "FIREBASE_ADMIN_UNAVAILABLE",
      503
    );
  }

  const formattedPrivateKey = typeof serviceAccount.private_key === "string"
    ? serviceAccount.private_key.replace(/\\n/g, "\n")
    : serviceAccount.private_key;

  if (
    !formattedPrivateKey.includes("-----BEGIN PRIVATE KEY-----") ||
    !formattedPrivateKey.includes("-----END PRIVATE KEY-----")
  ) {
    throw new FirebaseAdminError(
      "FIREBASE_SERVICE_ACCOUNT_KEY private_key is not a valid PEM key.",
      "FIREBASE_ADMIN_UNAVAILABLE",
      503
    );
  }

  try {
    return initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: formattedPrivateKey,
      }),
      projectId: serviceAccount.project_id,
    });
  } catch (initErr: any) {
    throw new FirebaseAdminError(
      `Firebase Admin initialization failed: ${initErr?.message || initErr}`,
      "FIREBASE_ADMIN_UNAVAILABLE",
      503
    );
  }
}

export function getAdminAuth(): Auth {
  const app = ensureFirebaseAdminApp();
  return getAuth(app);
}

const firestoreCache = new Map<string, Firestore>();

export function getAdminFirestore(): Firestore {
  const app = ensureFirebaseAdminApp();
  const dbName = (process.env.FIREBASE_DATABASE_ID || "default").trim();

  if (firestoreCache.has(dbName)) {
    return firestoreCache.get(dbName)!;
  }

  const db = dbName !== "default" ? getFirestore(app, dbName) : getFirestore(app);
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch (err: any) {
    if (!err?.message?.includes("already been initialized")) {
      console.warn("Firestore settings notice:", err?.message || err);
    }
  }
  firestoreCache.set(dbName, db);
  return db;
}

export async function verifyUserToken(token: string): Promise<string> {
  if (!token || typeof token !== "string" || !token.trim()) {
    const err: any = new Error("Missing or empty authorization token.");
    err.status = 401;
    err.code = "AUTH_TOKEN_INVALID";
    throw err;
  }

  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token.trim());
    return decodedToken.uid;
  } catch (err: any) {
    if (err instanceof FirebaseAdminError) {
      throw err;
    }
    const authErr: any = new Error("Invalid or expired authorization token. Please sign in again.");
    authErr.status = 401;
    authErr.code = "AUTH_TOKEN_INVALID";
    throw authErr;
  }
}

import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mystic-core-pgtt6";
const firestoreDatabaseId =
  process.env.FIREBASE_DATABASE_ID ||
  process.env.FIRESTORE_DATABASE_ID ||
  "ai-studio-1ff06b99-a6b1-4864-98f4-4ba50526effb";

if (!getApps().length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : undefined;

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
    } else {
      if (process.env.NODE_ENV === "production") {
        console.warn(
          "FIREBASE_SERVICE_ACCOUNT_KEY is missing. Firebase Admin will initialize without credentials, but token verification and Firestore writes may fail until a service account is configured."
        );
      }

      initializeApp({
        projectId,
      });
    }
  } catch (error) {
    console.error("Firebase Admin Initialization Error", error);
  }
}

export const adminDb = getFirestore(getApp(), firestoreDatabaseId);
export const adminAuth = getAuth(getApp());

export function getAdminAuth() {
  return adminAuth;
}

export function getAdminFirestore() {
  return adminDb;
}

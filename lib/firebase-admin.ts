import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  // Try initializing with Application Default Credentials if available
  // In development, FIREBASE_SERVICE_ACCOUNT_KEY must be set in .env
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : undefined;

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: "mystic-core-pgtt6",
      });
    } else {
      initializeApp({
        projectId: "mystic-core-pgtt6",
      });
    }
  } catch (error) {
    console.error("Firebase Admin Initialization Error", error);
  }
}

export const adminDb = getFirestore(getApp(), "ai-studio-1ff06b99-a6b1-4864-98f4-4ba50526effb");
export const adminAuth = getAuth(getApp());

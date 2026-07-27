import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const rawConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function validateFirebaseClientConfig(config: typeof rawConfig): { valid: boolean; missing: string[] } {
  const missing = Object.entries(config)
    .filter(([, value]) => !value || typeof value !== "string" || value.trim() === "")
    .map(([key]) => key);
  return { valid: missing.length === 0, missing };
}

const validation = validateFirebaseClientConfig(rawConfig);
if (!validation.valid && typeof window !== "undefined") {
  console.warn(`[Firebase Client] Missing required configuration keys: ${validation.missing.join(", ")}`);
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSy_Placeholder_Key_For_Static_Testing",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "hekto-awm.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hekto-awm",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "hekto-awm.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "920507935916",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:920507935916:web:addb2991a3546f2ea70309",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let firestoreInstance;
try {
  const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID;
  if (databaseId) {
    firestoreInstance = getFirestore(app, databaseId);
  } else {
    firestoreInstance = getFirestore(app);
  }
} catch (e) {
  firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;

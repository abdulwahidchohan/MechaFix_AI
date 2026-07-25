import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCxNGifamrRJInkPeCfZr5FukqBfwOT3bQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mystic-core-pgtt6.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mystic-core-pgtt6",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mystic-core-pgtt6.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "447844057207",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:447844057207:web:630d2ef62461c1ed070672",
};

const firestoreDatabaseId =
  process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID ||
  process.env.FIRESTORE_DATABASE_ID ||
  "ai-studio-1ff06b99-a6b1-4864-98f4-4ba50526effb";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app, firestoreDatabaseId);

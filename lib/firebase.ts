import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "mystic-core-pgtt6",
  appId: "1:447844057207:web:630d2ef62461c1ed070672",
  apiKey: "AIzaSyCxNGifamrRJInkPeCfZr5FukqBfwOT3bQ",
  authDomain: "mystic-core-pgtt6.firebaseapp.com",
  storageBucket: "mystic-core-pgtt6.firebasestorage.app",
  messagingSenderId: "447844057207"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app, "ai-studio-1ff06b99-a6b1-4864-98f4-4ba50526effb");

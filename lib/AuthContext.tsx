"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        setAuthError(null);
      }
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      if (e.code !== 'auth/cancelled-popup-request') {
        const code = e?.code || "auth/unknown-error";
        const message =
          code === "auth/unauthorized-domain"
            ? "Firebase Auth me is domain ko Authorized domains me add karein: mecha-fix-ai.vercel.app"
            : code === "auth/popup-blocked"
              ? "Browser ne sign-in popup block kar diya. Popups allow karke dobara try karein."
              : e?.message || "Google sign-in failed. Please try again.";

        setAuthError(`${code}: ${message}`);
        console.error(e);
      }
    }
  };

  const signOut = async () => {
    setAuthError(null);
    await auth.signOut();
  };

  return <AuthContext.Provider value={{ user, loading, signIn, signOut, authError }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

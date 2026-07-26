import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hekto-awm";

function fixPrivateKey(key: string): string {
  if (!key) return key;
  let formatted = key.replace(/\\n/g, "\n").replace(/\r/g, "");
  
  const header = "-----BEGIN PRIVATE KEY-----";
  const footer = "-----END PRIVATE KEY-----";
  
  if (formatted.includes(header) && formatted.includes(footer)) {
    const parts = formatted.split(header);
    const bodyAndFooter = parts[1].split(footer);
    let body = bodyAndFooter[0].replace(/\s+/g, "");
    
    if (body.length % 4 === 1) {
      body = body.slice(0, -1);
    } else if (body.length % 4 === 2) {
      body = body + "==";
    } else if (body.length % 4 === 3) {
      body = body + "=";
    }
    
    const chunkedBody: string[] = [];
    for (let i = 0; i < body.length; i += 64) {
      chunkedBody.push(body.slice(i, i + 64));
    }
    
    return `${header}\n${chunkedBody.join("\n")}\n${footer}\n`;
  }
  
  return formatted;
}

if (!getApps().length) {
  let adminAppInitialized = false;
  try {
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    let serviceAccount: any = undefined;

    if (rawKey) {
      try {
        let cleanedKey = rawKey.trim();
        if (
          (cleanedKey.startsWith("'") && cleanedKey.endsWith("'")) ||
          (cleanedKey.startsWith('"') && cleanedKey.endsWith('"'))
        ) {
          cleanedKey = cleanedKey.slice(1, -1);
        }
        serviceAccount = JSON.parse(cleanedKey);
      } catch (e1) {
        try {
          const unescaped = rawKey.replace(/\\n/g, "\n");
          serviceAccount = JSON.parse(unescaped);
        } catch (e2) {
          console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON", e1);
        }
      }
    }

    if (serviceAccount && serviceAccount.project_id) {
      if (typeof serviceAccount.private_key === "string") {
        serviceAccount.private_key = fixPrivateKey(serviceAccount.private_key);
      }
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
      adminAppInitialized = true;
    }
  } catch (error) {
    console.error("Firebase Admin Initialization Error", error);
  }

  if (!adminAppInitialized && !getApps().length) {
    initializeApp({
      projectId,
    });
  }
}

export function getAdminAuth() {
  try {
    if (!getApps().length) return null;
    return getAuth(getApp());
  } catch (e) {
    console.warn("getAdminAuth notice:", e);
    return null;
  }
}

export function getAdminFirestore() {
  try {
    if (!getApps().length) return null;
    const dbName = process.env.FIREBASE_DATABASE_ID;
    return dbName ? getFirestore(getApp(), dbName) : getFirestore(getApp());
  } catch (e) {
    console.warn("getAdminFirestore notice:", e);
    return null;
  }
}

export async function verifyUserToken(token: string): Promise<string> {
  if (!token) return "guest_user";
  
  if (token.startsWith("guest_") || token.startsWith("guest-")) {
    return token.slice(0, 50);
  }

  try {
    const auth = getAdminAuth();
    if (auth) {
      const decodedToken = await auth.verifyIdToken(token);
      return decodedToken.uid;
    }
  } catch (err: any) {
    console.warn("Firebase verifyIdToken fallback:", err?.message || err);
  }

  if (token.length > 10) {
    return `user_${token.slice(-12)}`;
  }
  return "guest_user";
}


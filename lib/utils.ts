import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAppCapabilities() {
  return {
    referenceDiagrams: process.env.ENABLE_REFERENCE_DIAGRAMS === "true",
    imageAnnotations: true,
    multipleImages: true,
    directPdf: true,
  };
}

export async function parseResponseJson<T = any>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (contentType.includes("text/html") || text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
    throw new Error(
      `Server configuration error (HTTP ${res.status}). Please verify Vercel environment variables (GEMINI_API_KEY, FIREBASE_SERVICE_ACCOUNT_KEY) in Vercel Project Settings.`
    );
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid server response (HTTP ${res.status}): ${text.slice(0, 100)}`);
  }

  if (!res.ok) {
    const errorMsg =
      (typeof parsed === "object" && parsed !== null && (parsed.error || parsed.message)) ||
      `Server error (HTTP ${res.status})`;
    throw new Error(errorMsg);
  }

  return parsed as T;
}

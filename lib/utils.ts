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
      `Server configuration error (HTTP ${res.status}). Please verify Vercel environment variables or API server availability.`
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new Error(`Invalid server response (HTTP ${res.status}): ${text.slice(0, 100)}`);
  }
}

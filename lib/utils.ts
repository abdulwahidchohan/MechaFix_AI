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

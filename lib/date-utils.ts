import { Timestamp } from "firebase/firestore";

type FirestoreTimestampLike = {
  seconds?: number;
  nanoseconds?: number;
  _seconds?: number;
  _nanoseconds?: number;
  toDate?: () => Date;
};

export function normalizeFirestoreDate(
  value: unknown,
  fallback = new Date()
): Date {
  if (!value) {
    return fallback;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? fallback : value;
  }

  if (typeof Timestamp !== "undefined" && value instanceof Timestamp) {
    try {
      const d = value.toDate();
      return Number.isNaN(d.getTime()) ? fallback : d;
    } catch {
      return fallback;
    }
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as FirestoreTimestampLike).toDate === "function"
  ) {
    try {
      const converted = (value as FirestoreTimestampLike).toDate?.();
      return converted instanceof Date && !Number.isNaN(converted.getTime())
        ? converted
        : fallback;
    } catch {
      // Fall through to object parsing
    }
  }

  if (typeof value === "string" || typeof value === "number") {
    const converted = new Date(value);
    return Number.isNaN(converted.getTime()) ? fallback : converted;
  }

  if (typeof value === "object" && value !== null) {
    const timestamp = value as FirestoreTimestampLike;
    const seconds = timestamp.seconds ?? timestamp._seconds;

    if (typeof seconds === "number") {
      const nanoseconds = timestamp.nanoseconds ?? timestamp._nanoseconds ?? 0;
      const converted = new Date(
        seconds * 1000 + Math.floor(nanoseconds / 1_000_000)
      );
      return Number.isNaN(converted.getTime()) ? fallback : converted;
    }
  }

  return fallback;
}

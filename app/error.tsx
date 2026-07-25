"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App boundary error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-surface p-8 rounded-3xl border border-border shadow-neu-raised space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center mx-auto border border-red-500/20">
          <span className="material-symbols-outlined text-4xl">report_problem</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold font-sans text-text mb-2">Something went wrong</h2>
          <p className="text-sm font-sans text-text-muted">
            An unexpected error occurred. Your saved diagnosis records were not removed. Please try again or return to the main dashboard.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-3 rounded-2xl bg-primary text-surface font-sans font-semibold text-sm shadow-neu-raised hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            <span>Try Again</span>
          </button>
          <button
            type="button"
            onClick={() => window.location.href = "/"}
            className="px-6 py-3 rounded-2xl bg-surface-sunken text-text font-sans font-medium text-sm border border-border shadow-neu-pressed hover:bg-surface transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}

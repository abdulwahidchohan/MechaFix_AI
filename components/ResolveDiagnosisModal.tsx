"use client";

import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";

interface ResolveDiagnosisModalProps {
  diagnosisId: string;
  currentStatus: string;
  initialRootCause?: string;
  initialActionTaken?: string;
  initialNote?: string;
  onClose: () => void;
  onSuccess: (updatedStatus: string, resolutionData: { rootCause: string; actionTaken: string; finalNote: string }) => void;
}

export default function ResolveDiagnosisModal({
  diagnosisId,
  currentStatus,
  initialRootCause = "",
  initialActionTaken = "",
  initialNote = "",
  onClose,
  onSuccess,
}: ResolveDiagnosisModalProps) {
  const [targetStatus, setTargetStatus] = useState<"resolved" | "partially_resolved" | "in_progress">(
    currentStatus === "resolved" ? "resolved" : "resolved"
  );
  const [rootCause, setRootCause] = useState(initialRootCause);
  const [actionTaken, setActionTaken] = useState(initialActionTaken);
  const [finalNote, setFinalNote] = useState(initialNote);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (targetStatus !== "in_progress" && !rootCause.trim()) {
      setErrorMessage("Please specify the confirmed root cause before resolving.");
      return;
    }

    setIsSubmitting(true);
    try {
      let token = null;
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }

      const res = await fetch("/api/diagnoses/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          diagnosisId,
          status: targetStatus,
          rootCause,
          actionTaken,
          finalNote,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(targetStatus, { rootCause, actionTaken, finalNote });
        onClose();
      } else {
        setErrorMessage(data.error || "Failed to update diagnosis status.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "A network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-text/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-[80] animate-in fade-in duration-200 print:hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-surface w-full max-w-xl rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-border space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resolve-modal-title"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-2xl">check_circle</span>
            <h3 id="resolve-modal-title" className="font-sans font-bold text-xl text-text">
              {currentStatus === "resolved" ? "Edit Repair Resolution" : "Record Fix & Resolve"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text p-2 rounded-lg hover:bg-surface-sunken transition-colors"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 text-xs font-sans font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resolution Status Choice */}
          <div>
            <label className="block font-sans font-semibold text-xs uppercase tracking-wider text-text-muted mb-2">
              Select Resolution Outcome
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetStatus("resolved")}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  targetStatus === "resolved"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 shadow-neu-pressed font-bold"
                    : "bg-surface-sunken border-border text-text-muted hover:text-text"
                }`}
              >
                <span className="material-symbols-outlined text-lg">verified</span>
                Fully Resolved
              </button>

              <button
                type="button"
                onClick={() => setTargetStatus("partially_resolved")}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  targetStatus === "partially_resolved"
                    ? "bg-amber-500/15 border-amber-500 text-amber-600 shadow-neu-pressed font-bold"
                    : "bg-surface-sunken border-border text-text-muted hover:text-text"
                }`}
              >
                <span className="material-symbols-outlined text-lg">build_circle</span>
                Partial Fix
              </button>

              <button
                type="button"
                onClick={() => setTargetStatus("in_progress")}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  targetStatus === "in_progress"
                    ? "bg-primary-container border-primary text-primary shadow-neu-pressed font-bold"
                    : "bg-surface-sunken border-border text-text-muted hover:text-text"
                }`}
              >
                <span className="material-symbols-outlined text-lg">sync_restart</span>
                Reopen Analysis
              </button>
            </div>
          </div>

          {targetStatus !== "in_progress" && (
            <>
              {/* Confirmed Root Cause */}
              <div>
                <label className="block font-sans font-semibold text-xs text-text mb-1.5">
                  Confirmed Root Cause <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="e.g. Blown Q1 MOSFET, damaged 10uF capacitor, shorted PCB trace"
                  className="w-full bg-surface-sunken border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary"
                />
              </div>

              {/* Repair Action Taken */}
              <div>
                <label className="block font-sans font-semibold text-xs text-text mb-1.5">
                  Repair Action Taken
                </label>
                <textarea
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  rows={3}
                  placeholder="e.g. Replaced MOSFET Q1 with IRLZ44N, re-soldered header pins, reflowed joint"
                  className="w-full bg-surface-sunken border border-border rounded-xl p-3 text-sm text-text focus:outline-none focus:border-primary custom-scrollbar"
                />
              </div>

              {/* Final Notes */}
              <div>
                <label className="block font-sans font-semibold text-xs text-text mb-1.5">
                  Final Outcome & Operational Notes (Optional)
                </label>
                <input
                  type="text"
                  value={finalNote}
                  onChange={(e) => setFinalNote(e.target.value)}
                  placeholder="e.g. Tested on 5V power supply, current draw normal at 45mA"
                  className="w-full bg-surface-sunken border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-primary"
                />
              </div>
            </>
          )}

          {targetStatus === "in_progress" && (
            <div className="p-4 bg-primary-container/20 border border-primary/20 rounded-xl text-xs font-sans text-text-muted space-y-1">
              <p className="font-semibold text-primary">Reopening Diagnostic Session</p>
              <p>This will return the session to Active status and move it back to Active Diagnoses in Repair History.</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-surface-sunken text-text font-sans font-semibold text-xs border border-border hover:bg-border/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl font-sans font-semibold text-xs text-white shadow-neu-raised transition-all flex items-center gap-1.5 ${
                targetStatus === "in_progress"
                  ? "bg-primary hover:bg-primary-hover"
                  : targetStatus === "partially_resolved"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  {targetStatus === "in_progress" ? "Reopen Diagnosis" : "Save Fix & Close"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

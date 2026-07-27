"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db, auth } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { normalizeFirestoreDate } from "@/lib/date-utils";

interface Diagnosis {
  id: string;
  createdAt: Date;
  board?: string;
  component?: string;
  status: string;
  context: string;
  resolution?: {
    rootCause?: string;
    actionTaken?: string;
    finalNote?: string;
    resolvedAt?: any;
  };
  result: {
    issue_summary: string;
    components_detected: string[];
    potential_causes: string[];
    troubleshooting_steps: string[];
  };
}

export default function RepairHistoryView({ onViewReport }: { onViewReport?: (result: any) => void }) {
  const { user } = useAuth();
  const [history, setHistory] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "resolved" | "partially_resolved">("all");

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "diagnoses"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              createdAt: normalizeFirestoreDate(data.createdAt),
              board: data.board,
              component: data.component,
              status: data.status || "in_progress",
              context: data.context || "",
              resolution: data.resolution,
              result: data.result || {},
            } as Diagnosis;
          })
          .filter(
            (d) =>
              d.status === "resolved" ||
              d.status === "partially_resolved"
          );

        setHistory(docs);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching repair history:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleReopen = async (diagnosisId: string) => {
    if (!auth.currentUser) return;
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch("/api/diagnoses/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          diagnosisId,
          status: "in_progress",
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(`Failed to reopen diagnosis: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error reopening: ${err.message}`);
    }
  };

  const filteredHistory = history.filter((item) => {
    if (filter === "resolved") return item.status === "resolved";
    if (filter === "partially_resolved") return item.status === "partially_resolved";
    return true;
  });

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-12 animate-in fade-in duration-500 pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-sans text-3xl font-bold text-text">Repair History</h2>
          <p className="font-sans text-sm text-text-muted mt-1">
            Archive of resolved and partially resolved hardware issues with recorded fixes.
          </p>
        </div>

        {user && (
          <div className="flex bg-surface-sunken p-1 rounded-xl border border-border self-start sm:self-auto">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === "all" ? "bg-surface text-primary shadow-sm" : "text-text-muted hover:text-text"
              }`}
            >
              All ({history.length})
            </button>
            <button
              onClick={() => setFilter("resolved")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === "resolved" ? "bg-surface text-primary shadow-sm" : "text-text-muted hover:text-text"
              }`}
            >
              Fully Resolved ({history.filter((h) => h.status === "resolved").length})
            </button>
            <button
              onClick={() => setFilter("partially_resolved")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === "partially_resolved" ? "bg-surface text-primary shadow-sm" : "text-text-muted hover:text-text"
              }`}
            >
              Partial ({history.filter((h) => h.status === "partially_resolved").length})
            </button>
          </div>
        )}
      </div>

      {!user ? (
        <div className="shadow-neu-pressed bg-surface rounded-2xl p-8 border border-border text-center">
          <span className="material-symbols-outlined text-4xl text-text-muted mb-3">lock</span>
          <h3 className="font-sans font-semibold text-text text-lg">Sign in to view history</h3>
          <p className="font-sans text-text-muted mt-1">Secure, encrypted access to your past repairs.</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="shadow-neu-pressed bg-surface rounded-2xl p-12 border border-border text-center">
          <span className="material-symbols-outlined text-4xl text-text-muted mb-3">verified</span>
          <h3 className="font-sans font-semibold text-text text-lg">No completed repairs found</h3>
          <p className="font-sans text-text-muted mt-1">
            When you resolve a diagnosis from the report view, it will be saved here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="shadow-neu-raised bg-surface rounded-2xl p-6 border border-border space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold ${
                      item.status === "resolved"
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {item.status === "resolved" ? "check_circle" : "published_with_changes"}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-sans font-bold text-text text-lg">
                        {item.board || item.context || "Hardware Fix"}
                      </h3>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                          item.status === "resolved"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {item.status === "resolved" ? "Resolved" : "Partial"}
                      </span>
                    </div>
                    {item.component && (
                      <p className="font-sans text-xs text-text-muted">Target Component: {item.component}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  {item.createdAt.toLocaleDateString()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-sunken p-4 rounded-xl border border-border">
                <div>
                  <h4 className="font-sans text-xs font-semibold text-text uppercase tracking-wider mb-1">
                    Verified Issue
                  </h4>
                  <p className="font-sans text-sm text-text-muted line-clamp-2">
                    {item.result.issue_summary || "Issue addressed."}
                  </p>
                </div>

                {item.resolution && (
                  <div>
                    <h4 className="font-sans text-xs font-semibold text-text uppercase tracking-wider mb-1">
                      Resolution Record
                    </h4>
                    <p className="font-sans text-sm text-text font-medium">
                      Root Cause: <span className="text-text-muted font-normal">{item.resolution.rootCause}</span>
                    </p>
                    <p className="font-sans text-sm text-text font-medium mt-0.5">
                      Fix Applied: <span className="text-text-muted font-normal">{item.resolution.actionTaken}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleReopen(item.id)}
                  className="px-4 py-2 rounded-lg bg-surface-sunken text-text-muted hover:text-text hover:bg-border/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">history</span>
                  Reopen Session
                </button>

                {onViewReport && (
                  <button
                    type="button"
                    onClick={() => onViewReport(item)}
                    className="px-4 py-2 rounded-lg bg-primary text-surface font-sans font-semibold text-xs shadow-neu-raised hover:bg-primary-hover transition-all flex items-center gap-1.5"
                  >
                    View Report
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

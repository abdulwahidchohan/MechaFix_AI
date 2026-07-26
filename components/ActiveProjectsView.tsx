"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

interface Diagnosis {
  id: string;
  createdAt: Date;
  context: string;
  result: {
    issue_summary: string;
    components_detected: string[];
    potential_causes: string[];
    troubleshooting_steps: string[];
  };
}

export default function ActiveProjectsView({ onViewReport }: { onViewReport: (result: any) => void }) {
  const { user } = useAuth();
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Real-time listener for user's diagnoses (cross-device sync)
    // Securely scoped to the current user's document
    const q = query(
      collection(db, "users", user.uid, "diagnoses"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          context: data.context || "",
          result: data.result || {}
        } as Diagnosis;
      });
      setDiagnoses(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching active projects:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center pt-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-12 animate-in fade-in duration-500 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sans text-3xl font-bold text-text">Active Projects</h2>
          <p className="font-sans text-sm text-text-muted mt-1">Your recent hardware diagnostic sessions across all devices.</p>
        </div>
      </div>

      {!user ? (
        <div className="shadow-neu-pressed bg-surface rounded-2xl p-8 border border-border text-center">
          <span className="material-symbols-outlined text-4xl text-text-muted mb-3">lock</span>
          <h3 className="font-sans font-semibold text-text text-lg">Sign in to view projects</h3>
          <p className="font-sans text-text-muted mt-1">Secure, encrypted access to your diagnostic history.</p>
        </div>
      ) : diagnoses.length === 0 ? (
        <div className="shadow-neu-pressed bg-surface rounded-2xl p-12 border border-border text-center">
          <span className="material-symbols-outlined text-4xl text-text-muted mb-3">history_toggle_off</span>
          <h3 className="font-sans font-semibold text-text text-lg">No active projects</h3>
          <p className="font-sans text-text-muted mt-1">Start a new diagnosis to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {diagnoses.map((diag) => (
            <div key={diag.id} className="shadow-neu-raised bg-surface rounded-2xl p-6 border border-border flex flex-col justify-between group">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-container text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">memory</span>
                  </div>
                  <span className="font-mono text-xs font-medium text-text-muted bg-surface-sunken px-2 py-1 rounded">
                    {diag.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-sans font-semibold text-text text-lg mb-2 line-clamp-1">
                  {diag.context || "Circuit Analysis"}
                </h3>
                <p className="font-sans text-sm text-text-muted line-clamp-2 mb-4">
                  {diag.result.issue_summary || "Diagnosis pending or incomplete."}
                </p>
              </div>
              <button 
                onClick={() => onViewReport(diag.result)}
                className="w-full py-2.5 rounded-lg bg-surface-sunken text-primary font-sans font-semibold shadow-neu-pressed hover:bg-surface-dim transition-colors flex items-center justify-center gap-2 group-hover:text-primary-hover"
              >
                View Full Report
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

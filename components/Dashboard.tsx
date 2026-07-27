"use client";

import { useEffect, useState } from "react";
import { PRESETS, PresetConfig } from "@/lib/presets";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { normalizeFirestoreDate } from "@/lib/date-utils";

interface DiagnosisSummary {
  id: string;
  createdAt: Date;
  context?: string;
  setup?: {
    board?: string;
    component?: string;
    powerSource?: string;
    problemCategory?: string;
  };
  result: {
    issue_summary: string;
    components_detected?: string[];
  };
}

export default function Dashboard({
  onViewChange,
  onViewReport
}: {
  onViewChange?: (view: string) => void;
  onViewReport?: (record: any) => void;
}) {
  const { user, signIn } = useAuth();
  const [recentDiagnoses, setRecentDiagnoses] = useState<DiagnosisSummary[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  useEffect(() => {
    if (!user) {
      setRecentDiagnoses([]);
      return;
    }

    setLoadingRecent(true);
    const q = query(
      collection(db, "users", user.uid, "diagnoses"),
      orderBy("createdAt", "desc"),
      limit(3)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => {
          const data = doc.data();
          const contextStr =
            data.context ||
            (data.setup?.board
              ? `${data.setup.board} - ${data.setup.component || "Circuit Analysis"}`
              : "Circuit Analysis");
          return {
            id: doc.id,
            ...data,
            createdAt: normalizeFirestoreDate(data.createdAt),
            context: contextStr,
            result: data.result || {},
          } as DiagnosisSummary;
        });
        setRecentDiagnoses(docs);
        setLoadingRecent(false);
      },
      (error) => {
        console.warn("Could not fetch recent session preview:", error);
        setLoadingRecent(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handlePresetClick = (preset: PresetConfig) => {
    document.dispatchEvent(
      new CustomEvent("open-diagnosis-with-preset", { detail: { preset } })
    );
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-10 pb-12 animate-in fade-in zoom-in duration-500">
      {!user && (
        <section className="p-8 rounded-3xl bg-surface border border-border shadow-neu-raised space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono text-xs uppercase tracking-wider">
              <span>Public Product Guide</span>
            </div>
            <h1 className="font-sans text-3xl font-bold text-text">MechaFix AI</h1>
            <p className="font-sans text-text-muted text-base leading-relaxed max-w-3xl">
              AI-powered troubleshooting for Arduino, robotics, sensors, motors, and low-voltage electronics.
              Upload a circuit photo, describe the problem, and receive grounded, safety-first troubleshooting one step at a time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-surface-sunken border border-border shadow-neu-pressed space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold font-sans text-sm">
                <span className="material-symbols-outlined text-lg">image_search</span>
                <span>Image-Aware Diagnosis</span>
              </div>
              <p className="text-xs text-text-muted font-sans leading-relaxed">
                Analyze circuit photos while clearly separating visible observations from unverified wiring assumptions.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-sunken border border-border shadow-neu-pressed space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold font-sans text-sm">
                <span className="material-symbols-outlined text-lg">library_books</span>
                <span>Grounded Guidance</span>
              </div>
              <p className="text-xs text-text-muted font-sans leading-relaxed">
                Retrieve relevant troubleshooting knowledge from 12 curated electronics manuals with qualitative relevance badges.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-sunken border border-border shadow-neu-pressed space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold font-sans text-sm">
                <span className="material-symbols-outlined text-lg">checklist</span>
                <span>Guided Troubleshooting</span>
              </div>
              <p className="text-xs text-text-muted font-sans leading-relaxed">
                Perform one safe test, log measurements, and receive step-by-step diagnostic progress without risk of high-voltage advice.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border">
            <button
              onClick={signIn}
              className="px-6 py-3 rounded-2xl bg-primary text-surface font-sans font-semibold text-sm shadow-neu-raised hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">login</span>
              <span>Sign in with Google</span>
            </button>
            <a
              href="https://github.com/abdulwahidchohan/MechaFix_AI"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-2xl bg-surface-sunken text-text font-sans font-medium text-sm border border-border shadow-neu-pressed hover:bg-surface transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">code</span>
              <span>View Public GitHub Repository</span>
            </a>
          </div>
        </section>
      )}

      <section className="space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-sunken text-primary border border-border shadow-neu-pressed w-max">
          <span className="material-symbols-outlined text-[16px]">image_search</span>
          <span className="font-sans text-xs font-semibold tracking-wide uppercase">Photo-aware troubleshooting</span>
        </div>
        <h2 className="font-sans text-3xl md:text-[40px] text-text max-w-2xl leading-tight font-bold">
          Let’s figure out what’s{" "}
          <span className="text-primary relative inline-block">
            not working.
            <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary opacity-30" preserveAspectRatio="none" viewBox="0 0 100 10">
              <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="4"></path>
            </svg>
          </span>
        </h2>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button 
          onClick={() => document.dispatchEvent(new CustomEvent("open-diagnosis"))}
          className="md:col-span-2 group relative h-44 rounded-[24px] bg-surface text-left overflow-hidden shadow-neu-raised hover:shadow-neu-raised-hover transition-all flex p-7 border border-border cursor-pointer"
        >
          <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-5 transition-opacity"></div>
          <div className="relative z-10 flex flex-col h-full justify-between w-full">
            <div className="w-12 h-12 rounded-2xl bg-primary text-surface flex items-center justify-center shadow-neu-raised group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl">add_a_photo</span>
            </div>
            <div>
              <h3 className="font-sans font-semibold text-text text-xl mb-1">New diagnosis</h3>
              <p className="font-sans text-text-muted text-sm">Upload a photo or describe your board setup</p>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity group-hover:translate-x-2 group-hover:-translate-y-2 text-text">
            <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>camera</span>
          </div>
        </button>
        
        <button 
          onClick={() => onViewChange?.("active-projects")}
          className="h-44 rounded-[24px] bg-surface p-6 text-left border border-border hover:border-primary/50 shadow-neu-raised hover:shadow-neu-raised-hover transition-all flex flex-col justify-between group cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-surface-sunken text-primary flex items-center justify-center shadow-neu-pressed">
              <span className="material-symbols-outlined">play_arrow</span>
            </div>
            <span className="px-2 py-1 bg-surface-sunken text-text-muted font-mono text-[11px] font-medium rounded uppercase tracking-wider">In Progress</span>
          </div>
          <div>
            <h3 className="font-sans font-semibold text-text mb-1 flex items-center gap-1 group-hover:text-primary transition-colors">
              Continue session
              <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">arrow_forward</span>
            </h3>
            <div className="font-mono font-medium text-text-muted text-xs truncate">
              View active diagnostic projects
            </div>
          </div>
        </button>
      </section>

      {/* Recent Sessions Preview Section for Logged-In Users */}
      {user && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">history</span>
              <h3 className="font-sans text-text text-lg font-semibold">Recent Active Sessions</h3>
            </div>
            <button
              onClick={() => onViewChange?.("active-projects")}
              className="text-primary font-sans text-xs font-semibold hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          {loadingRecent ? (
            <div className="p-6 rounded-2xl bg-surface border border-border shadow-neu-pressed flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : recentDiagnoses.length === 0 ? (
            <div className="p-6 rounded-2xl bg-surface border border-border shadow-neu-pressed text-center text-text-muted text-xs font-sans">
              No recent sessions found. Click <strong>New Diagnosis</strong> to start troubleshooting!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentDiagnoses.map((diag) => (
                <div
                  key={diag.id}
                  onClick={() => onViewReport?.(diag)}
                  className="p-4 rounded-2xl bg-surface border border-border shadow-neu-raised hover:shadow-neu-raised-hover hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
                      <span className="truncate font-medium">{diag.setup?.board || "Board"}</span>
                      <span>{diag.createdAt ? diag.createdAt.toLocaleDateString() : "Recent"}</span>
                    </div>
                    <h4 className="font-sans font-semibold text-sm text-text line-clamp-1 group-hover:text-primary transition-colors">
                      {diag.context || "Hardware Diagnosis"}
                    </h4>
                    <p className="font-sans text-xs text-text-muted line-clamp-2">
                      {diag.result?.issue_summary || "Session active"}
                    </p>
                  </div>
                  <div className="pt-3 flex items-center gap-1 text-primary text-xs font-semibold font-sans">
                    <span>Resume</span>
                    <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-4">
        <h3 className="font-sans text-text text-lg font-semibold">Start with a common issue</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {PRESETS.map((preset) => (
            <button 
              key={preset.id} 
              onClick={() => handlePresetClick(preset)}
              className="p-4 rounded-2xl bg-surface border border-border shadow-neu-raised hover:shadow-neu-raised-hover hover:-translate-y-1 transition-all flex flex-col gap-3 group text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-surface shadow-neu-pressed flex items-center justify-center text-text-muted group-hover:text-primary border border-border transition-colors">
                <span className="material-symbols-outlined text-[20px]">{preset.icon}</span>
              </div>
              <span className="font-sans font-medium text-sm text-text-muted group-hover:text-text transition-colors">{preset.label}</span>
            </button>
          ))}
          <button 
            onClick={() => document.dispatchEvent(new CustomEvent("open-diagnosis"))}
            className="p-4 rounded-2xl bg-surface-sunken border border-border border-dashed hover:bg-surface hover:border-primary/50 transition-all flex flex-col gap-3 group text-left items-center justify-center text-center cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-muted group-hover:text-primary shadow-sm border border-border transition-colors">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <span className="font-sans font-medium text-sm text-text-muted group-hover:text-primary transition-colors">Something else</span>
          </button>
        </div>
      </section>
    </div>
  );
}

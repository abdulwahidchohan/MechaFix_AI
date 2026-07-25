"use client";

import React from "react";
import { Hypothesis } from "@/lib/types";
import { AlertCircle, CheckCircle2, XCircle, HelpCircle, TrendingUp, ShieldAlert } from "lucide-react";

interface HypothesisSummaryProps {
  hypotheses: Hypothesis[];
}

export function HypothesisSummary({ hypotheses }: HypothesisSummaryProps) {
  if (!hypotheses || hypotheses.length === 0) return null;

  const getQualitativeState = (hyp: Hypothesis, index: number) => {
    if (hyp.state === "confirmed") {
      return {
        label: "Confirmed Cause",
        badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
      };
    }
    if (hyp.state === "ruled_out") {
      return {
        label: "Ruled Out",
        badgeClass: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
        icon: <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
      };
    }

    // Active suspected hypothesis
    if (index === 0) {
      return {
        label: "Leading Hypothesis",
        badgeClass: "bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-800 font-bold",
        icon: <TrendingUp className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />,
      };
    }
    if (hyp.evidenceFor.length >= 2) {
      return {
        label: "Strongly Supported",
        badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800",
        icon: <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />,
      };
    }
    if (hyp.evidenceAgainst.length > hyp.evidenceFor.length) {
      return {
        label: "Weakly Supported",
        badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-800",
        icon: <ShieldAlert className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />,
      };
    }
    return {
      label: "Under Investigation",
      badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700",
      icon: <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />,
    };
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-sky-500" />
          Active Diagnostic Hypotheses
        </h4>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Evaluated by evidence & physical test findings
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {hypotheses.map((hyp, index) => {
          const qual = getQualitativeState(hyp, index);
          return (
            <div
              key={hyp.id}
              className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                hyp.state === "confirmed"
                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/60"
                  : hyp.state === "ruled_out"
                  ? "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60"
                  : index === 0
                  ? "bg-sky-50/40 dark:bg-sky-950/20 border-sky-300 dark:border-sky-900/60 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  {hyp.title}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${qual.badgeClass}`}>
                  {qual.icon} {qual.label}
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {hyp.explanation}
              </p>

              {(hyp.evidenceFor.length > 0 || hyp.evidenceAgainst.length > 0) && (
                <div className="flex flex-col sm:flex-row gap-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                  {hyp.evidenceFor.length > 0 && (
                    <div className="text-emerald-700 dark:text-emerald-400 flex-1">
                      <span className="font-semibold">Supporting Evidence:</span>{" "}
                      {hyp.evidenceFor.join("; ")}
                    </div>
                  )}
                  {hyp.evidenceAgainst.length > 0 && (
                    <div className="text-rose-600 dark:text-rose-400 flex-1">
                      <span className="font-semibold">Evidence Against:</span>{" "}
                      {hyp.evidenceAgainst.join("; ")}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


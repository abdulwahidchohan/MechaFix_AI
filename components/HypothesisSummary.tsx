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
        badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
      };
    }
    if (hyp.state === "ruled_out") {
      return {
        label: "Ruled Out",
        badgeClass: "bg-surface-sunken text-text-muted border-border",
        icon: <XCircle className="w-3.5 h-3.5 text-text-muted shrink-0" />,
      };
    }

    // Active suspected hypothesis
    if (index === 0) {
      return {
        label: "Leading Hypothesis",
        badgeClass: "bg-primary-container text-primary border-primary/30 font-bold",
        icon: <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" />,
      };
    }
    if (hyp.evidenceFor.length >= 2) {
      return {
        label: "Strongly Supported",
        badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        icon: <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
      };
    }
    if (hyp.evidenceAgainst.length > hyp.evidenceFor.length) {
      return {
        label: "Weakly Supported",
        badgeClass: "bg-orange-500/10 text-orange-600 border-orange-500/20",
        icon: <ShieldAlert className="w-3.5 h-3.5 text-orange-600 shrink-0" />,
      };
    }
    return {
      label: "Under Investigation",
      badgeClass: "bg-surface-sunken text-text border-border",
      icon: <HelpCircle className="w-3.5 h-3.5 text-text-muted shrink-0" />,
    };
  };

  return (
    <div className="bg-surface border border-border shadow-neu-raised rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h4 className="text-sm font-bold text-text flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-primary" />
          Active Diagnostic Hypotheses
        </h4>
        <span className="text-xs text-text-muted">
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
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : hyp.state === "ruled_out"
                  ? "bg-surface-sunken border-border opacity-60"
                  : index === 0
                  ? "bg-primary-container/20 border-primary/30 shadow-sm"
                  : "bg-surface-sunken border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-text text-sm">
                  {hyp.title}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${qual.badgeClass}`}>
                  {qual.icon} {qual.label}
                </span>
              </div>

              <p className="text-text-muted leading-relaxed">
                {hyp.explanation}
              </p>

              {(hyp.evidenceFor.length > 0 || hyp.evidenceAgainst.length > 0) && (
                <div className="flex flex-col sm:flex-row gap-2 pt-1.5 border-t border-border text-[11px]">
                  {hyp.evidenceFor.length > 0 && (
                    <div className="text-emerald-600 dark:text-emerald-400 flex-1">
                      <span className="font-semibold">Supporting Evidence:</span>{" "}
                      {hyp.evidenceFor.join("; ")}
                    </div>
                  )}
                  {hyp.evidenceAgainst.length > 0 && (
                    <div className="text-red-600 dark:text-red-400 flex-1">
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

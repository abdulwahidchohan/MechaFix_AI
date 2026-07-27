"use client";

import React from "react";
import { DiagnosticStep, StepResult } from "@/lib/types";
import { Clock, Check, Activity } from "lucide-react";

interface DiagnosticProgressTimelineProps {
  progress: Array<{
    step: DiagnosticStep;
    result: StepResult;
  }>;
}

export function DiagnosticProgressTimeline({ progress }: DiagnosticProgressTimelineProps) {
  if (!progress || progress.length === 0) return null;

  return (
    <div className="bg-surface border border-border shadow-neu-raised rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h4 className="text-sm font-bold text-text flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Diagnostic Test History ({progress.length} Steps Completed)
        </h4>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {progress.map((item, idx) => (
          <div key={item.result.id || idx} className="relative group">
            {/* Timeline bullet */}
            <span className="absolute -left-[23px] top-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
              <Check className="w-3 h-3" />
            </span>

            <div className="bg-surface-sunken border border-border rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-text">
                  Step {item.step.sequence}: {item.step.title}
                </span>
                <span className="text-[11px] text-text-muted font-mono">
                  {new Date(item.result.submittedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p className="text-text-muted">{item.step.instruction}</p>

              <div className="p-2.5 bg-surface rounded-lg border border-border flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted font-medium">User Outcome:</span>
                  <span className="font-semibold text-primary bg-primary-container px-2 py-0.5 rounded text-[11px]">
                    {item.result.selectedOption}
                  </span>
                </div>

                {item.result.observation && (
                  <div className="text-text-muted italic">
                    &quot;{item.result.observation}&quot;
                  </div>
                )}

                {item.result.measurementValues && item.result.measurementValues.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Logged Reading: {item.result.measurementValues.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

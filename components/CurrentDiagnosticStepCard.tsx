"use client";

import React, { useState } from "react";
import { DiagnosticStep } from "@/lib/types";
import { ShieldAlert, Zap, CheckCircle2, AlertCircle, ArrowRight, Activity } from "lucide-react";

interface CurrentDiagnosticStepCardProps {
  step: DiagnosticStep;
  onSubmitResult: (data: {
    stepId: string;
    resultType: "passed" | "failed" | "not_sure" | "could_not_perform" | "measurement";
    selectedOption: string;
    observation?: string;
    measurementValues?: string[];
  }) => Promise<void>;
  isLoading?: boolean;
}

function getDefaultUnit(step: DiagnosticStep): string {
  if (step.suggestedUnit) return step.suggestedUnit;
  if (step.requestedMeasurementType) {
    const typeLower = step.requestedMeasurementType.toLowerCase();
    if (typeLower.includes("volt")) return "V";
    if (typeLower.includes("resist")) return "Ω";
    if (typeLower.includes("curr")) return "mA";
    if (typeLower.includes("freq")) return "Hz";
  }
  return "V";
}

export function CurrentDiagnosticStepCard({
  step,
  onSubmitResult,
  isLoading = false,
}: CurrentDiagnosticStepCardProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [observation, setObservation] = useState<string>("");
  const [measurementVal, setMeasurementVal] = useState<string>("");
  const [measurementUnit, setMeasurementUnit] = useState<string>(() => getDefaultUnit(step));

  // Reset local state when step changes
  const [prevStepId, setPrevStepId] = useState(step.id);
  if (step.id !== prevStepId) {
    setPrevStepId(step.id);
    setSelectedOption("");
    setObservation("");
    setMeasurementVal("");
    setMeasurementUnit(getDefaultUnit(step));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) return;

    let resultType: "passed" | "failed" | "not_sure" | "could_not_perform" | "measurement" = "passed";
    if (selectedOption.toLowerCase().includes("failed") || selectedOption.toLowerCase().includes("short") || selectedOption.toLowerCase().includes("no")) {
      resultType = "failed";
    } else if (selectedOption.toLowerCase().includes("not sure")) {
      resultType = "not_sure";
    }

    if (step.requiresMeasurement && measurementVal) {
      resultType = "measurement";
    }

    await onSubmitResult({
      stepId: step.id,
      resultType,
      selectedOption,
      observation: observation.trim(),
      measurementValues: measurementVal ? [`${measurementVal} ${measurementUnit}`] : [],
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-sky-500/40 dark:border-sky-500/50 rounded-2xl p-6 shadow-lg shadow-sky-500/5 flex flex-col gap-5">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-sky-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
            {step.sequence}
          </span>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-sky-600 dark:text-sky-400">
              Active Diagnostic Step
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {step.title}
            </h3>
          </div>
        </div>

        {/* Safety Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 self-start sm:self-auto">
          {step.requiresPowerDisconnected ? (
            <>
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>DISCONNECT POWER FIRST</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>Power Measurement Test</span>
            </>
          )}
        </div>
      </div>

      {/* Instruction & Expected Result */}
      <div className="space-y-3">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
            {step.instruction}
          </p>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Reason:</span> {step.reason}
          </div>
        </div>

        {step.safetyNote && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs rounded-lg border border-red-200 dark:border-red-900/60">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{step.safetyNote}</span>
          </div>
        )}

        <div className="text-xs text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Expected Outcome:</span>{" "}
          {step.expectedResult}
        </div>
      </div>

      {/* Test Result Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Select Observed Test Result
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {step.resultOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSelectedOption(opt)}
                className={`p-3 text-xs font-medium rounded-xl border text-left transition-all flex items-center justify-between ${
                  selectedOption === opt
                    ? "border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <span>{opt}</span>
                {selectedOption === opt && <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Multimeter Measurement Input */}
        {step.requiresMeasurement && (
          <div className="p-3.5 bg-sky-50/50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              Multimeter Measurement (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 4.95"
                value={measurementVal}
                onChange={(e) => setMeasurementVal(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <select
                value={measurementUnit}
                onChange={(e) => setMeasurementUnit(e.target.value)}
                className="px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="V">Volts (V)</option>
                <option value="mA">Milliamps (mA)</option>
                <option value="Ω">Resistance (Ω)</option>
                <option value="Hz">Frequency (Hz)</option>
              </select>
            </div>
            {measurementUnit === "mA" && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-1">
                ⚠️ Current Safety: Connect meter in series with circuit load. Do not connect current probes directly across VCC and GND.
              </p>
            )}
          </div>
        )}

        {/* Observation text */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Additional Observations or Notes (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g., LED flickered once then turned off completely..."
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!selectedOption || isLoading}
          className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span>Evaluating Diagnostic Step Result...</span>
          ) : (
            <>
              <span>Submit Test Result & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

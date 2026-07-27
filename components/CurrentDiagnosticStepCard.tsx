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
    <div className="bg-surface border-2 border-primary/40 rounded-2xl p-6 shadow-neu-raised flex flex-col gap-5">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-primary text-surface font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
            {step.sequence}
          </span>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-primary">
              Active Diagnostic Step
            </div>
            <h3 className="text-lg font-bold text-text">
              {step.title}
            </h3>
          </div>
        </div>

        {/* Safety Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 self-start sm:self-auto">
          {step.requiresPowerDisconnected ? (
            <>
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>DISCONNECT POWER FIRST</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-primary shrink-0" />
              <span>Power Measurement Test</span>
            </>
          )}
        </div>
      </div>

      {/* Instruction & Expected Result */}
      <div className="space-y-3">
        <div className="p-4 bg-surface-sunken rounded-xl border border-border">
          <p className="text-sm text-text font-medium leading-relaxed">
            {step.instruction}
          </p>
          <div className="mt-2 text-xs text-text-muted flex items-center gap-1.5">
            <span className="font-semibold text-text">Reason:</span> {step.reason}
          </div>
        </div>

        {step.safetyNote && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 text-red-600 text-xs rounded-lg border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{step.safetyNote}</span>
          </div>
        )}

        <div className="text-xs text-text-muted">
          <span className="font-semibold text-text">Expected Outcome:</span>{" "}
          {step.expectedResult}
        </div>
      </div>

      {/* Test Result Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-semibold text-text uppercase tracking-wider mb-2">
            Select Observed Test Result
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {step.resultOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSelectedOption(opt)}
                className={`p-3 text-xs font-medium rounded-xl border text-left transition-all flex items-center justify-between min-h-[44px] cursor-pointer ${
                  selectedOption === opt
                    ? "border-primary bg-primary-container text-primary font-semibold shadow-neu-pressed"
                    : "border-border bg-surface-sunken text-text hover:bg-surface-dim"
                }`}
              >
                <span>{opt}</span>
                {selectedOption === opt && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Multimeter Measurement Input */}
        {step.requiresMeasurement && (
          <div className="p-3.5 bg-primary-container/20 border border-primary/20 rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-primary flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" />
              Multimeter Measurement (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 4.95"
                value={measurementVal}
                onChange={(e) => setMeasurementVal(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:border-primary"
              />
              <select
                value={measurementUnit}
                onChange={(e) => setMeasurementUnit(e.target.value)}
                className="px-2 py-1.5 text-xs rounded-lg border border-border bg-surface text-text focus:outline-none focus:border-primary"
              >
                <option value="V">Volts (V)</option>
                <option value="mA">Milliamps (mA)</option>
                <option value="Ω">Resistance (Ω)</option>
                <option value="Hz">Frequency (Hz)</option>
              </select>
            </div>
            {measurementUnit === "mA" && (
              <p className="text-[11px] text-amber-600 font-medium pt-1">
                ⚠️ Current Safety: Connect meter in series with circuit load. Do not connect current probes directly across VCC and GND.
              </p>
            )}
          </div>
        )}

        {/* Observation text */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">
            Additional Observations or Notes (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g., LED flickered once then turned off completely..."
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-surface text-text focus:outline-none focus:border-primary"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!selectedOption || isLoading}
          className="w-full py-3 px-4 bg-primary hover:bg-primary-hover disabled:opacity-50 text-surface font-semibold text-xs rounded-xl shadow-neu-raised transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
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

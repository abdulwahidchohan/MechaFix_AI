"use client";

import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import { Measurement } from "@/lib/types";

interface MeasurementDrawerProps {
  diagnosisId?: string;
  existingMeasurements?: Measurement[];
  isOpen: boolean;
  onClose: () => void;
  onMeasurementAdded: (measurement: Measurement) => void;
}

export default function MeasurementDrawer({
  diagnosisId,
  existingMeasurements = [],
  isOpen,
  onClose,
  onMeasurementAdded,
}: MeasurementDrawerProps) {
  const [type, setType] = useState<Measurement["type"]>("Voltage");
  const [location, setLocation] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("V");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Update unit default when type changes
  const handleTypeChange = (newType: Measurement["type"]) => {
    setType(newType);
    if (newType === "Voltage") setUnit("V");
    else if (newType === "Resistance") setUnit("Ω");
    else if (newType === "Current") setUnit("mA");
    else if (newType === "Signal/PWM") setUnit("Hz");
    else if (newType === "I2C/SPI Scan") setUnit("Hex Address");
    else if (newType === "Continuity/Short") setUnit("Status");
    else setUnit("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!location.trim()) {
      setErrorMessage("Please specify the test point or component location.");
      return;
    }
    if (!value.trim()) {
      setErrorMessage("Please enter the measured value.");
      return;
    }

    const uniqueId = crypto.randomUUID();
    const localMeas: Measurement = {
      id: uniqueId,
      type,
      location: location.trim(),
      value: value.trim(),
      unit: unit.trim(),
      notes: notes.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUserReported: true,
    };

    if (diagnosisId) {
      setIsSubmitting(true);
      try {
        let token = null;
        if (auth.currentUser) {
          token = await auth.currentUser.getIdToken();
        }

        const res = await fetch("/api/diagnoses/measurements", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            diagnosisId,
            measurement: localMeas,
          }),
        });

        const data = await res.json();
        if (data.success) {
          onMeasurementAdded(data.measurement || localMeas);
          resetForm();
          onClose();
        } else {
          setErrorMessage(data.error || "Failed to persist measurement.");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Network error submitting measurement.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      onMeasurementAdded(localMeas);
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setLocation("");
    setValue("");
    setNotes("");
    setErrorMessage("");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-text/40 backdrop-blur-sm z-[80] flex justify-end animate-in fade-in duration-200 print:hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={drawerRef}
        className="bg-surface w-full max-w-md h-full shadow-2xl border-l border-border flex flex-col justify-between p-6 overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-250"
        role="dialog"
        aria-modal="true"
        aria-labelledby="measurement-drawer-title"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">straighten</span>
              <div>
                <h3 id="measurement-drawer-title" className="font-sans font-bold text-lg text-text">
                  Log Test Measurement
                </h3>
                <p className="font-sans text-xs text-text-muted">
                  Record voltage, resistance, or probe findings
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text p-2 rounded-lg hover:bg-surface-sunken min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Close drawer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* User-Reported Disclosure Banner */}
          <div className="p-3 bg-primary-container/20 border border-primary/20 rounded-xl flex items-start gap-2 text-xs font-sans text-text">
            <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">verified_user</span>
            <div>
              <span className="font-bold text-primary block">User-Reported Measurement</span>
              All values entered here are explicitly labeled as user-reported and injected into follow-up AI diagnostic context.
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 text-xs font-sans font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {errorMessage}
            </div>
          )}

          <form id="measurement-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Measurement Type */}
            <div>
              <label className="block font-sans font-semibold text-xs text-text mb-1.5">
                Measurement Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["Voltage", "Resistance", "Current", "Signal/PWM", "I2C/SPI Scan", "Continuity/Short"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeChange(t)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all flex items-center gap-2 ${
                      type === t
                        ? "bg-primary text-surface border-primary font-semibold shadow-sm"
                        : "bg-surface-sunken border-border text-text hover:bg-border/30"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {t === "Voltage" ? "bolt" : t === "Resistance" ? "tune" : t === "Current" ? "electric_meter" : t === "Signal/PWM" ? "waves" : t === "I2C/SPI Scan" ? "developer_board" : "cable"}
                    </span>
                    <span>{t}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Test Location */}
            <div>
              <label className="block font-sans font-semibold text-xs text-text mb-1.5">
                Test Point / Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. VCC to GND on U1, Pin 3 on Arduino, R2 pad"
                className="w-full bg-surface-sunken border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary"
              />
            </div>

            {/* Value & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-sans font-semibold text-xs text-text mb-1.5">
                  Measured Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="e.g. 4.82, 10k, 0x27"
                  className="w-full bg-surface-sunken border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-sans font-semibold text-xs text-text mb-1.5">
                  Unit
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="V, mV, Ω, mA, Hz..."
                  className="w-full bg-surface-sunken border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-text focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block font-sans font-semibold text-xs text-text mb-1.5">
                Notes / Probe Conditions (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Measured while board powered by USB; voltage fluctuates slightly under load"
                className="w-full bg-surface-sunken border border-border rounded-xl p-3 text-xs text-text focus:outline-none focus:border-primary custom-scrollbar"
              />
            </div>
          </form>

          {/* Existing Measurements List */}
          {existingMeasurements.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="font-sans font-semibold text-xs uppercase tracking-wider text-text-muted block">
                Recorded Test Readings ({existingMeasurements.length})
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {existingMeasurements.map((meas) => (
                  <div
                    key={meas.id}
                    className="p-3 bg-surface-sunken border border-border rounded-xl flex items-start justify-between text-xs space-y-0.5"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-text">
                        <span className="font-mono text-primary bg-primary-container px-2 py-0.5 rounded text-[11px]">
                          {meas.value} {meas.unit}
                        </span>
                        <span>{meas.location}</span>
                      </div>
                      <div className="text-[11px] text-text-muted font-sans mt-1">
                        {meas.type} • {meas.timestamp}
                      </div>
                      {meas.notes && (
                        <p className="text-[11px] text-text-muted italic mt-0.5">{meas.notes}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded shrink-0 border border-emerald-500/20">
                      User-Reported
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-surface-sunken text-text font-sans font-semibold text-xs border border-border hover:bg-border/30 transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="measurement-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-primary text-surface font-sans font-semibold text-xs shadow-neu-raised hover:bg-primary-hover transition-all flex items-center gap-1.5 min-h-[44px]"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">add</span>
                Save Measurement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

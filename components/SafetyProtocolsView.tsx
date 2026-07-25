"use client";

export default function SafetyProtocolsView() {
  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-12 animate-in fade-in duration-500 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sans text-3xl font-bold text-text">Safety Protocols</h2>
          <p className="font-sans text-sm text-text-muted mt-1">Standard operating procedures for hardware diagnostics.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="shadow-neu-raised bg-surface rounded-2xl p-6 border border-border">
          <h3 className="font-sans font-semibold text-lg text-text flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-error">power_off</span>
            1. Power Disconnect
          </h3>
          <p className="font-sans text-text-muted leading-relaxed">
            Always disconnect the power supply completely before touching any components on the circuit board. Capacitors may retain charge even after power is removed. Wait at least 30 seconds after disconnection before handling.
          </p>
        </div>

        <div className="shadow-neu-raised bg-surface rounded-2xl p-6 border border-border">
          <h3 className="font-sans font-semibold text-lg text-text flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">touch_app</span>
            2. ESD Prevention
          </h3>
          <p className="font-sans text-text-muted leading-relaxed">
            Electrostatic discharge (ESD) can destroy microcontrollers. Always wear a grounded anti-static wrist strap, or touch a grounded metal object before handling sensitive components like the ESP32 or Arduino.
          </p>
        </div>

        <div className="shadow-neu-raised bg-surface rounded-2xl p-6 border border-border">
          <h3 className="font-sans font-semibold text-lg text-text flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">visibility</span>
            3. Visual Inspection
          </h3>
          <p className="font-sans text-text-muted leading-relaxed">
            Before powering a newly assembled circuit, inspect it carefully. Check for solder bridges, reversed polarities (especially on electrolytic capacitors and ICs), and loose wire strands that could cause shorts.
          </p>
        </div>
      </div>
    </div>
  );
}

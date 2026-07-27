"use client";

import React, { useState, useEffect } from "react";
import { VERIFIED_PINOUTS, PinoutRecord } from "@/lib/pinouts/pinoutData";
import { Search, X, ShieldAlert, ExternalLink, Cpu, Zap, Copy, Check } from "lucide-react";

interface PinoutViewerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultComponent?: string;
}

export function PinoutViewerModal({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  defaultComponent,
}: PinoutViewerModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>(defaultComponent || "");
  const [selectedPinout, setSelectedPinout] = useState<PinoutRecord>(VERIFIED_PINOUTS[0]);
  const [copied, setCopied] = useState(false);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const handleClose = externalOnClose || (() => setInternalIsOpen(false));

  useEffect(() => {
    const handleOpenEvent = (e: any) => {
      setInternalIsOpen(true);
      if (e.detail?.pinoutId) {
        const found = VERIFIED_PINOUTS.find((p) => p.id === e.detail.pinoutId);
        if (found) setSelectedPinout(found);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "p" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setInternalIsOpen((prev) => !prev);
      }
    };

    document.addEventListener("open-pinout-viewer", handleOpenEvent);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("open-pinout-viewer", handleOpenEvent);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!isOpen) return null;

  const filtered = VERIFIED_PINOUTS.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopySpecs = () => {
    const specText = `${selectedPinout.name} Pinout Specifications:\n` +
      `Category: ${selectedPinout.category}\n` +
      `Operating Voltage: ${selectedPinout.operatingVoltage}\n` +
      `Logic Voltage: ${selectedPinout.logicVoltage}\n` +
      `Official Datasheet: ${selectedPinout.officialSourceUrl}\n\n` +
      `Pins:\n` +
      selectedPinout.pins.map((p) => `- ${p.pinName} [${p.type}]: ${p.description}`).join("\n");

    navigator.clipboard.writeText(specText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    document.dispatchEvent(
      new CustomEvent("show-toast", {
        detail: {
          type: "success",
          title: "Pinout Specs Copied!",
          message: `${selectedPinout.name} specifications copied to clipboard.`,
        },
      })
    );
  };

  const getPinBadgeStyle = (type: string) => {
    switch (type) {
      case "Power":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20";
      case "GND":
        return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20";
      case "Digital":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20";
      case "PWM":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "Communication":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20";
      case "Analog":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      default:
        return "bg-surface-sunken text-text-muted border border-border";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-sunken">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            <h3 className="font-sans text-base font-bold text-text">
              Verified Hardware Pinout & Voltage Reference
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-text-muted hover:text-text rounded-xl hover:bg-surface transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Sidebar Search List */}
          <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[260px] md:max-h-none custom-scrollbar">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search board or component..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary font-sans"
              />
            </div>

            <div className="space-y-1.5">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedPinout(item)}
                  className={`w-full text-left p-3 rounded-2xl text-xs transition-all flex flex-col gap-0.5 cursor-pointer ${
                    selectedPinout.id === item.id
                      ? "bg-primary text-surface font-semibold shadow-neu-raised"
                      : "hover:bg-surface-sunken text-text border border-transparent"
                  }`}
                >
                  <span className="font-bold font-sans">{item.name}</span>
                  <span className={`text-[10px] capitalize opacity-90 font-mono ${selectedPinout.id === item.id ? "text-surface/80" : "text-text-muted"}`}>
                    {item.category} • {item.logicVoltage}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed View */}
          <div className="col-span-2 p-5 overflow-y-auto space-y-4 custom-scrollbar">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h4 className="text-lg font-bold text-text font-sans">
                  {selectedPinout.name}
                </h4>
                <p className="text-xs text-text-muted font-sans mt-0.5">
                  {selectedPinout.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopySpecs}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-surface-sunken text-text border border-border hover:bg-surface transition-colors cursor-pointer"
                  title="Copy Specs & Pin Table to Clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
                  <span>{copied ? "Copied" : "Copy Specs"}</span>
                </button>

                <a
                  href={selectedPinout.officialSourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-primary hover:underline shrink-0"
                >
                  <span>Datasheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Spec Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-sans">
              <div className="p-3 bg-surface-sunken rounded-2xl border border-border text-xs shadow-neu-pressed">
                <span className="block text-[10px] text-text-muted font-semibold uppercase">Operating Voltage</span>
                <span className="font-bold text-text font-mono mt-0.5 block">{selectedPinout.operatingVoltage}</span>
              </div>
              <div className="p-3 bg-surface-sunken rounded-2xl border border-border text-xs shadow-neu-pressed">
                <span className="block text-[10px] text-text-muted font-semibold uppercase">Logic Voltage</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5 block">{selectedPinout.logicVoltage}</span>
              </div>
              {selectedPinout.maxCurrentPerPin && (
                <div className="p-3 bg-surface-sunken rounded-2xl border border-border text-xs col-span-2 sm:col-span-1 shadow-neu-pressed">
                  <span className="block text-[10px] text-text-muted font-semibold uppercase">Max Current Limit</span>
                  <span className="font-bold text-text font-mono mt-0.5 block">{selectedPinout.maxCurrentPerPin}</span>
                </div>
              )}
            </div>

            {/* Safety Warnings */}
            {selectedPinout.safetyWarnings.length > 0 && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1.5 text-xs text-amber-900 dark:text-amber-200 font-sans">
                <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="w-4 h-4 text-amber-600" /> Electrical Safety Notices
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800/90 dark:text-amber-300/90">
                  {selectedPinout.safetyWarnings.map((warn, idx) => (
                    <li key={idx}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pin Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-text flex items-center gap-1 font-sans">
                  <Zap className="w-3.5 h-3.5 text-primary" /> Pin Header Assignment Table
                </h5>
                <span className="text-[10px] font-mono text-text-muted">Total: {selectedPinout.pins.length} Pins</span>
              </div>

              <div className="border border-border rounded-2xl overflow-hidden font-sans">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-sunken text-text-muted border-b border-border">
                      <th className="p-2.5 font-bold">Pin</th>
                      <th className="p-2.5 font-bold">Type</th>
                      <th className="p-2.5 font-bold">Function / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedPinout.pins.map((pin, idx) => (
                      <tr key={idx} className="hover:bg-surface-sunken/60 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-primary whitespace-nowrap">
                          {pin.pinName}
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 text-[10px] font-semibold font-mono rounded ${getPinBadgeStyle(pin.type)}`}>
                            {pin.type}
                          </span>
                        </td>
                        <td className="p-2.5 text-text">
                          {pin.description} {pin.voltageRating && <span className="font-mono text-text-muted text-[11px]">({pin.voltageRating})</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

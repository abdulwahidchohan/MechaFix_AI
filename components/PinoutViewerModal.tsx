"use client";

import React, { useState } from "react";
import { VERIFIED_PINOUTS, PinoutRecord } from "@/lib/pinouts/pinoutData";
import { Search, X, ShieldAlert, ExternalLink, Cpu, Zap, Info } from "lucide-react";

interface PinoutViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultComponent?: string;
}

export function PinoutViewerModal({
  isOpen,
  onClose,
  defaultComponent,
}: PinoutViewerModalProps) {
  const [searchTerm, setSearchTerm] = useState<string>(defaultComponent || "");
  const [selectedPinout, setSelectedPinout] = useState<PinoutRecord>(VERIFIED_PINOUTS[0]);

  if (!isOpen) return null;

  const filtered = VERIFIED_PINOUTS.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Verified Hardware Pinout & Voltage Reference
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
          {/* Sidebar Search List */}
          <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[300px] md:max-h-none">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search board or component..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedPinout(item)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex flex-col gap-0.5 ${
                    selectedPinout.id === item.id
                      ? "bg-sky-500 text-white font-semibold shadow-sm"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className="font-bold">{item.name}</span>
                  <span className={`text-[10px] capitalize opacity-80 ${selectedPinout.id === item.id ? "text-sky-100" : "text-slate-400"}`}>
                    {item.category} • {item.logicVoltage}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed View */}
          <div className="col-span-2 p-5 overflow-y-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {selectedPinout.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedPinout.description}
                </p>
              </div>

              <a
                href={selectedPinout.officialSourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline shrink-0"
              >
                <span>Official Datasheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Spec Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="block text-[10px] text-slate-400 font-semibold uppercase">Operating Voltage</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPinout.operatingVoltage}</span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="block text-[10px] text-slate-400 font-semibold uppercase">Logic Voltage</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{selectedPinout.logicVoltage}</span>
              </div>
              {selectedPinout.maxCurrentPerPin && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs col-span-2 sm:col-span-1">
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase">Max Current Limit</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPinout.maxCurrentPerPin}</span>
                </div>
              )}
            </div>

            {/* Safety Warnings */}
            {selectedPinout.safetyWarnings.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-1 text-xs text-amber-900 dark:text-amber-200">
                <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="w-4 h-4 text-amber-600" /> Electrical Safety Notices
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800/90 dark:text-amber-300/90">
                  {selectedPinout.safetyWarnings.map((warn, idx) => (
                    <li key={idx}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pin Table */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-sky-500" /> Pin Header Assignment Table
              </h5>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-2 font-bold">Pin</th>
                      <th className="p-2 font-bold">Type</th>
                      <th className="p-2 font-bold">Function / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {selectedPinout.pins.map((pin, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-2 font-mono font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">
                          {pin.pinName}
                        </td>
                        <td className="p-2">
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {pin.type}
                          </span>
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-300">
                          {pin.description} {pin.voltageRating && `(${pin.voltageRating})`}
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

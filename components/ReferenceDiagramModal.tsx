"use client";

import React, { useState } from "react";
import { GeneratedReference } from "@/lib/types";
import { Image as ImageIcon, Sparkles, AlertTriangle, Download, X } from "lucide-react";

interface ReferenceDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnosisId: string;
  board: string;
  component: string;
  existingReferences?: GeneratedReference[];
  onReferenceGenerated?: (ref: GeneratedReference) => void;
  getAuthToken: () => Promise<string | null>;
  isDisabledByConfig?: boolean;
}

export function ReferenceDiagramModal({
  isOpen,
  onClose,
  diagnosisId,
  board,
  component,
  existingReferences = [],
  onReferenceGenerated,
  getAuthToken,
  isDisabledByConfig = false,
}: ReferenceDiagramModalProps) {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedRef, setSelectedRef] = useState<GeneratedReference | null>(
    existingReferences.length > 0 ? existingReferences[existingReferences.length - 1] : null
  );

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (isDisabledByConfig) {
      setErrorMsg("AI-generated reference diagrams require an image-generation-enabled deployment. Photo analysis and annotated overlays remain available.");
      return;
    }
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("User authentication token not available.");
      }

      const res = await fetch("/api/gemini/generate-reference-diagram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          diagnosisId,
          board,
          component,
          diagramTitle: `Reference Diagram: ${board} + ${component}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate reference diagram.");
      }

      const newRef: GeneratedReference = data.reference;
      setSelectedRef(newRef);
      if (onReferenceGenerated) {
        onReferenceGenerated(newRef);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Error generating diagram.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-text/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-3xl w-full p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-text">
              AI-Generated Educational Reference Diagram
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-surface-sunken transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-700 dark:text-red-300 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Display Active Selected Diagram */}
        {selectedRef ? (
          <div className="space-y-3">
            <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-2 min-h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedRef.imageUrl}
                alt={selectedRef.title}
                className="max-h-[420px] object-contain rounded"
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {selectedRef.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {selectedRef.description}
              </p>

              {/* Disclaimer */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block">Educational Visual Disclaimer:</strong>
                  <span>{selectedRef.disclaimer}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
            <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <div className="max-w-md">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isDisabledByConfig ? "Reference Diagrams Feature Disabled" : "No Reference Diagram Generated Yet"}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {isDisabledByConfig
                  ? "AI-generated reference diagrams require an image-generation-enabled deployment. Photo analysis and annotated overlays remain available."
                  : `Click below to generate a synthetic educational reference schematic illustrating how to wire ${component} to ${board}.`}
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[44px] flex items-center justify-center"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || isDisabledByConfig}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 min-h-[44px]"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? "Generating Reference Diagram..." : "Generate Reference Diagram"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

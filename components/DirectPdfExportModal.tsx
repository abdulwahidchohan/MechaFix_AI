"use client";

import React, { useState } from "react";
import { DiagnosisRecord } from "@/lib/types";
import { FileText, Download, X, Check, ShieldAlert } from "lucide-react";
import { jsPDF } from "jspdf";

interface DirectPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: DiagnosisRecord;
}

export function DirectPdfExportModal({
  isOpen,
  onClose,
  record,
}: DirectPdfExportModalProps) {
  const [includeImages, setIncludeImages] = useState<boolean>(true);
  const [includeHistory, setIncludeHistory] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  const generatePDF = () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      let y = 15;

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 28, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("MechaFix AI — Hardware Diagnostic Report", 14, 14);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Report ID: ${record.id || "N/A"}  |  Generated: ${new Date().toLocaleDateString()}`, 14, 21);

      y = 36;

      // Hardware Target Overview
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 28, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, y, 182, 28, "S");

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("HARDWARE TARGET SPECIFICATIONS", 18, y + 7);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Board: ${record.setup.board}`, 18, y + 14);
      doc.text(`Component: ${record.setup.component}`, 95, y + 14);
      doc.text(`Power Source: ${record.setup.powerSource}`, 18, y + 21);
      doc.text(`Problem Category: ${record.setup.problemCategory}`, 95, y + 21);

      y += 34;

      // Issue Summary & Safety
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("DIAGNOSTIC EXECUTIVE SUMMARY", 14, y);

      y += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const summaryLines = doc.splitTextToSize(record.result.issue_summary, 182);
      doc.text(summaryLines, 14, y);
      y += summaryLines.length * 5 + 4;

      // Safety Level
      const safetyLevel = record.result.safetyLevel || "SAFE";
      doc.setFont("helvetica", "bold");
      doc.text(`Assessed Safety Risk Level: ${safetyLevel}`, 14, y);
      y += 8;

      // Hypotheses Breakdown
      if (record.activeHypotheses && record.activeHypotheses.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("DIAGNOSTIC HYPOTHESES REASSESSMENT", 14, y);
        y += 6;

        record.activeHypotheses.forEach((hyp, idx) => {
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text(`${idx + 1}. ${hyp.title} [Status: ${hyp.state.toUpperCase()}]`, 14, y);
          y += 4;
          doc.setFont("helvetica", "normal");
          const explLines = doc.splitTextToSize(hyp.explanation, 178);
          doc.text(explLines, 18, y);
          y += explLines.length * 4.5 + 3;
        });
      }

      // Diagnostic Step History
      if (includeHistory && record.diagnosticProgress && record.diagnosticProgress.length > 0) {
        y += 4;
        if (y > 240) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("COMPLETED DIAGNOSTIC TEST STEPS", 14, y);
        y += 6;

        record.diagnosticProgress.forEach((item, idx) => {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }

          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text(`Step ${item.step.sequence}: ${item.step.title}`, 14, y);
          y += 4.5;

          doc.setFont("helvetica", "normal");
          doc.text(`Outcome Selected: ${item.result.selectedOption}`, 18, y);
          y += 4.5;

          if (item.result.observation) {
            doc.text(`User Observation: "${item.result.observation}"`, 18, y);
            y += 4.5;
          }
          y += 2;
        });
      }

      // Resolution if present
      if (record.resolution?.rootCause) {
        y += 4;
        if (y > 240) {
          doc.addPage();
          y = 20;
        }

        doc.setFillColor(236, 253, 245); // emerald-50
        doc.rect(14, y, 182, 22, "F");
        doc.setDrawColor(16, 185, 129);
        doc.rect(14, y, 182, 22, "S");

        doc.setTextColor(6, 78, 59);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("FINAL RESOLUTION DETAILS", 18, y + 6);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Root Cause: ${record.resolution.rootCause}`, 18, y + 12);
        doc.text(`Action Taken: ${record.resolution.actionTaken || "Verified and corrected"}`, 18, y + 17);

        y += 28;
      }

      // Footer disclaimer
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Notice: This diagnostic report is generated by MechaFix AI for informational and engineering reference purposes.", 14, 285);

      doc.save(`MechaFix-Report-${record.setup.board}-${record.id || "session"}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGenerating(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Export Diagnostic PDF Report
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <p>
            Generate a clean, professional PDF technical report for session{" "}
            <strong className="font-mono text-sky-600 dark:text-sky-400">{record.id || "Current"}</strong>.
          </p>

          <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeHistory}
                onChange={(e) => setIncludeHistory(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Include full diagnostic test step timeline history</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeImages}
                onChange={(e) => setIncludeImages(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Include evidence metadata and detected component lists</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={generatePDF}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? "Generating PDF..." : "Download PDF Report"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

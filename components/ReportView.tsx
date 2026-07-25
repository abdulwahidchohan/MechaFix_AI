"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { Measurement } from "@/lib/types";
import ResolveDiagnosisModal from "@/components/ResolveDiagnosisModal";
import ImageQualityModal from "@/components/ImageQualityModal";
import MeasurementDrawer from "@/components/MeasurementDrawer";

interface AnalysisResult {
  diagnosisId?: string;
  id?: string;
  board?: string;
  component?: string;
  issue_summary: string;
  components_detected: string[];
  potential_causes: string[];
  troubleshooting_steps: string[];
  imageUsable?: boolean;
  imageLimitations?: string[];
  followUpHistory?: Array<{ userMessage: string; assistantReply: string }>;
  data?: AnalysisResult;
}

export default function ReportView({
  result: rawResult,
  reset,
}: {
  result: any;
  reset: () => void;
}) {
  const result: AnalysisResult = rawResult?.data || rawResult || {};
  const diagnosisId = rawResult?.id || result?.diagnosisId;

  const [status, setStatus] = useState<string>(rawResult?.status || "in_progress");
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [rootCause, setRootCause] = useState(rawResult?.resolution?.rootCause || "");
  const [actionTaken, setActionTaken] = useState(rawResult?.resolution?.actionTaken || "");
  const [finalNote, setFinalNote] = useState(rawResult?.resolution?.finalNote || "");

  // Priority 2 & 3 States
  const [showImageQualityModal, setShowImageQualityModal] = useState(false);
  const [showMeasurementDrawer, setShowMeasurementDrawer] = useState(false);
  const [measurements, setMeasurements] = useState<Measurement[]>(
    rawResult?.measurements || rawResult?.record?.measurements || []
  );

  // Chat Follow-Up State
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "model"; text: string }>
  >([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!result || !result.issue_summary) return null;

  const hasImageWarning =
    result.imageUsable === false || (Array.isArray(result.imageLimitations) && result.imageLimitations.length > 0);

  const handleSendFollowUp = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const newHistory = [...chatMessages, { role: "user" as const, text: query }];
    setChatMessages(newHistory);
    setInputQuery("");
    setIsAsking(true);

    try {
      let token = null;
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }

      // Include user-reported measurements in follow-up context
      const contextWithMeasurements = {
        ...result,
        userReportedMeasurements: measurements.map((m) => `${m.type} at ${m.location}: ${m.value} ${m.unit} (${m.notes || 'No note'})`),
      };

      const res = await fetch("/api/gemini/follow-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          diagnosisId,
          userMessage: query,
          conversationHistory: chatMessages,
          contextData: contextWithMeasurements,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setChatMessages((prev) => [
          ...prev,
          { role: "model", text: data.reply },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: `⚠️ Assistance error: ${data.error}`,
          },
        ]);
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: `⚠️ Request failed: ${err.message}`,
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleAddMeasurement = (meas: Measurement) => {
    setMeasurements((prev) => [...prev, meas]);
  };

  const generateMarkdownReport = () => {
    const componentsList = Array.isArray(result.components_detected) && result.components_detected.length > 0
      ? result.components_detected.map((c) => `- ${c}`).join("\n")
      : "- None listed";

    const causesList = Array.isArray(result.potential_causes) && result.potential_causes.length > 0
      ? result.potential_causes.map((c) => `- ${c}`).join("\n")
      : "- None listed";

    const stepsList = Array.isArray(result.troubleshooting_steps) && result.troubleshooting_steps.length > 0
      ? result.troubleshooting_steps.map((step, idx) => `${idx + 1}. ${step}`).join("\n")
      : "1. No steps generated";

    const measList = measurements.length > 0
      ? measurements.map((m) => `- [User Measurement] ${m.type} @ ${m.location}: ${m.value} ${m.unit} (${m.notes || 'N/A'})`).join("\n")
      : "- None logged";

    return `# MechaFix AI - Diagnostic Report
Date: ${new Date().toLocaleDateString()}
Diagnosis ID: ${diagnosisId || "N/A"}
Status: ${status}

## Issue Summary
${result.issue_summary || "No summary available."}

## User Recorded Measurements
${measList}

## Components Detected
${componentsList}

## Potential Causes
${causesList}

## Troubleshooting Steps
${stepsList}

${rootCause ? `## Resolution\n- Root Cause: ${rootCause}\n- Action Taken: ${actionTaken}\n- Notes: ${finalNote}\n` : ""}
`;
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownReport();
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MechaFix_Report_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-12 animate-in fade-in duration-500 pt-8 print:p-0 print:m-0">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-sans text-3xl font-bold text-text">
              Diagnostic Report
            </h2>
            <span
              className={`text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider ${
                status === "resolved"
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : status === "partially_resolved"
                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                  : "bg-primary-container text-primary border border-primary/20"
              }`}
            >
              {status === "resolved"
                ? "Resolved"
                : status === "partially_resolved"
                ? "Partial Fix"
                : "Active Diagnostic"}
            </span>
          </div>
          <p className="font-mono text-sm text-text-muted mt-1">
            MechaFix Intelligent Diagnostic Analysis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowMeasurementDrawer(true)}
            className="px-3.5 py-2 bg-surface border border-primary/30 text-primary font-sans font-semibold rounded-xl hover:bg-primary-container/20 transition-all shadow-sm flex items-center gap-1.5 text-xs"
          >
            <span className="material-symbols-outlined text-base">straighten</span>
            + Log Measurement
          </button>

          <button
            onClick={() => setShowResolveModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white font-sans font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-neu-raised flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            {status === "resolved" ? "Update Fix" : "Mark Resolved"}
          </button>

          <button
            onClick={handleCopyReport}
            className="px-3 py-2 bg-surface-sunken text-text font-sans font-medium text-xs rounded-xl hover:bg-border/30 transition-colors flex items-center gap-1 border border-border"
            title="Copy Markdown Report"
          >
            <span className="material-symbols-outlined text-sm">
              {copySuccess ? "done" : "content_copy"}
            </span>
            {copySuccess ? "Copied!" : "Copy"}
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="px-3 py-2 bg-surface-sunken text-text font-sans font-medium text-xs rounded-xl hover:bg-border/30 transition-colors flex items-center gap-1 border border-border"
            title="Download .md file"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export .md
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-surface-sunken text-text font-sans font-medium text-xs rounded-xl hover:bg-border/30 transition-colors flex items-center gap-1 border border-border"
            title="Print Report"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Print
          </button>

          <button
            onClick={reset}
            className="px-3.5 py-2 bg-primary text-surface font-sans font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-neu-raised text-xs sm:text-sm"
          >
            New Session
          </button>
        </div>
      </div>

      {/* Image Quality Recovery Warning Banner */}
      {hasImageWarning && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">no_photography</span>
            </div>
            <div>
              <span className="font-sans font-bold text-sm text-text block">
                This photo needs another try
              </span>
              <p className="font-sans text-xs text-text-muted">
                {result.imageLimitations?.[0] || "Component labels or trace connections were partially obscured."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowImageQualityModal(true)}
            className="px-3.5 py-1.5 bg-amber-600 text-white rounded-xl font-sans font-semibold text-xs hover:bg-amber-700 transition-colors shrink-0 shadow-sm"
          >
            Review Image Quality
          </button>
        </div>
      )}

      {/* Issue Summary */}
      <div className="shadow-neu-pressed bg-surface rounded-2xl p-6 border border-border">
        <h3 className="font-sans font-semibold text-lg text-text flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary">analytics</span>
          Issue Summary
        </h3>
        <p className="font-sans text-text-muted leading-relaxed">
          {result.issue_summary}
        </p>
      </div>

      {/* User-Reported Measurements Section */}
      {measurements.length > 0 && (
        <div className="shadow-neu-raised bg-surface rounded-2xl p-6 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-semibold text-lg text-text flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">straighten</span>
              User-Reported Test Readings
            </h3>
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-500/20">
              {measurements.length} Readings
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {measurements.map((m) => (
              <div
                key={m.id}
                className="p-3.5 bg-surface-sunken border border-border rounded-xl shadow-neu-pressed space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans font-semibold text-xs text-text">{m.type}</span>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded border border-emerald-500/20">
                    User-Reported
                  </span>
                </div>
                <div className="font-mono text-lg font-bold text-primary">
                  {m.value} {m.unit}
                </div>
                <div className="text-xs font-sans text-text-muted">
                  📍 {m.location}
                </div>
                {m.notes && (
                  <p className="text-[11px] font-sans text-text-muted italic border-t border-border/50 pt-1">
                    {m.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Detected Components & Potential Causes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="shadow-neu-raised bg-surface rounded-2xl p-6 border border-border">
          <h3 className="font-sans font-semibold text-lg text-text flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">memory</span>
            Components Detected
          </h3>
          <ul className="space-y-3">
            {result.components_detected?.map((comp, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-container text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </div>
                <span className="font-sans text-text-muted">{comp}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="shadow-neu-raised bg-surface rounded-2xl p-6 border border-border">
          <h3 className="font-sans font-semibold text-lg text-text flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-error">warning</span>
            Potential Causes
          </h3>
          <ul className="space-y-3">
            {result.potential_causes?.map((cause, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-error-container text-error flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">electric_bolt</span>
                </div>
                <span className="font-sans text-text-muted">{cause}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Troubleshooting Steps */}
      <div className="shadow-neu-raised bg-surface rounded-2xl p-6 border border-border">
        <h3 className="font-sans font-semibold text-lg text-text flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">build</span>
          Troubleshooting Protocol
        </h3>
        <div className="space-y-4">
          {result.troubleshooting_steps?.map((step, idx) => (
            <div
              key={idx}
              className="flex gap-4 p-4 rounded-xl bg-surface-sunken border border-border shadow-neu-pressed"
            >
              <div className="font-mono text-primary font-bold text-lg pt-1">
                {String(idx + 1).padStart(2, "0")}
              </div>
              <p className="font-sans text-text-muted">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RAG Knowledge Base Grounding Sources */}
      {((rawResult?.retrievedSources && rawResult.retrievedSources.length > 0) ||
        (rawResult?.record?.retrievedSources && rawResult.record.retrievedSources.length > 0)) && (
        <div className="shadow-neu-raised bg-surface rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-sans font-semibold text-lg text-text flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">menu_book</span>
              Retrieved Knowledge Grounding Sources
            </h3>
            <span className="text-xs font-mono text-primary bg-primary-container/30 px-2.5 py-1 rounded-full">
              RAG Pipeline
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(rawResult.retrievedSources || rawResult.record.retrievedSources).map(
              (src: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-surface-sunken border border-border shadow-neu-pressed flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-sans font-semibold text-sm text-text">
                      {src.title}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono text-primary bg-primary-container/30 px-2 py-0.5 rounded border border-primary/20">
                        {typeof src.relevanceScore === 'number'
                          ? src.relevanceScore >= 60
                            ? 'Strong Match'
                            : src.relevanceScore >= 30
                            ? 'Relevant Match'
                            : 'Related Source'
                          : 'Relevant Source'}
                      </span>
                      <span className="text-[10px] font-mono text-text-muted bg-surface px-2 py-0.5 rounded border border-border">
                        {src.filename}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-sans text-text-muted line-clamp-2">
                    {src.excerpt}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* AI Follow-Up Interactive Assistant */}
      <div className="shadow-neu-raised bg-surface rounded-2xl p-6 border border-border space-y-4 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">forum</span>
            <h3 className="font-sans font-bold text-lg text-text">
              Ask MechaFix Assistant
            </h3>
          </div>
          <span className="text-xs font-mono text-primary bg-primary-container/30 px-2.5 py-1 rounded-full">
            Gemini Flash
          </span>
        </div>

        {/* Quick Question Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            "What multimeter mode should I use for continuity?",
            "How do I safely discharge capacitors?",
            "Can I substitute this diode with 1N4007?",
          ].map((chip, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendFollowUp(chip)}
              className="text-xs px-3 py-1.5 rounded-lg bg-surface-sunken text-text-muted hover:text-text hover:bg-border/30 border border-border transition-colors text-left"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div className="space-y-3 max-h-80 overflow-y-auto p-4 rounded-xl bg-surface-sunken border border-border custom-scrollbar">
          {chatMessages.length === 0 ? (
            <p className="font-sans text-xs text-text-muted italic text-center py-4">
              Have questions about a specific resistor value, test probe point, or safety check? Type your question below.
            </p>
          ) : (
            chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 p-3 rounded-xl text-sm ${
                  msg.role === "user"
                    ? "bg-primary-container/20 text-text ml-8 border border-primary/20"
                    : "bg-surface text-text mr-8 border border-border shadow-sm"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                    msg.role === "user"
                      ? "bg-primary text-surface"
                      : "bg-surface-sunken text-primary border border-border"
                  }`}
                >
                  {msg.role === "user" ? "U" : "AI"}
                </div>
                <div className="flex-1 whitespace-pre-line leading-relaxed">
                  {msg.text}
                </div>
              </div>
            ))
          )}

          {isAsking && (
            <div className="flex items-center gap-2 text-xs font-mono text-primary animate-pulse p-2">
              <span className="material-symbols-outlined text-sm">memory</span>
              Analyzing question & schematic parameters...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendFollowUp();
            }}
            placeholder="Ask follow-up troubleshooting questions..."
            className="flex-1 bg-surface-sunken border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={isAsking || !inputQuery.trim()}
            onClick={() => handleSendFollowUp()}
            className="px-5 py-2.5 bg-primary text-surface rounded-xl font-sans font-semibold hover:bg-primary-hover disabled:opacity-50 transition-all shadow-neu-raised flex items-center gap-1 text-sm"
          >
            <span>Send</span>
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </div>
      </div>

      {/* Resolution Modal Component */}
      {showResolveModal && (
        <ResolveDiagnosisModal
          diagnosisId={diagnosisId}
          currentStatus={status}
          initialRootCause={rootCause}
          initialActionTaken={actionTaken}
          initialNote={finalNote}
          onClose={() => setShowResolveModal(false)}
          onSuccess={(updatedStatus, resData) => {
            setStatus(updatedStatus);
            setRootCause(resData.rootCause);
            setActionTaken(resData.actionTaken);
            setFinalNote(resData.finalNote);
          }}
        />
      )}

      {/* Image Quality Recovery Modal */}
      {showImageQualityModal && (
        <ImageQualityModal
          imageLimitations={result.imageLimitations || []}
          onRetake={() => {
            setShowImageQualityModal(false);
            reset();
          }}
          onChooseAnother={() => {
            setShowImageQualityModal(false);
            reset();
          }}
          onContinueAnyway={() => setShowImageQualityModal(false)}
          onClose={() => setShowImageQualityModal(false)}
        />
      )}

      {/* Measurement Drawer Component */}
      <MeasurementDrawer
        diagnosisId={diagnosisId}
        existingMeasurements={measurements}
        isOpen={showMeasurementDrawer}
        onClose={() => setShowMeasurementDrawer(false)}
        onMeasurementAdded={handleAddMeasurement}
      />
    </div>
  );
}



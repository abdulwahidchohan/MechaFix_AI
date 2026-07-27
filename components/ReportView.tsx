"use client";

import { useState, useRef, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { DiagnosisRecord, Measurement, normalizeDiagnosis } from "@/lib/types";
import ResolveDiagnosisModal from "@/components/ResolveDiagnosisModal";
import ImageQualityModal from "@/components/ImageQualityModal";
import MeasurementDrawer from "@/components/MeasurementDrawer";
import { CurrentDiagnosticStepCard } from "@/components/CurrentDiagnosticStepCard";
import { HypothesisSummary } from "@/components/HypothesisSummary";
import { DiagnosticProgressTimeline } from "@/components/DiagnosticProgressTimeline";
import { AnnotatedImageViewer } from "@/components/AnnotatedImageViewer";
import { PinoutViewerModal } from "@/components/PinoutViewerModal";
import { DirectPdfExportModal } from "@/components/DirectPdfExportModal";
import { ReferenceDiagramModal } from "@/components/ReferenceDiagramModal";
import { Cpu, FileText, Sparkles, AlertTriangle, MoreVertical, CheckCircle2, ShieldAlert, ArrowRight, Activity, HelpCircle } from "lucide-react";

export default function ReportView({
  result: rawResult,
  reset,
}: {
  result: any;
  reset: () => void;
}) {
  const initialRecord = normalizeDiagnosis(rawResult?.record || rawResult?.data || rawResult || {});
  const [record, setRecord] = useState<DiagnosisRecord>(initialRecord);
  const diagnosisId = record.id || rawResult?.id;

  const [status, setStatus] = useState<string>(record.status || "in_progress");
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showPinoutModal, setShowPinoutModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showDiagramModal, setShowDiagramModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [rootCause, setRootCause] = useState(record.resolution?.rootCause || "");
  const [actionTaken, setActionTaken] = useState(record.resolution?.actionTaken || "");
  const [finalNote, setFinalNote] = useState(record.resolution?.finalNote || "");

  const [showImageQualityModal, setShowImageQualityModal] = useState(false);
  const [showMeasurementDrawer, setShowMeasurementDrawer] = useState(false);
  const [measurements, setMeasurements] = useState<Measurement[]>(record.measurements || []);

  const [isSubmittingStep, setIsSubmittingStep] = useState(false);
  const [announcement, setAnnouncement] = useState<string>("");
  const [referenceDiagramsEnabled, setReferenceDiagramsEnabled] = useState<boolean>(true);

  const stepCardRef = useRef<HTMLDivElement>(null);
  const chatAssistantRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/capabilities")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.referenceDiagrams === "boolean") {
          setReferenceDiagramsEnabled(data.referenceDiagrams);
        }
      })
      .catch(() => {});
  }, []);

  // Chat Follow-Up State
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "model"; text: string }>
  >([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const result = record.result;

  useEffect(() => {
    if (record.currentStep) {
      setAnnouncement(`New diagnostic step available: ${record.currentStep.title}`);
      if (stepCardRef.current) {
        stepCardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        stepCardRef.current.focus();
      }
    }
  }, [record.currentStep]);

  if (!result || !result.issue_summary) return null;

  const hasImageWarning =
    result.imageUsable === false || (Array.isArray(result.imageLimitations) && result.imageLimitations.length > 0);

  const getAuthToken = async () => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  const handleStepSubmit = async (data: {
    stepId: string;
    resultType: "passed" | "failed" | "not_sure" | "could_not_perform" | "measurement";
    selectedOption: string;
    observation?: string;
    measurementValues?: string[];
  }) => {
    setIsSubmittingStep(true);
    setAnnouncement("Evaluating test results with Gemini...");
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Authentication token required.");

      const clientRequestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const res = await fetch("/api/diagnoses/step-result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          diagnosisId,
          clientRequestId,
          ...data,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          console.warn("Step submission 409 (Stale or Duplicate Step). Refreshing state...");
          setAnnouncement("Step state updated. Syncing latest step...");
          // Gracefully reload latest diagnosis document
          if (resData.diagnosis) {
            const updatedRec = normalizeDiagnosis(resData.diagnosis);
            setRecord(updatedRec);
            setStatus(updatedRec.status);
          }
          return;
        }
        throw new Error(resData.error || "Failed to submit test result.");
      }

      const updatedRec = normalizeDiagnosis(resData.diagnosis);
      setRecord(updatedRec);
      setStatus(updatedRec.status);
      setAnnouncement(`Test result evaluated. Status: ${updatedRec.status}`);
    } catch (err: any) {
      alert(`Step submission failed: ${err.message}`);
    } finally {
      setIsSubmittingStep(false);
    }
  };

  const handleSendFollowUp = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const newHistory = [...chatMessages, { role: "user" as const, text: query }];
    setChatMessages(newHistory);
    setInputQuery("");
    setIsAsking(true);

    try {
      const token = await getAuthToken();

      const contextWithMeasurements = {
        ...result,
        userReportedMeasurements: measurements.map((m) => `${m.type} at ${m.location}: ${m.value} ${m.unit}`),
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

  const primaryEvidence = record.evidenceList && record.evidenceList.length > 0 ? record.evidenceList[0] : null;

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-12 animate-in fade-in duration-500 pt-8 print:p-0 print:m-0">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

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
                  : status === "safety_stop"
                  ? "bg-red-500/10 text-red-600 border border-red-500/20"
                  : "bg-primary-container text-primary border border-primary/20"
              }`}
            >
              {status === "resolved"
                ? "Resolved"
                : status === "safety_stop"
                ? "Safety Stop"
                : "Active Diagnostic Loop"}
            </span>
          </div>
          <p className="font-mono text-sm text-text-muted mt-1">
            Target: {record.setup.board} • {record.setup.component}
          </p>
        </div>

        {/* Desktop Header Actions */}
        <div className="hidden md:flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPinoutModal(true)}
            className="px-3.5 py-2 bg-surface border border-sky-500/40 text-sky-600 dark:text-sky-400 font-sans font-semibold rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-all shadow-sm flex items-center gap-1.5 text-xs min-h-[44px]"
          >
            <Cpu className="w-4 h-4" />
            Verified Pinouts
          </button>

          <button
            type="button"
            onClick={() => setShowDiagramModal(true)}
            className="px-3.5 py-2 bg-surface border border-purple-500/40 text-purple-600 dark:text-purple-400 font-sans font-semibold rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all shadow-sm flex items-center gap-1.5 text-xs min-h-[44px]"
          >
            <Sparkles className="w-4 h-4" />
            AI Reference Diagram
          </button>

          <button
            type="button"
            onClick={() => setShowPdfModal(true)}
            className="px-3 py-2 bg-slate-900 text-white font-sans font-medium text-xs rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1 shadow-sm min-h-[44px]"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>

          <button
            type="button"
            onClick={() => setShowResolveModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white font-sans font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5 text-xs min-h-[44px]"
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            {status === "resolved" ? "Update Fix" : "Mark Resolved"}
          </button>

          <button
            type="button"
            onClick={reset}
            className="px-3.5 py-2 bg-primary text-surface font-sans font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-sm text-xs min-h-[44px]"
          >
            New Session
          </button>
        </div>

        {/* Mobile Action Grouping (<768px) */}
        <div className="flex md:hidden items-center justify-between gap-2 pt-2 border-t border-border/50">
          <button
            type="button"
            onClick={() => setShowResolveModal(true)}
            className="flex-1 py-2.5 px-3 bg-emerald-600 text-white font-sans font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 text-xs min-h-[44px]"
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            {status === "resolved" ? "Update Fix" : "Mark Resolved"}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2.5 bg-surface border border-border text-text rounded-xl font-sans font-semibold text-xs flex items-center justify-center min-w-[44px] min-h-[44px]"
              aria-label="More actions"
            >
              <MoreVertical className="w-5 h-5 text-text-muted" />
            </button>

            {showMobileMenu && (
              <div className="absolute right-0 top-12 w-56 bg-surface border border-border rounded-xl shadow-xl z-40 p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => { setShowPinoutModal(true); setShowMobileMenu(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-text hover:bg-surface-sunken rounded-lg flex items-center gap-2 min-h-[44px]"
                >
                  <Cpu className="w-4 h-4 text-sky-500" /> Verified Pinouts
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDiagramModal(true); setShowMobileMenu(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-text hover:bg-surface-sunken rounded-lg flex items-center gap-2 min-h-[44px]"
                >
                  <Sparkles className="w-4 h-4 text-purple-500" /> AI Reference Diagram
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPdfModal(true); setShowMobileMenu(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-text hover:bg-surface-sunken rounded-lg flex items-center gap-2 min-h-[44px]"
                >
                  <FileText className="w-4 h-4 text-slate-500" /> Export PDF
                </button>
                <button
                  type="button"
                  onClick={() => { setShowMeasurementDrawer(true); setShowMobileMenu(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-text hover:bg-surface-sunken rounded-lg flex items-center gap-2 min-h-[44px]"
                >
                  <Activity className="w-4 h-4 text-emerald-500" /> Log Measurement
                </button>
                <button
                  type="button"
                  onClick={() => { reset(); setShowMobileMenu(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg flex items-center gap-2 min-h-[44px]"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span> New Session
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safety Alert Banner */}
      {status === "safety_stop" && (
        <div className="p-4 bg-red-500/15 border-2 border-red-500 rounded-2xl flex items-center gap-3 text-red-900 dark:text-red-200">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
          <div className="text-xs">
            <strong className="block text-sm font-bold">SAFETY STOP TRIGGERED</strong>
            <span>
              Potential thermal runaway, swollen battery, or hazardous high voltage detected. Power must be completely isolated immediately.
            </span>
          </div>
        </div>
      )}

      {/* Image Quality Warning Banner */}
      {hasImageWarning && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">no_photography</span>
            </div>
            <div>
              <span className="font-sans font-bold text-sm text-text block">
                Photo Clarity Notice
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
      <div className="shadow-neu-pressed bg-surface rounded-2xl p-6 border border-border space-y-2">
        <h3 className="font-sans font-semibold text-lg text-text flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">analytics</span>
          Diagnostic Issue Summary
        </h3>
        <p className="font-sans text-text-muted leading-relaxed">
          {result.issue_summary}
        </p>
      </div>

      {/* Annotated Image Viewer (If Evidence Present) */}
      {primaryEvidence && primaryEvidence.data && (
        <AnnotatedImageViewer
          imageUrl={`data:${primaryEvidence.mimeType};base64,${primaryEvidence.data}`}
          annotations={primaryEvidence.annotations || result.annotations || []}
          title={`Evidence Image Overlay (${record.setup.board})`}
        />
      )}

      {/* State Machine: Active Diagnostic Step Card OR Transition Cards */}
      {record.currentStep && status !== "resolved" && status !== "safety_stop" ? (
        <div ref={stepCardRef} tabIndex={-1} className="outline-none">
          <CurrentDiagnosticStepCard
            step={record.currentStep}
            onSubmitResult={handleStepSubmit}
            isLoading={isSubmittingStep}
          />
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-neu-raised space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            {status === "resolved" ? (
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : status === "safety_stop" ? (
              <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center shrink-0 border border-red-500/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <Activity className="w-6 h-6" />
              </div>
            )}

            <div>
              <h3 className="text-base font-bold text-text">
                {status === "resolved"
                  ? "Diagnostic Session Resolved"
                  : status === "safety_stop"
                  ? "Safety Precaution Stop"
                  : "Diagnostic Test Sequence Completed"}
              </h3>
              <p className="text-xs text-text-muted">
                {status === "resolved"
                  ? "Root cause confirmed and resolution details saved."
                  : status === "safety_stop"
                  ? "Electrical hazard precaution active. Isolate power source."
                  : "All active test steps evaluated. Log additional measurements or mark resolution."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowResolveModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 min-h-[44px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{status === "resolved" ? "Update Fix Details" : "Mark Resolved & Save"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMeasurementDrawer(true)}
              className="px-4 py-2.5 bg-surface border border-border text-text font-semibold text-xs rounded-xl hover:bg-surface-sunken transition-all flex items-center gap-1.5 min-h-[44px]"
            >
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Log Test Measurement</span>
            </button>

            <button
              type="button"
              onClick={() => {
                chatAssistantRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-4 py-2.5 bg-surface border border-border text-text font-semibold text-xs rounded-xl hover:bg-surface-sunken transition-all flex items-center gap-1.5 min-h-[44px]"
            >
              <HelpCircle className="w-4 h-4 text-sky-500" />
              <span>Ask Follow-Up Question</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Hypotheses Summary */}
      {record.activeHypotheses && record.activeHypotheses.length > 0 && (
        <HypothesisSummary hypotheses={record.activeHypotheses} />
      )}

      {/* Diagnostic Step Timeline History */}
      {record.diagnosticProgress && record.diagnosticProgress.length > 0 && (
        <DiagnosticProgressTimeline progress={record.diagnosticProgress} />
      )}

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

      {/* AI Follow-Up Interactive Assistant */}
      <div ref={chatAssistantRef} className="shadow-neu-raised bg-surface rounded-2xl p-6 border border-border space-y-4 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">forum</span>
            <h3 className="font-sans font-bold text-lg text-text">
              Ask MechaFix Assistant
            </h3>
          </div>
          <span className="text-xs font-mono text-primary bg-primary-container/30 px-2.5 py-1 rounded-full">
            Interactions API
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

      {/* Modals */}
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

      {showPinoutModal && (
        <PinoutViewerModal
          isOpen={showPinoutModal}
          onClose={() => setShowPinoutModal(false)}
          defaultComponent={record.setup.board}
        />
      )}

      {showPdfModal && (
        <DirectPdfExportModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          record={record}
        />
      )}

      {showDiagramModal && (
        <ReferenceDiagramModal
          isOpen={showDiagramModal}
          onClose={() => setShowDiagramModal(false)}
          diagnosisId={diagnosisId || "draft"}
          board={record.setup.board}
          component={record.setup.component}
          existingReferences={record.generatedReferences || []}
          getAuthToken={getAuthToken}
          isDisabledByConfig={!referenceDiagramsEnabled}
          onReferenceGenerated={(newRef) => {
            setRecord((prev) => ({
              ...prev,
              generatedReferences: [...(prev.generatedReferences || []), newRef],
            }));
          }}
        />
      )}

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

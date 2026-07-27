export interface DiagnosisInput {
  board: string;
  component: string;
  powerSource: string;
  problemCategory: string;
  expectedBehavior: string;
  actualBehavior: string;
  errorMessage?: string;
  notes?: string;
  evidenceType: "photo" | "screenshot" | "text_only" | "multi_photo";
  images?: Array<{
    mimeType: string;
    data: string; // Base64
    evidenceType?: "photo" | "schematic" | "measurement_display" | "close_up_damage" | "other";
  }>;
}

export interface Measurement {
  id: string;
  type: "Voltage" | "Resistance" | "Current" | "Signal/PWM" | "I2C/SPI Scan" | "Continuity/Short" | "Other";
  location: string;
  value: string;
  unit: string;
  notes?: string;
  timestamp: string;
  isUserReported: true;
}

export interface ImageAnnotation {
  id: string;
  evidenceId?: string;
  label: string;
  category:
    | "board"
    | "sensor"
    | "actuator"
    | "power"
    | "connector"
    | "wire_region"
    | "damaged_region"
    | "unreadable_region"
    | "expected_test_point"
    | "other";
  box2d: [number, number, number, number]; // [y_min, x_min, y_max, x_max] 0 - 1000
  observation: string;
  certaintyType: "observed" | "possible" | "not_verified" | "safety_concern";
}

export interface EvidenceItem {
  id: string;
  mimeType: string;
  data?: string; // Base64 or URL
  evidenceType: "photo" | "schematic" | "measurement_display" | "close_up_damage" | "other";
  uploadedAt: string;
  imageUsable?: boolean;
  imageLimitations?: string[];
  annotations?: ImageAnnotation[];
}

export interface Hypothesis {
  id: string;
  title: string;
  explanation: string;
  state: "suspected" | "confirmed" | "ruled_out";
  evidenceFor: string[];
  evidenceAgainst: string[];
}

export interface DiagnosticStep {
  id: string;
  sequence: number;
  title: string;
  instruction: string;
  reason: string;
  safetyNote: string;
  expectedResult: string;
  resultOptions: string[];
  status?: "current" | "completed" | "skipped" | "blocked" | "unsafe";
  requiresPowerDisconnected: boolean;
  requiresMeasurement: boolean;
  requestedMeasurementType?: "voltage" | "resistance" | "current" | "continuity" | "frequency" | "logic_level" | "other" | string;
  suggestedUnit?: string;
}

export interface StepResult {
  id: string;
  stepId: string;
  resultType:
    | "passed"
    | "failed"
    | "not_sure"
    | "could_not_perform"
    | "measurement"
    | "text_observation"
    | "photo_evidence";
  selectedOption: string;
  observation?: string;
  measurementValues?: string[];
  evidenceIds?: string[];
  submittedAt: string;
  isUserReported: true;
}

export interface GeneratedReference {
  id: string;
  title: string;
  description: string;
  imageUrl: string; // Base64 or URL
  generatedAt: string;
  promptUsed: string;
  disclaimer: string;
}

export interface DiagnosisResult {
  issue_summary: string;
  components_detected: string[];
  potential_causes?: string[];
  troubleshooting_steps?: string[];
  safetyLevel?: "SAFE" | "CAUTION" | "HAZARD";
  safetyWarning?: string;
  imageUsable?: boolean;
  imageLimitations?: string[];
  annotations?: ImageAnnotation[];
}

export interface DiagnosisRecord {
  id?: string;
  userId?: string;
  version?: "1" | "2";
  createdAt: any;
  updatedAt?: any;
  resolvedAt?: any;
  status:
    | "draft"
    | "analyzing"
    | "in_progress"
    | "waiting_for_user"
    | "resolved"
    | "partially_resolved"
    | "needs_review"
    | "safety_stop"
    | "failed";
  setup: {
    board: string;
    component: string;
    powerSource: string;
    problemCategory: string;
  };
  originalInput: {
    expectedBehavior: string;
    actualBehavior: string;
    errorMessage?: string;
    notes?: string;
    evidenceType: string;
  };
  result: DiagnosisResult;
  evidenceList?: EvidenceItem[];
  activeHypotheses?: Hypothesis[];
  currentStep?: DiagnosticStep;
  diagnosticProgress?: Array<{
    step: DiagnosticStep;
    result: StepResult;
  }>;
  resolution?: {
    rootCause?: string;
    actionTaken?: string;
    finalNote?: string;
    resolvedAt?: any;
  };
  measurements?: Measurement[];
  generatedReferences?: GeneratedReference[];
  followUpMessages?: Array<{
    role: "user" | "model";
    text: string;
    timestamp: any;
  }>;
}

import { normalizeFirestoreDate } from "./date-utils";

/**
 * Backward compatibility helper to convert version 1 DiagnosisRecord to version 2
 */
export function normalizeDiagnosis(record: DiagnosisRecord): DiagnosisRecord {
  const norm: DiagnosisRecord = { ...record };
  norm.version = "2";

  norm.createdAt = normalizeFirestoreDate(norm.createdAt).toISOString();
  if (norm.updatedAt) {
    norm.updatedAt = normalizeFirestoreDate(norm.updatedAt).toISOString();
  }
  if (norm.resolvedAt) {
    norm.resolvedAt = normalizeFirestoreDate(norm.resolvedAt).toISOString();
  }

  if (!norm.status) {
    norm.status = "in_progress";
  }

  if (!norm.activeHypotheses || norm.activeHypotheses.length === 0) {
    const potentialCauses = norm.result?.potential_causes || [];
    norm.activeHypotheses = potentialCauses.map((cause, idx) => ({
      id: `hyp-${idx + 1}`,
      title: cause,
      explanation: "Initial cause derived from baseline diagnostic scan.",
      state: "suspected",
      evidenceFor: ["Reported symptom match"],
      evidenceAgainst: [],
    }));
  }

  if (!norm.currentStep) {
    const stepList = norm.result?.troubleshooting_steps || [];
    const firstStepText = stepList[0] || "Inspect wiring connections and verify board power supply voltage.";
    norm.currentStep = {
      id: "step-1",
      sequence: 1,
      title: "Initial Diagnostic Check",
      instruction: firstStepText,
      reason: "Initial baseline diagnostic step to verify hardware connectivity.",
      safetyNote: "Ensure power supply is disconnected before moving jumper wires.",
      expectedResult: "All connections firmly seated without loose pins.",
      resultOptions: ["Connections Seated Correctly", "Loose Wire Found", "Wiring Damaged / Shorted"],
      requiresPowerDisconnected: true,
      requiresMeasurement: false,
      status: "current",
    };
  }

  if (!norm.diagnosticProgress) {
    norm.diagnosticProgress = [];
  }

  if (!norm.evidenceList) {
    norm.evidenceList = [];
  }

  if (!norm.generatedReferences) {
    norm.generatedReferences = [];
  }

  return norm;
}

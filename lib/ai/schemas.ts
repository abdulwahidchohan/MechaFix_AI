import { Type } from "@google/genai";

// Schema for Image Annotation / Object Bounding Boxes
export const imageAnnotationSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    evidenceId: { type: Type.STRING },
    label: { type: Type.STRING },
    category: {
      type: Type.STRING,
      enum: [
        "board",
        "sensor",
        "actuator",
        "power",
        "connector",
        "wire_region",
        "damaged_region",
        "unreadable_region",
        "expected_test_point",
        "other",
      ],
    },
    box2d: {
      type: Type.ARRAY,
      description: "Normalized coordinates [y_min, x_min, y_max, x_max] from 0 to 1000",
      items: { type: Type.INTEGER },
    },
    observation: { type: Type.STRING },
    certaintyType: {
      type: Type.STRING,
      enum: ["observed", "possible", "not_verified", "safety_concern"],
    },
  },
  required: ["id", "label", "category", "box2d", "observation", "certaintyType"],
};

// Schema for Diagnostic Step
export const diagnosticStepSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    sequence: { type: Type.INTEGER },
    title: { type: Type.STRING },
    instruction: { type: Type.STRING },
    reason: { type: Type.STRING },
    safetyNote: { type: Type.STRING },
    expectedResult: { type: Type.STRING },
    resultOptions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    requiresPowerDisconnected: { type: Type.BOOLEAN },
    requiresMeasurement: { type: Type.BOOLEAN },
    requestedMeasurementType: { type: Type.STRING },
    suggestedUnit: { type: Type.STRING },
  },
  required: [
    "id",
    "sequence",
    "title",
    "instruction",
    "reason",
    "safetyNote",
    "expectedResult",
    "resultOptions",
  ],
};

// Schema for Hypothesis
export const hypothesisSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    explanation: { type: Type.STRING },
    state: {
      type: Type.STRING,
      enum: ["suspected", "confirmed", "ruled_out"],
    },
    evidenceFor: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    evidenceAgainst: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["id", "title", "explanation", "state", "evidenceFor", "evidenceAgainst"],
};

// Complete Analysis Schema
export const fullAnalysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    issue_summary: { type: Type.STRING },
    components_detected: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    imageUsable: { type: Type.BOOLEAN },
    imageLimitations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    annotations: {
      type: Type.ARRAY,
      items: imageAnnotationSchema,
    },
    safetyLevel: {
      type: Type.STRING,
      enum: ["SAFE", "CAUTION", "HAZARD"],
    },
    safetyWarning: { type: Type.STRING },
    activeHypotheses: {
      type: Type.ARRAY,
      items: hypothesisSchema,
    },
    currentStep: diagnosticStepSchema,
    troubleshooting_steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    "issue_summary",
    "components_detected",
    "imageUsable",
    "safetyLevel",
    "activeHypotheses",
    "currentStep",
  ],
};

// Step Result Re-evaluation Schema
export const stepResultEvaluationSchema = {
  type: Type.OBJECT,
  properties: {
    analysisOfResult: { type: Type.STRING },
    updatedHypotheses: {
      type: Type.ARRAY,
      items: hypothesisSchema,
    },
    diagnosisStatus: {
      type: Type.STRING,
      enum: [
        "in_progress",
        "waiting_for_user",
        "resolved",
        "partially_resolved",
        "needs_review",
        "safety_stop",
      ],
    },
    nextStep: diagnosticStepSchema,
    resolutionSummary: {
      type: Type.OBJECT,
      properties: {
        rootCause: { type: Type.STRING },
        actionTaken: { type: Type.STRING },
        finalNote: { type: Type.STRING },
      },
    },
  },
  required: ["analysisOfResult", "updatedHypotheses", "diagnosisStatus"],
};

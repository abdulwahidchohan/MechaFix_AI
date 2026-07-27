import test from "node:test";
import assert from "node:assert/strict";
import { DiagnosisRecord, DiagnosticStep, Hypothesis, StepResult } from "../../lib/types";

function transitionStateMachine(
  record: DiagnosisRecord,
  stepResult: StepResult,
  nextStep?: DiagnosticStep,
  updatedHypotheses?: Hypothesis[]
): DiagnosisRecord {
  // Idempotency check: Reject duplicate result submission
  if (record.diagnosticProgress?.some((p) => p.result.stepId === stepResult.stepId)) {
    throw { status: 409, code: "DUPLICATE_REQUEST", message: "Step result has already been submitted." };
  }

  // Stale step check: Ensure stepId matches currentStep.id
  if (!record.currentStep || record.currentStep.id !== stepResult.stepId) {
    throw { status: 409, code: "STALE_DIAGNOSTIC_STEP", message: "Submitted result applies to a stale or inactive step." };
  }

  const completedStep: DiagnosticStep = {
    ...record.currentStep,
    status: stepResult.resultType === "failed" ? "blocked" : "completed",
  };

  const newProgressItem = {
    step: completedStep,
    result: stepResult,
  };

  const newProgress = [...(record.diagnosticProgress || []), newProgressItem];
  const newHypotheses = updatedHypotheses || record.activeHypotheses || [];

  return {
    ...record,
    status: nextStep ? "in_progress" : "waiting_for_user",
    currentStep: nextStep || completedStep,
    activeHypotheses: newHypotheses,
    diagnosticProgress: newProgress,
  };
}

test("Diagnostic State Machine handles initial step assignment and valid transition", () => {
  const initialRecord: DiagnosisRecord = {
    id: "diag-state-1",
    createdAt: "2026-07-27T10:00:00.000Z",
    status: "in_progress",
    setup: { board: "Arduino UNO", component: "HC-SR04", powerSource: "USB 5V", problemCategory: "Sensor Not Responding" },
    originalInput: { expectedBehavior: "Distance measurement", actualBehavior: "Returns 0", evidenceType: "text_only" },
    result: { issue_summary: "HC-SR04 pulseIn timeout", components_detected: ["Arduino", "HC-SR04"] },
    currentStep: {
      id: "step-1",
      sequence: 1,
      title: "Check 5V Power Rail",
      instruction: "Measure DC voltage between VCC and GND pins.",
      reason: "Ensure sensor receives regulated 5V.",
      safetyNote: "Do not short probe leads.",
      expectedResult: "4.8V to 5.2V DC",
      resultOptions: ["Voltage is 5.0V", "Voltage is 0V", "Voltage is fluctuating"],
      status: "current",
      requiresPowerDisconnected: false,
      requiresMeasurement: true,
    },
    activeHypotheses: [
      { id: "h1", title: "Missing 5V VCC power supply", explanation: "Sensor unpowered", state: "suspected", evidenceFor: [], evidenceAgainst: [] },
    ],
    diagnosticProgress: [],
  };

  const stepResult: StepResult = {
    id: "res-1",
    stepId: "step-1",
    resultType: "passed",
    selectedOption: "Voltage is 5.0V",
    observation: "Multimeter reads 5.01V DC",
    submittedAt: "2026-07-27T10:05:00.000Z",
    isUserReported: true,
  };

  const nextStep: DiagnosticStep = {
    id: "step-2",
    sequence: 2,
    title: "Verify Echo Pin Voltage Divider",
    instruction: "Check Echo pin resistor divider before connecting to 3.3V GPIO.",
    reason: "Protect microcontroller GPIO from 5V Echo pulse.",
    safetyNote: "Use 1k/2k ohm resistor network.",
    expectedResult: "3.3V logic level",
    resultOptions: ["Divider present", "Divider missing"],
    status: "current",
    requiresPowerDisconnected: true,
    requiresMeasurement: false,
  };

  const updatedRecord = transitionStateMachine(initialRecord, stepResult, nextStep);

  assert.equal(updatedRecord.currentStep?.id, "step-2");
  assert.equal(updatedRecord.diagnosticProgress?.length, 1);
  assert.equal(updatedRecord.diagnosticProgress?.[0].result.selectedOption, "Voltage is 5.0V");
});

test("Diagnostic State Machine rejects duplicate requestId with 409 DUPLICATE_REQUEST", () => {
  const step1: DiagnosticStep = { id: "step-1", sequence: 1, title: "Step 1", instruction: "x", reason: "y", safetyNote: "z", expectedResult: "a", resultOptions: [], status: "completed", requiresPowerDisconnected: false, requiresMeasurement: false };
  const step1Result: StepResult = { id: "res-1", stepId: "step-1", resultType: "passed", selectedOption: "OK", submittedAt: "2026-07-27T10:00:00.000Z", isUserReported: true };

  const recordWithProgress: DiagnosisRecord = {
    id: "diag-state-2",
    createdAt: "2026-07-27T10:00:00.000Z",
    status: "in_progress",
    setup: { board: "Arduino", component: "Sensor", powerSource: "5V", problemCategory: "Test" },
    originalInput: { expectedBehavior: "x", actualBehavior: "y", evidenceType: "text_only" },
    result: { issue_summary: "Test", components_detected: [] },
    currentStep: { id: "step-2", sequence: 2, title: "Step 2", instruction: "x", reason: "y", safetyNote: "z", expectedResult: "a", resultOptions: [], status: "current", requiresPowerDisconnected: false, requiresMeasurement: false },
    diagnosticProgress: [
      { step: step1, result: step1Result },
    ],
  };

  const duplicateResult: StepResult = {
    id: "res-dup",
    stepId: "step-1", // Already submitted
    resultType: "passed",
    selectedOption: "OK",
    submittedAt: "2026-07-27T10:10:00.000Z",
    isUserReported: true,
  };

  assert.throws(
    () => transitionStateMachine(recordWithProgress, duplicateResult),
    (err: any) => err.status === 409 && err.code === "DUPLICATE_REQUEST"
  );
});

test("Diagnostic State Machine rejects stale stepId submission with 409 STALE_DIAGNOSTIC_STEP", () => {
  const activeRecord: DiagnosisRecord = {
    id: "diag-state-3",
    createdAt: "2026-07-27T10:00:00.000Z",
    status: "in_progress",
    setup: { board: "Arduino", component: "Sensor", powerSource: "5V", problemCategory: "Test" },
    originalInput: { expectedBehavior: "x", actualBehavior: "y", evidenceType: "text_only" },
    result: { issue_summary: "Test", components_detected: [] },
    currentStep: { id: "step-3", sequence: 3, title: "Active Step 3", instruction: "x", reason: "y", safetyNote: "z", expectedResult: "a", resultOptions: [], status: "current", requiresPowerDisconnected: false, requiresMeasurement: false },
    diagnosticProgress: [],
  };

  const staleResult: StepResult = {
    id: "res-stale",
    stepId: "step-1", // Stale step ID mismatch
    resultType: "passed",
    selectedOption: "OK",
    submittedAt: "2026-07-27T10:12:00.000Z",
    isUserReported: true,
  };

  assert.throws(
    () => transitionStateMachine(activeRecord, staleResult),
    (err: any) => err.status === 409 && err.code === "STALE_DIAGNOSTIC_STEP"
  );
});

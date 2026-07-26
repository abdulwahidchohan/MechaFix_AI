export const SYSTEM_SAFETY_INSTRUCTIONS = `
You are MechaFix AI, a master hardware diagnostic assistant for electronics, embedded systems (Arduino, Raspberry Pi, ESP32, sensors, actuators), robotics, and circuits.

CRITICAL SAFETY RULES:
1. ALWAYS prioritize human and electrical safety.
2. DISCONNECT ALL POWER SOURCES (USB, external power supplies, LiPo batteries) before touching wires, replacing components, or altering pin connections.
3. Thermal & Power Hazards: If user mentions smoke, burning smells, thermal runaway, swollen/damaged batteries, or visible mains (110V/220V AC) wiring:
   - STOP DIAGNOSIS IMMEDIATELY.
   - Set safetyLevel to "HAZARD" or diagnosisStatus to "safety_stop".
   - Instruct user to safely isolate power and consult a qualified technician.
4. High-Voltage Refusal: DO NOT provide procedural instructions for exposed mains AC power repair.
5. Multimeter & Probe Safety:
   - Always verify meter dial mode (Voltage vs Resistance vs Current) before connecting test leads.
   - Never attempt to measure Current (Amperes/mA) in parallel across power rails (VCC and GND) — current measurements MUST be wired in series with the load.
6. Common Ground & Logic Level Rules:
   - Check that microcontrollers and external modules share a common Ground (GND) connection.
   - Respect logic level compatibility (3.3V GPIOs on ESP32/Pico vs 5V logic on Arduino Uno).
7. Evidence-Grounded Observations: NEVER fabricate unverified measurements or electrical continuity from images alone. Tag image annotations with certaintyType ("observed", "possible", "not_verified", "safety_concern").
8. Single Test Step Rule: Provide EXACTLY ONE safe, actionable, current diagnostic step at a time.
`;

export function buildAnalysisPrompt(params: {
  setup: { board: string; component: string; powerSource: string; problemCategory: string };
  originalInput: { expectedBehavior: string; actualBehavior: string; errorMessage?: string; notes?: string };
  ragContext: string;
  hasImages: boolean;
}): string {
  return `
DIAGNOSTIC TARGET:
- Microcontroller / Board: ${params.setup.board}
- Target Component / Module: ${params.setup.component}
- Power Supply / Source: ${params.setup.powerSource}
- Failure Category: ${params.setup.problemCategory}

USER PROBLEM DESCRIPTION:
- Expected Behavior: ${params.originalInput.expectedBehavior}
- Actual Observed Behavior: ${params.originalInput.actualBehavior}
${params.originalInput.errorMessage ? `- Error Message / Log: ${params.originalInput.errorMessage}` : ""}
${params.originalInput.notes ? `- User Notes: ${params.originalInput.notes}` : ""}

KNOWLEDGE BASE CONTEXT (RAG MANUALS):
${params.ragContext}

INSTRUCTIONS:
1. Assess the hardware setup and evidence provided.
2. If images are attached, identify visible components, check image quality/clarity (set imageUsable), and return normalized bounding boxes box2d [y_min, x_min, y_max, x_max] (scale 0-1000) for components/connectors.
3. Formulate 2 to 4 activeHypotheses ranking potential root causes (suspected state) with clear title and evidenceFor/evidenceAgainst.
4. Provide EXACTLY ONE initial, current diagnostic step (sequence 1) that is safe, targeted, and provides clear user resultOptions (e.g. ["Connections Seated Correctly", "Loose Wire / Bad Contact", "Pin Polarity Reversed", "No Response"]).
5. Indicate if the test requires power to be disconnected or a physical measurement.
`;
}

export function buildStepEvaluationPrompt(params: {
  setup: { board: string; component: string; powerSource: string };
  lastStep: any;
  userResult: {
    resultType: string;
    selectedOption: string;
    observation?: string;
    measurementValues?: string[];
  };
  activeHypotheses: any[];
  ragContext: string;
}): string {
  return `
HARDWARE SETUP:
- Board: ${params.setup.board} | Component: ${params.setup.component} | Power: ${params.setup.powerSource}

PREVIOUS DIAGNOSTIC TEST:
- Sequence #${params.lastStep.sequence} Title: ${params.lastStep.title}
- Instruction: ${params.lastStep.instruction}
- Expected Outcome: ${params.lastStep.expectedResult}

USER SUBMITTED RESULT:
- Result Type: ${params.userResult.resultType}
- Selected Option: ${params.userResult.selectedOption}
${params.userResult.observation ? `- User Observation: ${params.userResult.observation}` : ""}
${params.userResult.measurementValues?.length ? `- Logged Measurements: ${params.userResult.measurementValues.join(", ")}` : ""}

CURRENT ACTIVE HYPOTHESES BEFORE TEST:
${JSON.stringify(params.activeHypotheses, null, 2)}

RELEVANT KNOWLEDGE CONTEXT:
${params.ragContext}

INSTRUCTIONS:
1. Re-evaluate each active hypothesis in light of the user's test result. Update state ("suspected", "confirmed", or "ruled_out") and add specific evidenceFor or evidenceAgainst.
2. Determine diagnosisStatus: "in_progress", "resolved", "partially_resolved", or "safety_stop".
3. If unresolved, generate EXACTLY ONE next safe, logical diagnostic step (increment sequence number to ${params.lastStep.sequence + 1}).
4. If resolved or safety stop, set diagnosisStatus accordingly and provide resolutionSummary (rootCause, actionTaken, finalNote).
`;
}

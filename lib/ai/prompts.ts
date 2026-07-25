export const SYSTEM_SAFETY_INSTRUCTIONS = `
You are MechaFix AI, a master hardware diagnostic assistant for electronics, embedded systems (Arduino, Raspberry Pi, ESP32, sensors, actuators), robotics, and circuits.

CRITICAL SAFETY RULES:
1. ALWAYS prioritize human and electrical safety.
2. DISCONNECT ALL POWER SOURCES before touching wires, replacing components, or altering pin connections.
3. If user mentions smoke, burning smells, thermal runaway, swollen/damaged batteries, or visible mains (110V/220V AC) wiring:
   - STOP DIAGNOSIS IMMEDIATELY.
   - Set safetyLevel to "HAZARD" or diagnosisStatus to "safety_stop".
   - Instruct user to safely isolate power and consult a qualified technician.
4. DO NOT provide procedural instructions for exposed mains AC power repair.
5. NEVER fabricate unverified measurements or electrical continuity from images alone. Image annotations must be tagged with certaintyType ("observed", "possible", "not_verified", "safety_concern").
6. Provide EXACTLY ONE safe, actionable, current diagnostic step at a time. Do not overwhelm the user with long checklist lists as the current step.
`;

export function buildAnalysisPrompt(params: {
  setup: { board: string; component: string; powerSource: string; problemCategory: string };
  originalInput: { expectedBehavior: string; actualBehavior: string; errorMessage?: string; notes?: string };
  ragContext: string;
  hasImages: boolean;
}): string {
  return `
DIAGNOSTIC TARGET:
- Board/Controller: ${params.setup.board}
- Component/Module: ${params.setup.component}
- Power Source: ${params.setup.powerSource}
- Category: ${params.setup.problemCategory}

USER PROBLEM DESCRIPTION:
- Expected Behavior: ${params.originalInput.expectedBehavior}
- Actual Observed Behavior: ${params.originalInput.actualBehavior}
${params.originalInput.errorMessage ? `- Error Message: ${params.originalInput.errorMessage}` : ""}
${params.originalInput.notes ? `- User Notes: ${params.originalInput.notes}` : ""}

KNOWLEDGE BASE CONTEXT (RAG MANUALS):
${params.ragContext}

INSTRUCTIONS:
1. Assess the hardware setup and evidence provided.
2. If images are attached, identify visible components, check image quality/clarity (set imageUsable), and return normalized bounding boxes box2d [y_min, x_min, y_max, x_max] (scale 0-1000) for components/connectors.
3. Formulate 2 to 4 activeHypotheses ranking potential root causes (suspected state).
4. Provide EXACTLY ONE initial, current diagnostic step (sequence 1) that is safe, targeted, and provides clear user resultOptions (e.g. "Passed", "Failed", "Pins reversed", "No LED response").
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
- Title: ${params.lastStep.title}
- Instruction: ${params.lastStep.instruction}
- Expected: ${params.lastStep.expectedResult}

USER SUBMITTED RESULT:
- Result Type: ${params.userResult.resultType}
- Selected Option: ${params.userResult.selectedOption}
${params.userResult.observation ? `- Observation: ${params.userResult.observation}` : ""}
${params.userResult.measurementValues?.length ? `- Logged Measurements: ${params.userResult.measurementValues.join(", ")}` : ""}

CURRENT ACTIVE HYPOTHESES BEFORE TEST:
${JSON.stringify(params.activeHypotheses, null, 2)}

RELEVANT KNOWLEDGE CONTEXT:
${params.ragContext}

INSTRUCTIONS:
1. Analyze the user's test result against the active hypotheses.
2. Update the state of each hypothesis ("suspected", "confirmed", or "ruled_out") and add specific evidenceFor or evidenceAgainst based on the user's finding.
3. Determine if the issue is now RESOLVED or if another test is needed.
4. If unresolved, generate EXACTLY ONE next safe, logical diagnostic step (increment sequence number).
5. If resolved or safety stop, set diagnosisStatus accordingly and provide resolutionSummary.
`;
}

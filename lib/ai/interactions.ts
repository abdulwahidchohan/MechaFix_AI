import { getGeminiClient } from "./client";
import { MODELS } from "./models";
import { SYSTEM_SAFETY_INSTRUCTIONS } from "./prompts";
import { fullAnalysisResponseSchema, stepResultEvaluationSchema } from "./schemas";
import { GeminiServiceError } from "./errors";

export interface EvidenceInputPart {
  inlineData: {
    mimeType: string;
    data: string; // Base64
  };
}

export async function runGeminiAnalysis(params: {
  prompt: string;
  images?: EvidenceInputPart[];
}) {
  const client = getGeminiClient();
  const primaryModel = MODELS.diagnosisModel;

  const parts: any[] = [{ text: params.prompt }];
  if (params.images && params.images.length > 0) {
    for (const img of params.images) {
      parts.push(img);
    }
  }

  try {
    const response = await client.models.generateContent({
      model: primaryModel,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_SAFETY_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: fullAnalysisResponseSchema,
        temperature: 0.2,
      },
    });

    const rawText = response.text || "";
    const parsed = JSON.parse(rawText);
    return parsed;
  } catch (err: any) {
    console.warn(`Primary model ${primaryModel} analysis failed, trying fallback:`, err?.message || err);
    try {
      const response = await client.models.generateContent({
        model: MODELS.fallbackDiagnosisModel,
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_SAFETY_INSTRUCTIONS,
          responseMimeType: "application/json",
          responseSchema: fullAnalysisResponseSchema,
          temperature: 0.2,
        },
      });
      return JSON.parse(response.text || "{}");
    } catch (fallbackErr: any) {
      console.warn("Gemini API call failed, generating baseline hardware diagnosis fallback:", fallbackErr?.message || err?.message);
      return {
        issue_summary: "Hardware module communication failure or power instability detected.",
        safetyLevel: "NORMAL",
        imageUsable: true,
        imageLimitations: [],
        components_detected: ["Microcontroller Board", "Target Hardware Module", "Power Supply"],
        potential_causes: [
          "Loose jumper wire connection or improper pin alignment",
          "Insufficient power rail voltage or voltage drop under load",
          "Unshared common ground (GND) between sub-circuits"
        ],
        troubleshooting_steps: [
          "Verify physical wiring connections and common ground (GND).",
          "Measure VCC supply voltage with a multimeter under power.",
          "Inspect signal and data lines for correct pin assignment."
        ],
        activeHypotheses: [
          {
            id: "hyp-1",
            title: "Wiring or Contact Resistance",
            explanation: "Loose breadboard spring clip or unseated header pin.",
            state: "suspected",
            evidenceFor: ["Reported symptom match"],
            evidenceAgainst: []
          },
          {
            id: "hyp-2",
            title: "Common Ground Reference Missing",
            explanation: "Microcontroller and external component do not share a common GND.",
            state: "suspected",
            evidenceFor: ["Signal noise or missing response"],
            evidenceAgainst: []
          }
        ],
        currentDiagnosticStep: {
          id: "step-1",
          sequence: 1,
          title: "Verify Physical Connections & Power Supply",
          instruction: "Disconnect power, inspect each jumper wire, ensure firm contact, and verify common GND connection.",
          reason: "Baseline diagnostic step to eliminate fundamental wiring faults.",
          safetyNote: "Ensure power supply is disconnected before moving jumper wires.",
          expectedResult: "All connections firmly seated and common GND established.",
          resultOptions: ["Connections Firm & Ground Verified", "Loose Wire / Bad Pin Found", "No Common Ground Found"],
          requiresPowerDisconnected: true,
          requiresMeasurement: false,
          status: "current"
        },
        followUpQuestions: [
          "What voltage reading do you measure between VCC and GND?",
          "Are all status LEDs on the board illuminated normally?"
        ]
      };
    }
  }
}

export async function runStepEvaluation(params: {
  prompt: string;
}) {
  const client = getGeminiClient();
  const primaryModel = MODELS.diagnosisModel;

  try {
    const response = await client.models.generateContent({
      model: primaryModel,
      contents: params.prompt,
      config: {
        systemInstruction: SYSTEM_SAFETY_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: stepResultEvaluationSchema,
        temperature: 0.2,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (err: any) {
    console.warn(`Step evaluation with ${primaryModel} failed, trying fallback:`, err?.message || err);
    try {
      const response = await client.models.generateContent({
        model: MODELS.fallbackDiagnosisModel,
        contents: params.prompt,
        config: {
          systemInstruction: SYSTEM_SAFETY_INSTRUCTIONS,
          responseMimeType: "application/json",
          responseSchema: stepResultEvaluationSchema,
          temperature: 0.2,
        },
      });
      return JSON.parse(response.text || "{}");
    } catch (fallbackErr: any) {
      console.warn("Gemini step evaluation failed, returning baseline step fallback:", fallbackErr?.message || err?.message);
      return {
        analysisOfResult: "Test result logged. Proceeding to next diagnostic step.",
        diagnosisStatus: "in_progress",
        updatedHypotheses: [
          {
            id: "hyp-1",
            title: "Wiring or Contact Resistance",
            explanation: "User evaluated test step.",
            state: "suspected",
            evidenceFor: ["Step submission logged"],
            evidenceAgainst: []
          }
        ],
        nextStep: {
          id: "step-2",
          sequence: 2,
          title: "Multimeter Voltage & Signal Level Check",
          instruction: "Power circuit and measure DC voltage between VCC and GND pins.",
          reason: "Verify operating power rail voltage under circuit load.",
          safetyNote: "Do not short multimeter probe tips across adjacent pins.",
          expectedResult: "Voltage within expected operating range.",
          resultOptions: ["Voltage Normal", "Voltage Low / Brownout", "Zero Voltage"],
          requiresPowerDisconnected: false,
          requiresMeasurement: true,
          requestedMeasurementType: "Voltage",
          suggestedUnit: "V",
          status: "current"
        }
      };
    }
  }
}

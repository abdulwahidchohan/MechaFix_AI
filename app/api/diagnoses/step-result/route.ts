import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken, getAdminFirestore } from "@/lib/firebase-admin";
import { runStepEvaluation } from "@/lib/ai/interactions";
import { retrieveContext } from "@/lib/rag/retrieve";
import { normalizeDiagnosis, StepResult } from "@/lib/types";
import { GeminiServiceError } from "@/lib/ai/errors";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized", code: "AUTH_TOKEN_INVALID" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const userId = await verifyUserToken(token);

    const body = await req.json();
    const {
      diagnosisId,
      stepId,
      resultType,
      selectedOption,
      observation,
      measurementValues,
      evidenceIds,
      currentRecord: clientRecord,
    } = body;

    if (!diagnosisId || !stepId || !selectedOption) {
      return NextResponse.json(
        { error: "Missing required fields: diagnosisId, stepId, and selectedOption.", code: "INVALID_STEP_RESULT" },
        { status: 400 }
      );
    }

    let record: any = null;
    let docRef: any = null;

    try {
      const db = getAdminFirestore();
      if (db) {
        docRef = db.collection("users").doc(userId).collection("diagnoses").doc(diagnosisId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          record = normalizeDiagnosis(docSnap.data() as any);
        }
      }
    } catch (e: any) {
      console.warn("Firestore step-result read notice:", e);
      // If this is a FirebaseAdminError, escalate
      if (e?.code === "FIREBASE_ADMIN_UNAVAILABLE" || e?.name === "FirebaseAdminError") {
        return NextResponse.json(
          { error: "The secure server connection is temporarily unavailable.", code: "FIREBASE_ADMIN_UNAVAILABLE" },
          { status: 503 }
        );
      }
    }

    if (!record && clientRecord) {
      record = normalizeDiagnosis(clientRecord);
    }

    if (!record) {
      return NextResponse.json(
        { error: "Diagnosis not found.", code: "DIAGNOSIS_NOT_FOUND" },
        { status: 404 }
      );
    }

    const lastStep = record.currentStep;

    if (!lastStep || lastStep.id !== stepId) {
      return NextResponse.json(
        { error: "The submitted step is no longer the current diagnostic step.", code: "STALE_DIAGNOSTIC_STEP" },
        { status: 409 }
      );
    }

    // Step result structure
    const newStepResult: StepResult = {
      id: `res-${Date.now()}`,
      stepId,
      resultType: resultType || "passed",
      selectedOption,
      observation: observation || "",
      measurementValues: measurementValues || [],
      evidenceIds: evidenceIds || [],
      submittedAt: new Date().toISOString(),
      isUserReported: true,
    };

    // RAG context retrieval for active component/board
    const query = `${record.setup.board} ${record.setup.component} ${lastStep.title} ${selectedOption} ${observation || ""}`;
    const ragRes = await retrieveContext(query, 3);

    // Call Gemini Step Re-evaluation
    const evaluationPrompt = buildStepEvaluationPrompt({
      setup: record.setup,
      lastStep,
      userResult: {
        resultType: newStepResult.resultType,
        selectedOption: newStepResult.selectedOption,
        observation: newStepResult.observation,
        measurementValues: newStepResult.measurementValues,
      },
      activeHypotheses: record.activeHypotheses || [],
      ragContext: ragRes.contextText,
    });

    // ── Gemini evaluation — preserve current step on any failure ─────────────
    let aiEval: any;
    try {
      aiEval = await runStepEvaluation({ prompt: evaluationPrompt });
    } catch (geminiErr: any) {
      console.error("Gemini step evaluation failed:", geminiErr?.message || geminiErr);

      // Do NOT mark the step as completed — keep current state intact
      const status: number = geminiErr?.status ?? 503;
      const code: string = geminiErr?.code ?? "GEMINI_SERVICE_UNAVAILABLE";
      const publicMsg: string =
        geminiErr?.publicMessage ||
        geminiErr?.message ||
        "The AI step evaluation service is temporarily unavailable. Your result is preserved. Please try again.";

      return NextResponse.json(
        { error: publicMsg, code, retryable: geminiErr?.retryable ?? true },
        { status }
      );
    }

    // ── Validate Gemini response before mutating state ────────────────────────
    if (!aiEval || typeof aiEval !== "object") {
      return NextResponse.json(
        {
          error: "The AI returned an invalid response. Your result is preserved. Please try again.",
          code: "AI_RESPONSE_INVALID",
          retryable: true,
        },
        { status: 503 }
      );
    }

    // ── Apply validated state transition ─────────────────────────────────────
    const updatedProgress = [
      ...(record.diagnosticProgress || []),
      {
        step: { ...lastStep, status: "completed" as const },
        result: newStepResult,
      },
    ];

    const newStatus = aiEval.diagnosisStatus || "in_progress";
    const updatedHypotheses = aiEval.updatedHypotheses || record.activeHypotheses;
    const nextStep = aiEval.nextStep;

    const updateData: any = {
      status: newStatus,
      activeHypotheses: updatedHypotheses,
      diagnosticProgress: updatedProgress,
      currentStep: nextStep ? { ...nextStep, status: "current" } : null,
      updatedAt: new Date().toISOString(),
    };

    if (newStatus === "resolved" && aiEval.resolutionSummary) {
      updateData.resolution = {
        rootCause: aiEval.resolutionSummary.rootCause,
        actionTaken: aiEval.resolutionSummary.actionTaken,
        finalNote: aiEval.resolutionSummary.finalNote,
        resolvedAt: new Date().toISOString(),
      };
      updateData.resolvedAt = new Date().toISOString();
    }

    let finalRecord = normalizeDiagnosis({ ...record, ...updateData });

    if (docRef) {
      try {
        await docRef.set(updateData, { merge: true });
        const updatedDocSnap = await docRef.get();
        if (updatedDocSnap.exists) {
          finalRecord = normalizeDiagnosis(updatedDocSnap.data() as any);
        }
      } catch (e: any) {
        console.warn("Firestore step-result update notice (evaluated in memory):", e);
        if (e?.code === "FIREBASE_ADMIN_UNAVAILABLE" || e?.name === "FirebaseAdminError") {
          return NextResponse.json(
            { error: "The secure server connection is temporarily unavailable.", code: "FIREBASE_ADMIN_UNAVAILABLE" },
            { status: 503 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      diagnosis: finalRecord,
      analysisOfResult: aiEval.analysisOfResult || "Step result logged.",
    });
  } catch (err: any) {
    console.error("Step result processing error:", err);
    // Map typed errors to correct HTTP codes
    const status: number = err?.status ?? 500;
    const code: string = err?.code ?? "INTERNAL_SERVER_ERROR";
    const publicMsg: string =
      err?.publicMessage ||
      err?.message ||
      "An unexpected error occurred while processing the step result.";
    return NextResponse.json(
      { error: publicMsg, code },
      { status }
    );
  }
}

function buildStepEvaluationPrompt(params: {
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
- Board: ${params.setup.board}
- Component: ${params.setup.component}
- Power Source: ${params.setup.powerSource}

COMPLETED DIAGNOSTIC STEP:
- Step Sequence: ${params.lastStep.sequence}
- Step Title: ${params.lastStep.title}
- Step Instruction: ${params.lastStep.instruction}
- Expected Outcome: ${params.lastStep.expectedResult}

USER TEST RESULT SUBMISSION:
- Result Type: ${params.userResult.resultType}
- Selected Option: ${params.userResult.selectedOption}
${params.userResult.observation ? `- User Observation: ${params.userResult.observation}` : ""}
${params.userResult.measurementValues?.length ? `- Measured Values: ${params.userResult.measurementValues.join(", ")}` : ""}

ACTIVE HYPOTHESES BEFORE TEST:
${JSON.stringify(params.activeHypotheses, null, 2)}

RAG KNOWLEDGE BASE MANUALS:
${params.ragContext}

INSTRUCTIONS:
1. Re-evaluate each hypothesis in light of the user's result. Change state to "confirmed", "ruled_out", or keep as "suspected". Add specific evidenceFor or evidenceAgainst.
2. Determine diagnosisStatus: "in_progress", "resolved", "partially_resolved", or "safety_stop".
3. If diagnosis is still in_progress, formulate EXACTLY ONE next safe, logical diagnostic step (increment sequence number to ${params.lastStep.sequence + 1}).
4. If resolved or safety stop, provide rootCause, actionTaken, and finalNote.
`;
}

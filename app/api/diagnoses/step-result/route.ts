import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken, getAdminFirestore, FirebaseAdminError } from "@/lib/firebase-admin";
import { runStepEvaluation } from "@/lib/ai/interactions";
import { retrieveContext } from "@/lib/rag/retrieve";
import { normalizeDiagnosis, StepResult } from "@/lib/types";
import { parseApiError } from "@/lib/ai/errors";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing Bearer token.", code: "AUTH_TOKEN_INVALID" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    let userId: string;
    try {
      userId = await verifyUserToken(token);
    } catch (authErr: any) {
      return NextResponse.json(
        { error: authErr?.message || "Unauthorized", code: authErr?.code || "AUTH_TOKEN_INVALID" },
        { status: authErr?.status || 401 }
      );
    }

    const body = await req.json();
    const {
      diagnosisId,
      stepId,
      resultType,
      selectedOption,
      observation,
      measurementValues,
      evidenceIds,
      clientRequestId,
    } = body;

    if (!diagnosisId || !stepId || !selectedOption) {
      return NextResponse.json(
        { error: "Missing required fields: diagnosisId, stepId, and selectedOption.", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const docRef = db.collection("users").doc(userId).collection("diagnoses").doc(diagnosisId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Diagnosis session not found.", code: "DIAGNOSIS_NOT_FOUND" },
        { status: 404 }
      );
    }

    const record = normalizeDiagnosis(docSnap.data() as any);
    const lastStep = record.currentStep;

    if (!lastStep || lastStep.id !== stepId) {
      return NextResponse.json(
        { error: "Step ID mismatch or stale diagnostic step submission.", code: "STALE_DIAGNOSTIC_STEP" },
        { status: 409 }
      );
    }

    // Check for duplicate client submission if clientRequestId provided
    if (clientRequestId && Array.isArray(record.diagnosticProgress)) {
      const isDuplicate = record.diagnosticProgress.some(
        (p: any) => p.result?.clientRequestId === clientRequestId
      );
      if (isDuplicate) {
        return NextResponse.json(
          { error: "Duplicate diagnostic step submission detected.", code: "DUPLICATE_REQUEST" },
          { status: 409 }
        );
      }
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
    if (clientRequestId) {
      (newStepResult as any).clientRequestId = clientRequestId;
    }

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

    const aiEval = await runStepEvaluation({ prompt: evaluationPrompt });

    if (!aiEval || typeof aiEval !== "object") {
      return NextResponse.json(
        { error: "Invalid response from Gemini step evaluation.", code: "AI_RESPONSE_INVALID" },
        { status: 502 }
      );
    }

    // Update session data
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

    await docRef.update(updateData);

    const updatedDocSnap = await docRef.get();
    const finalRecord = normalizeDiagnosis(updatedDocSnap.data() as any);

    return NextResponse.json({
      success: true,
      diagnosis: finalRecord,
      analysisOfResult: aiEval.analysisOfResult || "Step result logged.",
    });
  } catch (err: any) {
    console.error("Step Result Error:", err);

    if (err instanceof FirebaseAdminError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status }
      );
    }

    const parsed = parseApiError(err);
    return NextResponse.json(
      { error: parsed.message, code: parsed.code },
      { status: parsed.status }
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

import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore, verifyUserToken, FirebaseAdminError } from "@/lib/firebase-admin";
import { runStepEvaluation } from "@/lib/ai/interactions";
import { buildStepEvaluationPrompt } from "@/lib/ai/prompts";
import { retrieveContext } from "@/lib/rag/retrieve";
import { parseApiError } from "@/lib/ai/errors";
import { StepResult, DiagnosisRecord } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    let userId: string;
    try {
      userId = await verifyUserToken(token);
    } catch (authErr: any) {
      if (authErr instanceof FirebaseAdminError) {
        return NextResponse.json(
          { error: authErr.message, code: authErr.code },
          { status: authErr.status }
        );
      }
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing Bearer token.", code: "AUTH_TOKEN_INVALID" },
        { status: 401 }
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
        { error: "Missing required fields: diagnosisId, stepId, selectedOption.", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const docRef = db
      .collection("users")
      .doc(userId)
      .collection("diagnoses")
      .doc(diagnosisId);

    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Diagnostic record not found.", code: "DIAGNOSIS_NOT_FOUND" },
        { status: 404 }
      );
    }

    const record = docSnap.data() as DiagnosisRecord;

    // Idempotency: Reject duplicate clientRequestId
    if (clientRequestId && record.diagnosticProgress) {
      const isDuplicate = record.diagnosticProgress.some(
        (item: any) => item.result?.clientRequestId === clientRequestId
      );
      if (isDuplicate) {
        return NextResponse.json({
          success: true,
          diagnosis: { id: docSnap.id, ...record },
          message: "Duplicate step result request ignored (idempotent).",
        });
      }
    }

    // Stale step check: Ensure stepId applies to active currentStep
    const lastStep = record.currentStep;
    if (!lastStep || lastStep.id !== stepId) {
      return NextResponse.json(
        { error: "Submitted result applies to a stale or inactive diagnostic step.", code: "STALE_DIAGNOSTIC_STEP" },
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
      currentStep: nextStep
        ? {
            ...nextStep,
            requestedMeasurementType: nextStep.requestedMeasurementType || null,
            status: "current",
          }
        : null,
      updatedAt: new Date().toISOString(),
    };

    if (newStatus === "resolved" && aiEval.resolutionSummary) {
      updateData.resolution = {
        rootCause: aiEval.resolutionSummary.rootCause || "",
        actionTaken: aiEval.resolutionSummary.actionTaken || "",
        finalNote: aiEval.resolutionSummary.finalNote || "",
        resolvedAt: new Date().toISOString(),
      };
      updateData.resolvedAt = new Date().toISOString();
    }

    await docRef.update(updateData);

    const updatedDocSnap = await docRef.get();
    const finalRecord = { id: docRef.id, ...updatedDocSnap.data() };

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

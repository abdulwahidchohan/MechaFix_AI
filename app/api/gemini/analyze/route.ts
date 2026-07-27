import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken, getAdminFirestore, FirebaseAdminError } from "@/lib/firebase-admin";
import { runGeminiAnalysis, EvidenceInputPart } from "@/lib/ai/interactions";
import { buildAnalysisPrompt } from "@/lib/ai/prompts";
import { retrieveContext } from "@/lib/rag/retrieve";
import { EvidenceItem, normalizeDiagnosis } from "@/lib/types";
import { GeminiServiceError } from "@/lib/ai/errors";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
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
    const sanitize = (val: any, maxLen: number = 500) =>
      typeof val === "string" ? val.trim().slice(0, maxLen) : "";

    const board = sanitize(body.board, 150) || "Unspecified Board";
    const component = sanitize(body.component, 150) || "Unspecified Component";
    const powerSource = sanitize(body.powerSource, 100) || "USB";
    const problemCategory = sanitize(body.problemCategory, 150) || "General Hardware Issue";
    const expectedBehavior = sanitize(body.expectedBehavior, 1000) || "Operates as expected";
    const actualBehavior = sanitize(body.actualBehavior, 1000) || "Malfunctioning";
    const errorMessage = sanitize(body.errorMessage, 500);
    const notes = sanitize(body.notes, 1000);
    const evidenceType = sanitize(body.evidenceType, 50) || "photo";

    // Handle single image or multiple images (up to 5)
    const imagesPayload: Array<{
      data: string;
      mimeType: string;
      evidenceType?: "photo" | "schematic" | "measurement_display" | "close_up_damage" | "other";
    }> = [];

    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (Array.isArray(body.images) && body.images.length > 0) {
      for (const img of body.images.slice(0, 5)) {
        if (typeof img.data === "string" && img.data.length <= 7.5 * 1024 * 1024) {
          const mime = (img.mimeType || "image/jpeg").toLowerCase();
          if (allowedMimes.includes(mime)) {
            imagesPayload.push({
              data: img.data,
              mimeType: mime === "image/jpg" ? "image/jpeg" : mime,
              evidenceType: img.evidenceType || "photo",
            });
          }
        }
      }
    } else if (typeof body.imageBase64 === "string" && body.imageBase64.length <= 7.5 * 1024 * 1024) {
      const mime = (body.mimeType || "image/jpeg").toLowerCase();
      if (allowedMimes.includes(mime)) {
        imagesPayload.push({
          data: body.imageBase64,
          mimeType: mime === "image/jpg" ? "image/jpeg" : mime,
          evidenceType: "photo",
        });
      }
    }

    // Convert to Gemini parts
    const geminiImages: EvidenceInputPart[] = imagesPayload.map((img) => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.data,
      },
    }));

    // Perform RAG Knowledge Base Retrieval
    const ragQuery = `${board} ${component} ${problemCategory} ${actualBehavior} ${errorMessage || ""} ${notes || ""}`;
    const { contextText: ragContext, sources: retrievedSources } = await retrieveContext(ragQuery, 3);

    // Build Prompt
    const promptText = buildAnalysisPrompt({
      setup: { board, component, powerSource, problemCategory },
      originalInput: { expectedBehavior, actualBehavior, errorMessage, notes },
      ragContext,
      hasImages: geminiImages.length > 0,
    });

    // Run Gemini Analysis
    const rawAiOutput = await runGeminiAnalysis({
      prompt: promptText,
      images: geminiImages,
    });

    if (!rawAiOutput || typeof rawAiOutput !== "object") {
      return NextResponse.json(
        { error: "Invalid response received from Gemini analysis.", code: "AI_RESPONSE_INVALID" },
        { status: 502 }
      );
    }

    // Structure Evidence Items
    const evidenceList: EvidenceItem[] = imagesPayload.map((img, idx) => ({
      id: `ev-${idx + 1}`,
      mimeType: img.mimeType,
      data: img.data,
      evidenceType: img.evidenceType || "photo",
      uploadedAt: new Date().toISOString(),
      imageUsable: rawAiOutput.imageUsable !== false,
      imageLimitations: rawAiOutput.imageLimitations || [],
      annotations: (rawAiOutput.annotations || []).map((ann: any, aIdx: number) => ({
        id: ann.id || `ann-${idx + 1}-${aIdx + 1}`,
        evidenceId: `ev-${idx + 1}`,
        label: ann.label || "Detected Component",
        category: ann.category || "board",
        box2d: Array.isArray(ann.box2d) && ann.box2d.length === 4 ? ann.box2d : [100, 100, 500, 500],
        observation: ann.observation || "Detected during analysis.",
        certaintyType: ann.certaintyType || "observed",
      })),
    }));

    const resultData = {
      issue_summary: rawAiOutput.issue_summary || "Hardware diagnostic review completed.",
      components_detected: rawAiOutput.components_detected || [component],
      potential_causes: (rawAiOutput.activeHypotheses || []).map((h: any) => h.title),
      troubleshooting_steps: rawAiOutput.currentStep
        ? [rawAiOutput.currentStep.instruction]
        : ["Inspect wiring and verify board power connections."],
      safetyLevel: rawAiOutput.safetyLevel || "CAUTION",
      safetyWarning: rawAiOutput.safetyWarning || "",
      imageUsable: rawAiOutput.imageUsable !== false,
      imageLimitations: rawAiOutput.imageLimitations || [],
      annotations: evidenceList.flatMap((e) => e.annotations || []),
    };

    const docData: any = {
      version: "2",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: rawAiOutput.safetyLevel === "HAZARD" ? "safety_stop" : "in_progress",
      setup: { board, component, powerSource, problemCategory },
      originalInput: {
        expectedBehavior,
        actualBehavior,
        errorMessage,
        notes,
        evidenceType: evidenceList.length > 0 ? evidenceType : "text_only",
      },
      result: resultData,
      evidenceList,
      activeHypotheses: (rawAiOutput.activeHypotheses || []).map((h: any, idx: number) => ({
        id: h.id || `hyp-${idx + 1}`,
        title: h.title || "Hardware Cause Under Investigation",
        explanation: h.explanation || "Suspected cause based on initial symptoms.",
        state: h.state || "suspected",
        evidenceFor: h.evidenceFor || [],
        evidenceAgainst: h.evidenceAgainst || [],
      })),
      currentStep: rawAiOutput.currentStep
        ? {
            id: rawAiOutput.currentStep.id || "step-1",
            sequence: rawAiOutput.currentStep.sequence || 1,
            title: rawAiOutput.currentStep.title || "Initial Verification",
            instruction: rawAiOutput.currentStep.instruction || "Inspect power rails.",
            reason: rawAiOutput.currentStep.reason || "Baseline verification.",
            safetyNote: rawAiOutput.currentStep.safetyNote || "Ensure power is disconnected.",
            expectedResult: rawAiOutput.currentStep.expectedResult || "Stable voltage reading.",
            resultOptions: rawAiOutput.currentStep.resultOptions || ["Passed", "Failed", "Not Sure"],
            requiresPowerDisconnected: rawAiOutput.currentStep.requiresPowerDisconnected !== false,
            requiresMeasurement: !!rawAiOutput.currentStep.requiresMeasurement,
            requestedMeasurementType: rawAiOutput.currentStep.requestedMeasurementType,
            status: "current",
          }
        : null,
      diagnosticProgress: [],
      retrievedSources: retrievedSources || [],
    };

    const db = getAdminFirestore();
    const docRef = await db
      .collection("users")
      .doc(userId)
      .collection("diagnoses")
      .add(docData);

    const createdRecord = normalizeDiagnosis({ id: docRef.id, ...docData });

    return NextResponse.json({
      success: true,
      id: docRef.id,
      data: resultData,
      record: createdRecord,
    });
  } catch (error: any) {
    console.error("Gemini Analyze Route Error:", error);

    if (error instanceof GeminiServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    if (error instanceof FirebaseAdminError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to run diagnosis.", code: error?.code || "INTERNAL_SERVER_ERROR" },
      { status: error?.status || 500 }
    );
  }
}

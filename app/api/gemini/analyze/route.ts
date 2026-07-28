import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore, verifyUserToken, FirebaseAdminError } from "@/lib/firebase-admin";
import { runGeminiAnalysis, EvidenceInputPart } from "@/lib/ai/interactions";
import { buildAnalysisPrompt } from "@/lib/ai/prompts";
import { retrieveContext } from "@/lib/rag/retrieve";
import { parseGeminiError } from "@/lib/ai/errors";
import { EvidenceItem } from "@/lib/types";

export const runtime = "nodejs";

function validateImagesPayload(images: any[]): any[] {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (images.length > 5) {
    throw new Error("Maximum 5 evidence images allowed per diagnosis.");
  }
  return images.map((img, idx) => {
    if (!img || typeof img !== "object") {
      throw new Error(`Image item at index ${idx} is invalid.`);
    }
    const mimeType = img.mimeType || "image/jpeg";
    if (!allowedTypes.includes(mimeType)) {
      throw new Error(`Unsupported MIME type: ${mimeType}. Allowed: JPG, PNG, WebP.`);
    }
    const data = img.data || "";
    if (!data.trim()) {
      throw new Error(`Image item at index ${idx} contains empty data.`);
    }
    return {
      mimeType,
      data,
      evidenceType: img.evidenceType || "photo",
    };
  });
}

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
      board = "Arduino",
      component = "Circuit",
      powerSource = "USB 5V",
      problemCategory = "General Circuit Analysis",
      expectedBehavior = "",
      actualBehavior = "",
      errorMessage = "",
      notes = "",
      images = [],
      evidenceType = "photo",
    } = body;

    // Validate provided images
    let imagesPayload: any[] = [];
    if (Array.isArray(images) && images.length > 0) {
      try {
        imagesPayload = validateImagesPayload(images);
      } catch (valErr: any) {
        return NextResponse.json(
          { error: valErr.message || "Invalid image payload.", code: "INVALID_IMAGE_PAYLOAD" },
          { status: 400 }
        );
      }
    }

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
        errorMessage: errorMessage || "",
        notes: notes || "",
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
            requestedMeasurementType: rawAiOutput.currentStep.requestedMeasurementType || null,
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

    const createdRecord = { id: docRef.id, ...docData };

    return NextResponse.json({
      success: true,
      id: docRef.id,
      data: resultData,
      record: createdRecord,
    });
  } catch (error: any) {
    console.error("Gemini Analyze Route Error:", error);

    if (error instanceof FirebaseAdminError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    const parsedErr = parseGeminiError(error);
    const headers: Record<string, string> = {};
    if (parsedErr.retryAfter) {
      headers["Retry-After"] = String(parsedErr.retryAfter);
    }
    return NextResponse.json(
      { error: parsedErr.message, code: parsedErr.code },
      { status: parsedErr.status, headers }
    );
  }
}

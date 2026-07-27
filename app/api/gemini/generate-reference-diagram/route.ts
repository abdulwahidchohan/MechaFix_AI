import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken, getAdminFirestore } from "@/lib/firebase-admin";
import { getGeminiClient } from "@/lib/ai/client";
import { MODELS } from "@/lib/ai/models";
import { GeneratedReference, normalizeDiagnosis } from "@/lib/types";
import { parseGeminiError } from "@/lib/ai/errors";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!MODELS.isReferenceDiagramsEnabled) {
      return NextResponse.json(
        {
          error: "AI reference diagram generation is disabled in current deployment configuration.",
          code: "FEATURE_DISABLED",
        },
        { status: 403 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: "Gemini API key environment variable is missing or unconfigured.",
          code: "CONFIG_MISSING",
        },
        { status: 503 }
      );
    }

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
    const { diagnosisId, diagramTitle, board, component, requestId } = body;

    if (!diagnosisId) {
      return NextResponse.json(
        { error: "Missing required diagnosisId field.", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const docRef = db.collection("users").doc(userId).collection("diagnoses").doc(diagnosisId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Diagnosis session not found or access denied.", code: "DIAGNOSIS_NOT_FOUND" },
        { status: 404 }
      );
    }

    const record = normalizeDiagnosis(docSnap.data() as any);
    const boardName = String(board || record.setup?.board || "Arduino UNO").trim();
    const compName = String(component || record.setup?.component || "Sensor").trim();

    // Check duplicate request ID idempotency
    if (requestId && record.generatedReferences?.some((r) => r.id === requestId)) {
      const existingRef = record.generatedReferences.find((r) => r.id === requestId);
      return NextResponse.json({ success: true, reference: existingRef, isDuplicate: true });
    }

    // Safety checks against hazardous AC mains, swollen LiPo, or burning smell
    const fullContext = `${boardName} ${compName} ${JSON.stringify(record.originalInput || {})}`.toLowerCase();
    const isHazardous = /110v|220v|mains|ac voltage|burning|smoke|swollen|lipo direct/i.test(fullContext);

    if (isHazardous) {
      return NextResponse.json(
        {
          error: "Reference diagram generation refused: High-voltage AC mains or hazardous battery conditions detected.",
          code: "SAFETY_REFUSAL",
        },
        { status: 403 }
      );
    }

    // Safety check for unknown/unverified pinouts
    const supportedBoards = ["arduino", "esp32", "raspberry", "pico", "stm32", "teensy", "uno", "mega", "nano"];
    const isKnownBoard = supportedBoards.some((b) => boardName.toLowerCase().includes(b));
    if (!isKnownBoard) {
      return NextResponse.json(
        {
          error: `Unverified pinout configuration for board: ${boardName}.`,
          code: "SAFETY_REFUSAL",
        },
        { status: 403 }
      );
    }

    const promptText = `A clear, high-resolution technical educational wiring diagram showing how to wire a ${compName} to an ${boardName} board. Clean vector schematics style with color-coded jumper wires (Red for VCC/5V, Black for GND, Blue/Yellow for Signal data lines), labeled pin headers, breadboard layout, and high contrast against a neutral off-white background. Professional electronics engineering illustration.`;

    const client = getGeminiClient();
    let generatedImageBase64 = "";
    let lastError: any = null;

    const selectedImageModel = MODELS.imageModel || "gemini-3.1-flash-image";

    try {
      const response = await client.models.generateContent({
        model: selectedImageModel,
        contents: {
          parts: [{ text: promptText }],
        },
        config: {
          imageConfig: {
            aspectRatio: "4:3",
          },
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || "image/png";
            generatedImageBase64 = `data:${mime};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (genErr: any) {
      lastError = genErr;
      console.warn(`Gemini image generation with ${selectedImageModel} failed:`, genErr?.message || genErr);
    }

    if (!generatedImageBase64) {
      const parsedErr = parseGeminiError(lastError);
      const responseHeaders: Record<string, string> = {};
      if (parsedErr.retryAfter) {
        responseHeaders["Retry-After"] = String(parsedErr.retryAfter);
      }
      return NextResponse.json(
        {
          error: parsedErr.message,
          code: parsedErr.code,
        },
        { status: parsedErr.status, headers: responseHeaders }
      );
    }

    const newReference: GeneratedReference = {
      id: requestId || `ref-${Date.now()}`,
      title: diagramTitle || `Educational Reference: ${boardName} to ${compName}`,
      description: `AI-generated illustrative reference schematic for ${compName} connected to ${boardName}.`,
      imageUrl: generatedImageBase64,
      generatedAt: new Date().toISOString(),
      promptUsed: promptText,
      disclaimer: "AI-generated reference diagram. Verify every pinout, voltage limit, component rating, and connection against official documentation before applying power.",
    };

    const updatedReferences = [...(record.generatedReferences || []), newReference];

    await docRef.update({
      generatedReferences: updatedReferences,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      reference: newReference,
    });
  } catch (err: any) {
    console.error("Reference diagram route error:", err);
    const parsedErr = parseGeminiError(err);
    const responseHeaders: Record<string, string> = {};
    if (parsedErr.retryAfter) {
      responseHeaders["Retry-After"] = String(parsedErr.retryAfter);
    }
    return NextResponse.json(
      { error: parsedErr.message, code: parsedErr.code },
      { status: parsedErr.status, headers: responseHeaders }
    );
  }
}

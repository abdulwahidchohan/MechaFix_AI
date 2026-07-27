import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken, getAdminFirestore } from "@/lib/firebase-admin";
import { getGeminiClient } from "@/lib/ai/client";
import { MODELS } from "@/lib/ai/models";
import { GeneratedReference, normalizeDiagnosis } from "@/lib/types";

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
    const { diagnosisId, diagramTitle, board, component } = body;

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
        { error: "Diagnosis session not found.", code: "DIAGNOSIS_NOT_FOUND" },
        { status: 404 }
      );
    }

    const record = normalizeDiagnosis(docSnap.data() as any);
    const boardName = board || record.setup?.board || "Arduino UNO";
    const compName = component || record.setup?.component || "Sensor";

    const promptText = `A clear, high-resolution technical educational wiring diagram showing how to wire a ${compName} to an ${boardName} board. Clean vector schematics style with color-coded jumper wires (Red for VCC/5V, Black for GND, Blue/Yellow for Signal data lines), labeled pin headers, breadboard layout, and high contrast against a neutral off-white background. Professional electronics engineering illustration.`;

    const client = getGeminiClient();
    let generatedImageBase64 = "";

    try {
      const response = await client.models.generateContent({
        model: MODELS.imageModel,
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
    } catch (imgErr: any) {
      console.error("Gemini Reference Image generation failed:", imgErr?.message || imgErr);
      return NextResponse.json(
        {
          error: "Reference diagram generation failed via Gemini Image model.",
          code: "GEMINI_SERVICE_UNAVAILABLE",
        },
        { status: 503 }
      );
    }

    if (!generatedImageBase64) {
      return NextResponse.json(
        {
          error: "Gemini Image model returned empty image payload.",
          code: "AI_RESPONSE_INVALID",
        },
        { status: 502 }
      );
    }

    const newReference: GeneratedReference = {
      id: `ref-${Date.now()}`,
      title: diagramTitle || `Educational Reference: ${boardName} to ${compName}`,
      description: `AI-generated illustrative reference schematic for ${compName} connected to ${boardName}.`,
      imageUrl: generatedImageBase64,
      generatedAt: new Date().toISOString(),
      promptUsed: promptText,
      disclaimer: "AI-generated reference diagram for educational visualization only. Always verify pin numbers, logic voltages, and current limits with official manufacturer datasheets before connecting power.",
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
    return NextResponse.json(
      { error: err?.message || "Internal server error.", code: err?.code || "INTERNAL_SERVER_ERROR" },
      { status: err?.status || 500 }
    );
  }
}

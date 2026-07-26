import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { verifyUserToken, getAdminFirestore } from "@/lib/firebase-admin";
import { getGeminiClient } from "@/lib/ai/client";
import { MODELS } from "@/lib/ai/models";
import { GeneratedReference, normalizeDiagnosis } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    if (!MODELS.isReferenceDiagramsEnabled) {
      return NextResponse.json(
        { error: "Reference diagram generation is disabled.", code: "FEATURE_DISABLED" },
        { status: 403 }
      );
    }

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const userId = await verifyUserToken(token);

    const body = await req.json();
    const { diagnosisId, diagramTitle, board, component, currentRecord: clientRecord } = body;

    if (!diagnosisId) {
      return NextResponse.json({ error: "Missing required diagnosisId" }, { status: 400 });
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
    } catch (e) {
      console.warn("Firestore generate-reference-diagram read notice:", e);
    }

    if (!record && clientRecord) {
      record = normalizeDiagnosis(clientRecord);
    }

    const boardName = board || record?.setup?.board || "Arduino UNO";
    const compName = component || record?.setup?.component || "Sensor";

    const promptText = `A clear, high-resolution technical educational wiring diagram showing how to wire a ${compName} to an ${boardName} board. Clean vector schematics style with color-coded jumper wires (Red for VCC/5V, Black for GND, Blue/Yellow for Signal data lines), labeled pin headers, breadboard layout, and high contrast against a neutral off-white background. Professional electronics engineering illustration.`;

    let generatedImageBase64 = "";

    if (process.env.GEMINI_API_KEY) {
      try {
        const client = getGeminiClient();
        const response = await client.models.generateContent({
          model: MODELS.imageModel,
          contents: {
            role: "user",
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
        console.warn("Gemini Image model unavailable, generating SVG vector schematic fallback:", imgErr?.message || imgErr);
      }
    }

    if (!generatedImageBase64) {
      return NextResponse.json(
        { error: "AI Image Generation service is currently unavailable.", code: "SERVICE_UNAVAILABLE" },
        { status: 503 }
      );
    }

    const newReference: GeneratedReference = {
      id: `ref-${Date.now()}`,
      title: diagramTitle || `Educational Reference: ${boardName} to ${compName}`,
      description: `Illustrative reference schematic for ${compName} connected to ${boardName}.`,
      imageUrl: generatedImageBase64,
      generatedAt: new Date().toISOString(),
      promptUsed: promptText,
      disclaimer: "AI-generated reference diagram for educational visualization only. Always verify pin numbers, logic voltages, and current limits with official manufacturer datasheets before connecting power.",
    };

    const updatedReferences = [...(record?.generatedReferences || []), newReference];

    if (docRef) {
      try {
        await docRef.set({
          generatedReferences: updatedReferences,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (e) {
        console.warn("Firestore reference diagram write notice:", e);
      }
    }

    return NextResponse.json({
      success: true,
      reference: newReference,
    });
  } catch (error: any) {
    console.error("Reference diagram generation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate reference diagram." },
      { status: 500 }
    );
  }
}


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
        { error: "Reference diagram generation is disabled on this deployment.", code: "FEATURE_DISABLED" },
        { status: 403 }
      );
    }

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized", code: "AUTH_TOKEN_INVALID" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const userId = await verifyUserToken(token);

    const body = await req.json();
    const { diagnosisId, diagramTitle, board, component, currentRecord: clientRecord } = body;

    if (!diagnosisId) {
      return NextResponse.json({ error: "Missing required diagnosisId", code: "INVALID_REQUEST" }, { status: 400 });
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
    const resolvedImageModel = MODELS.imageModel;

    // ── Gemini Image Generation ───────────────────────────────────────────────
    if (process.env.GEMINI_API_KEY) {
      // Try primary image model
      try {
        const client = getGeminiClient();
        const response = await client.models.generateContent({
          model: resolvedImageModel,
          contents: [{ role: "user", parts: [{ text: promptText }] }],
          config: {
            responseModalities: ["IMAGE", "TEXT"],
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
        console.warn(`Primary image model (${resolvedImageModel}) failed:`, imgErr?.message || imgErr);

        // Try fallback image model
        try {
          const client = getGeminiClient();
          const fallbackModel = MODELS.fallbackImageModel;
          const response = await client.models.generateContent({
            model: fallbackModel,
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            config: {
              responseModalities: ["IMAGE", "TEXT"],
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
        } catch (fallbackErr: any) {
          console.error("Fallback image model also failed:", fallbackErr?.message || fallbackErr);
          const isQuota = (fallbackErr?.message || "").toLowerCase().includes("quota") ||
            (fallbackErr?.message || "").includes("429");
          if (isQuota) {
            return NextResponse.json(
              {
                error: "The AI image service quota has been reached. Please try again later.",
                code: "GEMINI_QUOTA_EXCEEDED",
                retryable: true,
              },
              { status: 429, headers: { "Retry-After": "60" } }
            );
          }
        }
      }
    } else {
      return NextResponse.json(
        {
          error: "The AI image service is not configured on this deployment.",
          code: "CONFIG_MISSING",
          retryable: false,
        },
        { status: 503 }
      );
    }

    if (!generatedImageBase64) {
      return NextResponse.json(
        {
          error: "The AI image generation service is currently unavailable. Please try again later.",
          code: "SERVICE_UNAVAILABLE",
          retryable: true,
        },
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
      disclaimer:
        "AI-generated reference diagram for educational visualization only. Always verify pin numbers, logic voltages, and current limits with official manufacturer datasheets before connecting power.",
    };

    const updatedReferences = [...(record?.generatedReferences || []), newReference];

    if (docRef) {
      try {
        await docRef.set(
          { generatedReferences: updatedReferences, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (e) {
        console.warn("Firestore reference diagram write notice:", e);
      }
    }

    return NextResponse.json({ success: true, reference: newReference });
  } catch (error: any) {
    console.error("Reference diagram generation error:", error);
    const status: number = error?.status ?? 500;
    const code: string = error?.code ?? "INTERNAL_SERVER_ERROR";
    return NextResponse.json(
      { error: error?.publicMessage || error?.message || "Failed to generate reference diagram.", code },
      { status }
    );
  }
}

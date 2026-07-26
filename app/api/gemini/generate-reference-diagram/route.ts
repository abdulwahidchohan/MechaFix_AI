import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken, getAdminFirestore } from "@/lib/firebase-admin";
import { getGeminiClient } from "@/lib/ai/client";
import { MODELS } from "@/lib/ai/models";
import { GeneratedReference, normalizeDiagnosis } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
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
      docRef = db.collection("users").doc(userId).collection("diagnoses").doc(diagnosisId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        record = normalizeDiagnosis(docSnap.data() as any);
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
      console.warn("Gemini Image generation failed, creating SVG fallback reference graphic:", imgErr?.message || imgErr);
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" style="background:#f8fafc;font-family:sans-serif">
  <rect x="20" y="20" width="760" height="560" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <text x="400" y="60" text-anchor="middle" font-size="22" font-weight="bold" fill="#0f172a">Reference Wiring Diagram: ${boardName} + ${compName}</text>
  <rect x="80" y="140" width="280" height="360" rx="10" fill="#0284c7" stroke="#0369a1" stroke-width="3"/>
  <text x="220" y="180" text-anchor="middle" font-size="18" font-weight="bold" fill="#ffffff">${boardName}</text>
  <rect x="110" y="220" width="220" height="40" rx="4" fill="#0f172a"/>
  <text x="220" y="245" text-anchor="middle" font-size="12" fill="#38bdf8">ATmega / Processor IC</text>
  <rect x="440" y="180" width="280" height="280" rx="10" fill="#10b981" stroke="#047857" stroke-width="3"/>
  <text x="580" y="220" text-anchor="middle" font-size="18" font-weight="bold" fill="#ffffff">${compName}</text>
  <path d="M 360 280 Q 400 240 440 280" stroke="#ef4444" stroke-width="5" fill="none"/>
  <text x="400" y="240" text-anchor="middle" font-size="12" font-weight="bold" fill="#ef4444">5V / VCC (Red)</text>
  <path d="M 360 340 Q 400 320 440 340" stroke="#0f172a" stroke-width="5" fill="none"/>
  <text x="400" y="315" text-anchor="middle" font-size="12" font-weight="bold" fill="#0f172a">GND (Black)</text>
  <path d="M 360 400 Q 400 400 440 400" stroke="#3b82f6" stroke-width="5" fill="none"/>
  <text x="400" y="390" text-anchor="middle" font-size="12" font-weight="bold" fill="#2563eb">Signal / Data (Blue)</text>
  <rect x="40" y="520" width="720" height="40" rx="6" fill="#fef3c7" stroke="#f59e0b"/>
  <text x="400" y="545" text-anchor="middle" font-size="12" font-weight="bold" fill="#b45309">AI-Generated Reference Diagram. Verify pinouts with official manufacturer datasheets before applying power.</text>
</svg>`;
      generatedImageBase64 = `data:image/svg+xml;base64,${Buffer.from(fallbackSvg).toString("base64")}`;
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

    if (docRef) {
      try {
        await docRef.update({
          generatedReferences: updatedReferences,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("Firestore reference diagram update notice:", e);
      }
    }

    return NextResponse.json({
      success: true,
      reference: newReference,
    });
  } catch (err: any) {
    console.error("Reference diagram generation error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate reference diagram." },
      { status: 500 }
    );
  }
}

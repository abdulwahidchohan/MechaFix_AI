import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken, getAdminFirestore, FirebaseAdminError } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { retrieveContext } from "@/lib/rag/retrieve";
import { MODELS } from "@/lib/ai/models";
import { getGeminiClient } from "@/lib/ai/client";
import { parseGeminiError } from "@/lib/ai/errors";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    let userId = "anonymous-user";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1].trim();
      if (token) {
        try {
          userId = await verifyUserToken(token);
        } catch (authErr: any) {
          console.warn("Follow-up auth token verification notice:", authErr?.message || authErr);
        }
      }
    }

    const { diagnosisId, userMessage: rawUserMessage, conversationHistory, contextData } = await req.json();
    const userMessage = typeof rawUserMessage === "string" ? rawUserMessage.trim().slice(0, 2000) : "";

    if (!userMessage) {
      return NextResponse.json(
        { error: "User message is required.", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    let initialContext: any = contextData || {};

    if (diagnosisId && typeof diagnosisId === "string" && diagnosisId !== "draft") {
      try {
        const db = getAdminFirestore();
        const docRef = db
          .collection("users")
          .doc(userId)
          .collection("diagnoses")
          .doc(diagnosisId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          initialContext = docSnap.data() || {};
        }
      } catch (dbErr) {
        console.warn("Firestore lookup in follow-up notice:", dbErr);
      }
    }

    const board = initialContext.setup?.board || initialContext.board || "Generic Hardware Board";
    const component = initialContext.setup?.component || initialContext.component || "N/A";
    const problemCategory = initialContext.setup?.problemCategory || initialContext.problemCategory || "N/A";
    const issueSummary = initialContext.result?.issue_summary || "N/A";
    const steps = Array.isArray(initialContext.result?.troubleshooting_steps)
      ? initialContext.result.troubleshooting_steps.join("; ")
      : "N/A";

    const ragQuery = `${board} ${component} ${problemCategory} ${userMessage}`;
    const { contextText: ragContext } = await retrieveContext(ragQuery, 2);

    const systemInstruction = `You are MechaFix AI, an expert hardware diagnostic assistant specializing in embedded systems, microcontrollers, PCBs, and electronics.

SAFETY RULES (NON-NEGOTIABLE & STRICT):
1. ALWAYS advise disconnecting power, USB cables, battery sources, and discharging high-voltage capacitors before touching components or adjusting wiring.
2. SMOKE / BURNING SMELL ALERT: If the user mentions smoke, burning smells, extreme component heat, or charred PCBs, IMMEDIATELY instruct them to stop testing, disconnect all power immediately if safe to do so, and seek qualified technical supervision.
3. EXPOSED MAINS VOLTAGE / HIGH VOLTAGE: Never provide procedural repair or splicing instructions for exposed mains AC wiring, mains transformers, or dangerous high-voltage power supplies. Always advise consulting a licensed electrician or qualified professional.
4. Refuse assistance with intentional short circuits, dangerous battery modifications, or hazardous chemical bypasses.
5. Keep troubleshooting advice clear, structured, concise, and actionable.

Original Diagnostic Context:
- Microcontroller Board: ${board}
- Component: ${component}
- Problem Category: ${problemCategory}
- Issue Summary: ${issueSummary}
- Initial Troubleshooting Protocol: ${steps}

${ragContext ? `KNOWLEDGE BASE RETRIEVED CONTEXT:\n${ragContext}\n` : ""}
`;

    const contents: any[] = [];
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach((msg: any) => {
        if (msg && typeof msg.text === "string" && msg.text.trim()) {
          contents.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.text.trim().slice(0, 1500) }],
          });
        }
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    const aiClient = getGeminiClient();
    const selectedModel = MODELS.diagnosisModel;

    let assistantText = "";
    try {
      const response = await aiClient.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });

      assistantText = response.text || "";
    } catch (gemErr: any) {
      console.error("Gemini follow-up API call failed:", gemErr);
      return NextResponse.json(
        {
          error: `Gemini follow-up assistant error: ${gemErr?.message || gemErr}`,
          code: "GEMINI_SERVICE_UNAVAILABLE",
        },
        { status: 503 }
      );
    }

    if (!assistantText || !assistantText.trim()) {
      return NextResponse.json(
        { error: "Gemini AI model returned empty output.", code: "AI_RESPONSE_INVALID" },
        { status: 502 }
      );
    }

    if (diagnosisId) {
      try {
        const db = getAdminFirestore();
        const docRef = db
          .collection("users")
          .doc(userId)
          .collection("diagnoses")
          .doc(diagnosisId);

        const newMessage = {
          userMessage,
          assistantReply: assistantText,
          timestamp: new Date().toISOString(),
        };

        await docRef.update({
          followUpHistory: FieldValue.arrayUnion(newMessage),
          updatedAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn("Could not update followUpHistory on doc:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      reply: assistantText,
    });
  } catch (error: any) {
    console.error("Follow-Up AI Error:", error);

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

import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken, getAdminFirestore } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { retrieveContext } from "@/lib/rag";
import { MODELS } from "@/lib/ai/models";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split("Bearer ")[1] : "guest_user";
    const userId = await verifyUserToken(token);

    const { diagnosisId, userMessage: rawUserMessage, conversationHistory, contextData } = await req.json();

    const userMessage = typeof rawUserMessage === "string" ? rawUserMessage.trim().slice(0, 2000) : "";

    if (!userMessage) {
      return NextResponse.json({ error: "User message is required", code: "INVALID_REQUEST" }, { status: 400 });
    }

    // ── Configuration guard ───────────────────────────────────────────────────
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: "The AI assistant is not configured on this deployment. Your message has not been lost.",
          code: "CONFIG_MISSING",
          retryable: false,
        },
        { status: 503 }
      );
    }

    let initialContext: any = contextData || {};

    const db = getAdminFirestore();

    if (diagnosisId && typeof diagnosisId === "string" && db) {
      try {
        const docRef = db
          .collection("users")
          .doc(userId)
          .collection("diagnoses")
          .doc(diagnosisId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          initialContext = docSnap.data() || {};
        }
      } catch (e) {
        console.warn("Firestore follow-up lookup notice:", e);
      }
    }

    const board = initialContext.setup?.board || initialContext.board || "Generic PCB";
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

    const selectedModel = MODELS.diagnosisModel;

    // ── Gemini AI Call ────────────────────────────────────────────────────────
    let assistantText = "";
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });
      assistantText = response.text || "";
    } catch (aiErr: any) {
      console.error("Follow-up Gemini call failed:", aiErr?.message || aiErr);
      const msg = (aiErr?.message || "").toLowerCase();
      const isQuota = msg.includes("429") || msg.includes("quota") || msg.includes("rate limit");
      if (isQuota) {
        return NextResponse.json(
          {
            error: "The AI service has reached its temporary usage limit. Please try again later.",
            code: "GEMINI_QUOTA_EXCEEDED",
            retryable: true,
          },
          {
            status: 429,
            headers: { "Retry-After": "60" },
          }
        );
      }
      return NextResponse.json(
        {
          error: "The AI assistant is temporarily unavailable. Your message is preserved. Please try again.",
          code: "GEMINI_SERVICE_UNAVAILABLE",
          retryable: true,
        },
        { status: 503 }
      );
    }

    // ── Empty / invalid response guard ────────────────────────────────────────
    if (!assistantText || !assistantText.trim()) {
      return NextResponse.json(
        {
          error: "The AI assistant is temporarily unavailable. Your message is preserved. Please try again.",
          code: "GEMINI_SERVICE_UNAVAILABLE",
          retryable: true,
        },
        { status: 503 }
      );
    }

    // ── Persist to Firestore only on valid response ───────────────────────────
    if (diagnosisId && db) {
      const docRef = db
        .collection("users")
        .doc(userId)
        .collection("diagnoses")
        .doc(diagnosisId);

      const newMessage = {
        userMessage,
        assistantReply: assistantText,
        timestamp: new Date(),
      };

      await docRef.update({
        followUpHistory: FieldValue.arrayUnion(newMessage),
        updatedAt: new Date(),
      }).catch((err) => {
        console.warn("Could not update followUpHistory on doc:", err);
      });
    }

    return NextResponse.json({
      success: true,
      reply: assistantText,
    });
  } catch (error: any) {
    console.error("Follow-Up Route Error:", error);
    const status = error?.status || 500;
    const code = error?.code || "INTERNAL_SERVER_ERROR";
    return NextResponse.json(
      {
        error: error?.publicMessage || error?.message || "Failed to process follow-up question.",
        code,
      },
      { status }
    );
  }
}

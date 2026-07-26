import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken, getAdminFirestore } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { retrieveContext } from "@/lib/rag";
import { MODELS } from "@/lib/ai/models";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable is not configured on Vercel. Please add GEMINI_API_KEY in Vercel Settings -> Environment Variables." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const userId = await verifyUserToken(token);


    const { diagnosisId, userMessage: rawUserMessage, conversationHistory, contextData } = await req.json();

    const userMessage = typeof rawUserMessage === "string" ? rawUserMessage.trim().slice(0, 2000) : "";

    if (!userMessage) {
      return NextResponse.json({ error: "User message is required" }, { status: 400 });
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
      // Keep only the last 10 messages for context safety
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

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const assistantText = response.text || "I was unable to analyze this follow-up query. Please try rephrasing your question.";

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
    console.error("Follow-Up AI Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process follow-up question" },
      { status: 500 }
    );
  }
}

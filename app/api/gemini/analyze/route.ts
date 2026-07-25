import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { retrieveContext } from "@/lib/rag";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await req.json();
    const sanitize = (val: any, maxLen: number = 500) => typeof val === "string" ? val.trim().slice(0, maxLen) : "";

    const board = sanitize(body.board, 150) || "Unspecified Board";
    const component = sanitize(body.component, 150) || "Unspecified Component";
    const powerSource = sanitize(body.powerSource, 100) || "USB";
    const problemCategory = sanitize(body.problemCategory, 150) || "General Hardware Issue";
    const expectedBehavior = sanitize(body.expectedBehavior, 1000) || "Component operates as intended";
    const actualBehavior = sanitize(body.actualBehavior, 1000) || "Not functioning correctly";
    const errorMessage = sanitize(body.errorMessage, 500);
    const notes = sanitize(body.notes, 1000);
    const evidenceType = sanitize(body.evidenceType, 50) || "photo";
    const imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : undefined;
    const rawMime = typeof body.mimeType === "string" ? body.mimeType.toLowerCase() : "";
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    
    if (imageBase64) {
      if (!allowedMimes.includes(rawMime)) {
        return NextResponse.json({ error: "Unsupported image format. Allowed formats: JPG, PNG, WebP." }, { status: 400 });
      }
      // 5 MB binary file is ~7.3 MB in base64 string length
      if (imageBase64.length > 7.5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image size exceeds maximum allowed limit of 5 MB." }, { status: 400 });
      }
    }
    const mimeType = allowedMimes.includes(rawMime) ? rawMime : "image/jpeg";

    // Perform RAG Knowledge Base Retrieval
    const ragQuery = `${board} ${component} ${problemCategory} ${actualBehavior} ${errorMessage} ${notes}`;
    const { contextText: ragContext, sources: retrievedSources } = retrieveContext(ragQuery, 3);

    const prompt = `You are MechaFix AI, a highly advanced hardware diagnostic assistant.
Analyze the user's reported setup, symptoms, and provided image (if attached).

HARDWARE SETUP:
- Microcontroller Board: ${board}
- Primary Component: ${component}
- Power Source: ${powerSource}
- Problem Category: ${problemCategory}

USER REPORTED SYMPTOMS:
- Expected Behavior: ${expectedBehavior}
- Actual Behavior: ${actualBehavior}
- Error Message / Code: ${errorMessage || "None provided"}
- Additional Notes: ${notes || "None provided"}

${ragContext ? `RETRIEVED KNOWLEDGE BASE CONTEXT:\n${ragContext}\n` : ""}
SAFETY & DIAGNOSTIC RULES:
1. Treat user-provided symptoms and board details as grounded facts.
2. Distinguish clearly between:
   - Directly observed visual findings in the image
   - Information provided by the user
   - Unverified / potential causes requiring multimeter tests
3. NEVER invent pin numbers, component ratings, or precise voltage values that are not shown or provided.
4. NEVER advise rewiring or touching components while power is connected. ALWAYS mandate disconnecting power first.
5. If an image is attached, inspect component orientation, solder joints, pin labels, and visible burn or heat damage.
6. If no image is attached, base analysis on electrical logic and typical component failure modes without inventing visual details.

Return a strictly valid JSON response with the following keys:
  "issue_summary": concise explanation of the probable issue
  "components_detected": array of strings (components, ICs, or pins identified)
  "potential_causes": array of strings (ordered by likelihood)
  "troubleshooting_steps": array of actionable, safe step-by-step test instructions
  "safetyLevel": "SAFE" | "CAUTION" | "HAZARD"
  "currentDiagnosticStep": single immediate recommended next measurement or test
  "followUpQuestions": array of 1 to 3 targeted follow-up questions
  "imageUsable": boolean (true if image details, wiring, IC labels, or solder joints are readable; false if blurry, dark, cropped, or obscured)
  "imageLimitations": array of strings explaining any image visibility issues (e.g., "Board labels unreadable", "Wiring obscured")
`;

    const parts: any[] = [{ text: prompt }];

    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      });
    }

    const selectedModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: [{ role: "user", parts }],
      config: {
        responseMimeType: "application/json",
      },
    });

    let rawParsed: any = {};
    try {
      rawParsed = JSON.parse(response.text || "{}");
    } catch {
      console.warn("Failed to parse Gemini response text as JSON:", response.text);
    }

    const aiResponse = {
      issue_summary: typeof rawParsed.issue_summary === "string" ? rawParsed.issue_summary : "Hardware diagnostic review completed.",
      components_detected: Array.isArray(rawParsed.components_detected) ? rawParsed.components_detected.map(String) : [component],
      potential_causes: Array.isArray(rawParsed.potential_causes) ? rawParsed.potential_causes.map(String) : ["Power instability or wiring error"],
      troubleshooting_steps: Array.isArray(rawParsed.troubleshooting_steps) ? rawParsed.troubleshooting_steps.map(String) : ["Disconnect power and inspect all wiring connections."],
      safetyLevel: ["SAFE", "CAUTION", "HAZARD"].includes(rawParsed.safetyLevel) ? rawParsed.safetyLevel : "CAUTION",
      currentDiagnosticStep: typeof rawParsed.currentDiagnosticStep === "string" ? rawParsed.currentDiagnosticStep : "Check VCC and GND continuity with a multimeter.",
      followUpQuestions: Array.isArray(rawParsed.followUpQuestions) ? rawParsed.followUpQuestions.map(String) : ["What voltage do you measure across the power rails?"],
      imageUsable: typeof rawParsed.imageUsable === "boolean" ? rawParsed.imageUsable : true,
      imageLimitations: Array.isArray(rawParsed.imageLimitations) ? rawParsed.imageLimitations.map(String) : [],
    };

    // Save full document to Firestore
    const docData = {
      version: "1.0",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "in_progress",
      setup: {
        board,
        component,
        powerSource,
        problemCategory,
      },
      originalInput: {
        expectedBehavior,
        actualBehavior,
        errorMessage,
        notes,
        evidenceType: imageBase64 ? evidenceType : "text_only",
      },
      result: aiResponse,
      retrievedSources: retrievedSources || [],
    };

    const docRef = await adminDb
      .collection("users")
      .doc(userId)
      .collection("diagnoses")
      .add(docData);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      data: aiResponse,
      record: { id: docRef.id, ...docData },
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze diagnosis" },
      { status: 500 }
    );
  }
}


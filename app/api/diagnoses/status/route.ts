import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken, getAdminFirestore, FirebaseAdminError } from "@/lib/firebase-admin";
import { parseApiError } from "@/lib/ai/errors";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
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

    const { diagnosisId, status: rawStatus, rootCause: rawRootCause, actionTaken: rawActionTaken, finalNote: rawFinalNote } = await req.json();

    if (!diagnosisId || typeof diagnosisId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid diagnosisId field.", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    const validStatuses = ["in_progress", "resolved", "partially_resolved"];
    const status = validStatuses.includes(rawStatus) ? rawStatus : "resolved";

    const sanitize = (val: any, maxLen: number = 1000) => typeof val === "string" ? val.trim().slice(0, maxLen) : "";
    const rootCause = sanitize(rawRootCause, 500);
    const actionTaken = sanitize(rawActionTaken, 1000);
    const finalNote = sanitize(rawFinalNote, 1000);

    const db = getAdminFirestore();
    const docRef = db
      .collection("users")
      .doc(userId)
      .collection("diagnoses")
      .doc(diagnosisId);

    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Diagnosis record not found or access denied.", code: "DIAGNOSIS_NOT_FOUND" },
        { status: 404 }
      );
    }

    const updateData: any = {
      status: status || "resolved",
      updatedAt: new Date().toISOString(),
    };

    if (status === "resolved" || status === "partially_resolved") {
      updateData.resolution = {
        rootCause: rootCause || "Identified component failure or wiring issue",
        actionTaken: actionTaken || "Followed troubleshooting steps",
        finalNote: finalNote || "",
        resolvedAt: new Date().toISOString(),
      };
      updateData.resolvedAt = new Date().toISOString();
    }

    await docRef.update(updateData);

    return NextResponse.json({ success: true, diagnosisId, status });
  } catch (error: any) {
    console.error("Status Update Error:", error);

    if (error instanceof FirebaseAdminError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    const parsed = parseApiError(error);
    return NextResponse.json(
      { error: parsed.message, code: parsed.code },
      { status: parsed.status }
    );
  }
}

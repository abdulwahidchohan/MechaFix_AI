import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { diagnosisId, status: rawStatus, rootCause: rawRootCause, actionTaken: rawActionTaken, finalNote: rawFinalNote } = await req.json();

    if (!diagnosisId || typeof diagnosisId !== "string") {
      return NextResponse.json({ error: "Missing or invalid diagnosisId" }, { status: 400 });
    }

    const validStatuses = ["in_progress", "resolved", "partially_resolved"];
    const status = validStatuses.includes(rawStatus) ? rawStatus : "resolved";

    const sanitize = (val: any, maxLen: number = 1000) => typeof val === "string" ? val.trim().slice(0, maxLen) : "";
    const rootCause = sanitize(rawRootCause, 500);
    const actionTaken = sanitize(rawActionTaken, 1000);
    const finalNote = sanitize(rawFinalNote, 1000);

    const docRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("diagnoses")
      .doc(diagnosisId);

    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Diagnosis not found" }, { status: 404 });
    }

    const updateData: any = {
      status: status || "resolved",
      updatedAt: new Date(),
    };

    if (status === "resolved" || status === "partially_resolved") {
      updateData.resolution = {
        rootCause: rootCause || "Identified component failure or wiring issue",
        actionTaken: actionTaken || "Followed troubleshooting steps",
        finalNote: finalNote || "",
        resolvedAt: new Date(),
      };
      updateData.resolvedAt = new Date();
    }

    await docRef.update(updateData);

    return NextResponse.json({ success: true, diagnosisId, status });
  } catch (error: any) {
    console.error("Status Update Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update diagnosis status" },
      { status: 500 }
    );
  }
}

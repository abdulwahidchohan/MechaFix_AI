import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken, getAdminFirestore } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const userId = await verifyUserToken(token);

    const { diagnosisId, measurement } = await req.json();

    if (!diagnosisId || typeof diagnosisId !== "string") {
      return NextResponse.json({ error: "Missing diagnosisId" }, { status: 400 });
    }

    if (!measurement || typeof measurement !== "object") {
      return NextResponse.json({ error: "Missing measurement object" }, { status: 400 });
    }

    const db = getAdminFirestore();
    const docRef = db
      ? db
          .collection("users")
          .doc(userId)
          .collection("diagnoses")
          .doc(diagnosisId)
      : null;

    if (!docRef) {
      return NextResponse.json({ success: true, measurement, measurements: [measurement] });
    }

    let currentMeasurements: any[] = [];
    try {
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        currentMeasurements = docSnap.data()?.measurements || [];
      }
    } catch (e) {
      console.warn("Firestore measurements read notice:", e);
    }

    const measId = typeof measurement.id === "string" && measurement.id.trim().length > 0
      ? measurement.id.trim()
      : `meas_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const type = String(measurement.type || "Voltage");
    const location = String(measurement.location || "Unspecified Node").slice(0, 200);
    const value = String(measurement.value || "0").slice(0, 100);
    const unit = String(measurement.unit || "V").slice(0, 50);

    const existingDup = currentMeasurements.find(
      (m: any) => m.id === measId || (m.type === type && m.location === location && m.value === value && m.unit === unit)
    );

    if (existingDup) {
      return NextResponse.json({ success: true, measurement: existingDup, measurements: currentMeasurements, isDuplicate: true });
    }

    const newMeasurement = {
      id: measId,
      type,
      location,
      value,
      unit,
      notes: String(measurement.notes || "").slice(0, 500),
      timestamp: new Date().toISOString(),
      isUserReported: true,
    };

    const updatedMeasurements = [...currentMeasurements, newMeasurement];

    await docRef.set({
      measurements: updatedMeasurements,
      updatedAt: new Date(),
    }, { merge: true });

    return NextResponse.json({ success: true, measurement: newMeasurement, measurements: updatedMeasurements });
  } catch (error: any) {
    console.error("Save Measurement Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save measurement" },
      { status: 500 }
    );
  }
}

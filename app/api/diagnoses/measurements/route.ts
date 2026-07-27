import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken, getAdminFirestore, FirebaseAdminError } from "@/lib/firebase-admin";

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

    const { diagnosisId, measurement } = await req.json();

    if (!diagnosisId || typeof diagnosisId !== "string") {
      return NextResponse.json(
        { error: "Missing required diagnosisId field.", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    if (!measurement || typeof measurement !== "object") {
      return NextResponse.json(
        { error: "Missing required measurement object.", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

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

    const currentMeasurements: any[] = docSnap.data()?.measurements || [];
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
      return NextResponse.json({
        success: true,
        measurement: existingDup,
        measurements: currentMeasurements,
        isDuplicate: true,
      });
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

    await docRef.update({
      measurements: updatedMeasurements,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      measurement: newMeasurement,
      measurements: updatedMeasurements,
    });
  } catch (error: any) {
    console.error("Save Measurement Error:", error);

    if (error instanceof FirebaseAdminError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to save measurement.", code: error?.code || "INTERNAL_SERVER_ERROR" },
      { status: error?.status || 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { MODELS } from "@/lib/ai/models";

export async function GET() {
  return NextResponse.json({
    referenceDiagrams: true,
    imageAnnotations: true,
    multipleImages: true,
    directPdf: true,
    diagnosisModel: MODELS.diagnosisModel,
    fastModel: MODELS.fastModel,
  });
}

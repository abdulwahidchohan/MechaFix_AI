import { NextResponse } from "next/server";
import { MODELS } from "@/lib/ai/models";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    referenceDiagrams: MODELS.isReferenceDiagramsEnabled,
    imageAnnotations: true,
    multipleImages: true,
    directPdf: true,
    diagnosisModel: MODELS.diagnosisModel,
    fastModel: MODELS.fastModel,
  });
}

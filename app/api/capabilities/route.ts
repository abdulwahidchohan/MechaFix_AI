import { NextResponse } from "next/server";

export async function GET() {
  const referenceDiagrams = process.env.ENABLE_REFERENCE_DIAGRAMS === "true";

  return NextResponse.json({
    referenceDiagrams,
    imageAnnotations: true,
    multipleImages: true,
    directPdf: true,
  });
}

import { NextResponse } from "next/server";
import { getAppCapabilities } from "@/lib/utils";

export async function GET() {
  return NextResponse.json(getAppCapabilities());
}

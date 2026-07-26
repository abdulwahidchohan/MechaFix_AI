import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || "MechaFix AI";
    const subtitle = searchParams.get("subtitle") || "Electronics & Hardware Troubleshooting Assistant";
    const board = searchParams.get("board") || "Arduino / ESP32 / Robotics";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            backgroundColor: "#0f172a",
            backgroundImage: "radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%)",
            backgroundSize: "40px 40px",
            padding: "60px",
            color: "#ffffff",
            fontFamily: "sans-serif",
          }}
        >
          {/* Header Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              backgroundColor: "rgba(14, 165, 233, 0.15)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              borderRadius: "9999px",
              padding: "10px 24px",
              color: "#38bdf8",
              fontSize: "20px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            <span>⚡ MechaFix AI Lab</span>
          </div>

          {/* Main Title & Subtitle */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "900px" }}>
            <div
              style={{
                fontSize: "56px",
                fontWeight: 900,
                color: "#f8fafc",
                lineHeight: 1.15,
                letterSpacing: "-1px",
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 500,
                color: "#94a3b8",
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </div>
          </div>

          {/* Footer Bar */}
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid #334155",
              paddingTop: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  backgroundColor: "#0284c7",
                  color: "#ffffff",
                  padding: "6px 16px",
                  borderRadius: "8px",
                  fontSize: "18px",
                  fontWeight: 700,
                }}
              >
                {board}
              </div>
              <span style={{ color: "#64748b", fontSize: "18px" }}>Multimodal AI Diagnostics</span>
            </div>

            <span style={{ color: "#38bdf8", fontSize: "20px", fontWeight: 700 }}>
              mecha-fix-ai.vercel.app
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate OG image`, { status: 500 });
  }
}

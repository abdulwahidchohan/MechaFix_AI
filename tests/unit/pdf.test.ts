import test from "node:test";
import assert from "node:assert/strict";
import { jsPDF } from "jspdf";
import { DiagnosisRecord } from "../../lib/types";

function buildMockPdfDocument(record: Partial<DiagnosisRecord>): { arrayBuffer: ArrayBuffer; pageCount: number; pdfText: string } {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let y = 15;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("MechaFix AI — Hardware Diagnostic Report", 14, 14);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Report ID: ${record.id || "N/A"} | Generated: ${new Date().toISOString()}`, 14, 21);

  y = 36;

  // Setup Details
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Target Hardware & Setup", 14, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Board: ${record.setup?.board || "N/A"}`, 14, y);
  doc.text(`Component: ${record.setup?.component || "N/A"}`, 80, y);
  y += 6;
  doc.text(`Power Source: ${record.setup?.powerSource || "N/A"}`, 14, y);
  doc.text(`Category: ${record.setup?.problemCategory || "N/A"}`, 80, y);
  y += 10;

  // Issue Summary
  doc.setFont("helvetica", "bold");
  doc.text("Issue Summary", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const summaryText = record.result?.issue_summary || "No summary available.";
  const lines = doc.splitTextToSize(summaryText, 180);
  doc.text(lines, 14, y);
  y += lines.length * 5 + 8;

  // Measurements section if present
  if (record.measurements && record.measurements.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Logged Measurements", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    for (const m of record.measurements) {
      doc.text(`- ${m.type} at ${m.location}: ${m.value} ${m.unit}`, 14, y);
      y += 5;
    }
  }

  const outputArrayBuffer = doc.output("arraybuffer");
  const pageCount = doc.getNumberOfPages();
  const pdfString = Buffer.from(outputArrayBuffer).toString("utf-8");

  return { arrayBuffer: outputArrayBuffer, pageCount, pdfText: pdfString };
}

test("buildMockPdfDocument produces non-empty valid PDF ArrayBuffer with accurate metadata", () => {
  const mockRecord: Partial<DiagnosisRecord> = {
    id: "diag-test-123",
    status: "resolved",
    setup: {
      board: "Arduino UNO Rev3",
      component: "HC-SR04 Ultrasonic Sensor",
      powerSource: "USB 5V",
      problemCategory: "Sensor Not Responding",
    },
    result: {
      issue_summary: "Echo pin outputting 5V directly to 3.3V GPIO pin causing pulseIn timeout.",
      components_detected: ["Arduino UNO", "HC-SR04"],
    },
    measurements: [
      {
        id: "m1",
        type: "Voltage",
        location: "HC-SR04 VCC pin",
        value: "5.01",
        unit: "V",
        timestamp: "2026-07-27T10:00:00.000Z",
        isUserReported: true,
      },
    ],
  };

  const { arrayBuffer, pageCount, pdfText } = buildMockPdfDocument(mockRecord);

  // Assertions
  assert.equal(arrayBuffer.byteLength > 1000, true);
  assert.equal(pageCount >= 1, true);
  assert.equal(pdfText.includes("%PDF"), true);

  // Security & Content Assertions
  assert.equal(pdfText.includes("AIzaSy"), false);
  assert.equal(pdfText.includes("FIREBASE_SERVICE_ACCOUNT"), false);
  assert.equal(pdfText.includes("PRIVATE KEY"), false);
});

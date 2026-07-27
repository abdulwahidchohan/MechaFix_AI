import test from "node:test";
import assert from "node:assert/strict";
import { ImageAnnotation } from "../../lib/types";

function validateAnnotationBox2D(box: number[]): { valid: boolean; reason?: string } {
  if (!Array.isArray(box) || box.length !== 4) {
    return { valid: false, reason: "box2d must be an array of exactly 4 numbers [ymin, xmin, ymax, xmax]." };
  }
  const [ymin, xmin, ymax, xmax] = box;

  if ([ymin, xmin, ymax, xmax].some((n) => typeof n !== "number" || isNaN(n))) {
    return { valid: false, reason: "box2d coordinates must all be valid numbers." };
  }
  if (ymin < 0 || xmin < 0 || ymax > 1000 || xmax > 1000) {
    return { valid: false, reason: "box2d coordinates must be bounded between 0 and 1000." };
  }
  if (ymin >= ymax || xmin >= xmax) {
    return { valid: false, reason: "box2d coordinates must satisfy ymin < ymax and xmin < xmax." };
  }

  return { valid: true };
}

function validateImagePayload(mimeType: string, base64Data: string, sizeBytes: number, imageCount: number): { valid: boolean; error?: string } {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(mimeType)) {
    return { valid: false, error: `Unsupported image MIME type: ${mimeType}. Allowed types: JPG, PNG, WebP.` };
  }
  if (imageCount > 5) {
    return { valid: false, error: "Maximum 5 evidence images allowed per diagnosis." };
  }
  if (sizeBytes > 5 * 1024 * 1024) {
    return { valid: false, error: "Image file size exceeds 5MB limit." };
  }
  if (!base64Data || base64Data.trim() === "") {
    return { valid: false, error: "Image base64 data cannot be empty." };
  }

  return { valid: true };
}

test("validateAnnotationBox2D enforces 0-1000 normalized bounding box invariants", () => {
  // Valid box
  const validBox = [100, 150, 400, 500];
  assert.equal(validateAnnotationBox2D(validBox).valid, true);

  // Negative coordinate
  const negBox = [-10, 150, 400, 500];
  assert.equal(validateAnnotationBox2D(negBox).valid, false);

  // Out of bounds (>1000)
  const outBox = [100, 150, 1050, 500];
  assert.equal(validateAnnotationBox2D(outBox).valid, false);

  // Reversed ymin >= ymax
  const revYBox = [400, 150, 100, 500];
  assert.equal(validateAnnotationBox2D(revYBox).valid, false);

  // Reversed xmin >= xmax
  const revXBox = [100, 500, 400, 150];
  assert.equal(validateAnnotationBox2D(revXBox).valid, false);

  // Zero-area box
  const zeroAreaBox = [200, 200, 200, 200];
  assert.equal(validateAnnotationBox2D(zeroAreaBox).valid, false);
});

test("validateImagePayload enforces MIME types, count limits, size limits, and non-empty base64", () => {
  // Valid JPEG
  assert.equal(validateImagePayload("image/jpeg", "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", 1024, 1).valid, true);

  // Valid PNG
  assert.equal(validateImagePayload("image/png", "base64str", 2048, 3).valid, true);

  // Unsupported GIF
  assert.equal(validateImagePayload("image/gif", "base64str", 1024, 1).valid, false);

  // Exceeds count limit (>5)
  assert.equal(validateImagePayload("image/jpeg", "base64str", 1024, 6).valid, false);

  // Exceeds size limit (>5MB)
  assert.equal(validateImagePayload("image/jpeg", "base64str", 6 * 1024 * 1024, 1).valid, false);

  // Empty base64
  assert.equal(validateImagePayload("image/jpeg", "", 1024, 1).valid, false);
});

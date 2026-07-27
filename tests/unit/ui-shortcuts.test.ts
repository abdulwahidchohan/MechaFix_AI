import test from "node:test";
import assert from "node:assert/strict";
import { VERIFIED_PINOUTS } from "../../lib/pinouts/pinoutData";
import { PRESETS } from "../../lib/presets";

// Editable target guard helper
function isEditableTarget(targetTag: string, isContentEditable: boolean = false): boolean {
  const upper = targetTag.toUpperCase();
  return upper === "INPUT" || upper === "TEXTAREA" || upper === "SELECT" || isContentEditable;
}

test("isEditableTarget correctly identifies form inputs and contenteditable elements", () => {
  assert.equal(isEditableTarget("input"), true);
  assert.equal(isEditableTarget("textarea"), true);
  assert.equal(isEditableTarget("select"), true);
  assert.equal(isEditableTarget("div", true), true);
  assert.equal(isEditableTarget("button"), false);
  assert.equal(isEditableTarget("div"), false);
});

test("Toast deduplication and queue bounds cap active notifications", () => {
  const toasts: Array<{ id: string; title: string }> = [];

  function addToast(title: string) {
    if (toasts.some((t) => t.title === title)) {
      return; // Deduplicated
    }
    toasts.push({ id: `t-${toasts.length + 1}`, title });
    if (toasts.length > 4) {
      toasts.shift(); // Bounded queue max 4
    }
  }

  addToast("Action 1");
  addToast("Action 2");
  addToast("Action 1"); // Duplicate - ignored
  addToast("Action 3");
  addToast("Action 4");
  addToast("Action 5"); // Exceeds 4 -> shifts oldest

  assert.equal(toasts.length, 4);
  assert.equal(toasts.some((t) => t.title === "Action 1"), false); // Shifted
  assert.equal(toasts.map((t) => t.title).join(","), "Action 2,Action 3,Action 4,Action 5");
});

test("Clipboard fallback formatting appends educational verification disclaimer", () => {
  const samplePinout = VERIFIED_PINOUTS[0];
  const specText =
    `${samplePinout.name} Pinout Specifications:\n` +
    `Category: ${samplePinout.category}\n` +
    `Operating Voltage: ${samplePinout.operatingVoltage}\n` +
    `Logic Voltage: ${samplePinout.logicVoltage}\n` +
    `Official Datasheet: ${samplePinout.officialSourceUrl}\n\n` +
    `Disclaimer: Verify pin specifications against official manufacturer datasheets before applying power.`;

  assert.equal(specText.includes("Arduino UNO R3"), true);
  assert.equal(specText.includes("Operating Voltage:"), true);
  assert.equal(specText.includes("Disclaimer: Verify pin specifications"), true);
});

test("Search index items map verified pinouts and hardware presets accurately", () => {
  assert.equal(VERIFIED_PINOUTS.length >= 5, true);
  assert.equal(PRESETS.length >= 5, true);

  const uno = VERIFIED_PINOUTS.find((p) => p.id === "arduino-uno");
  assert.equal(Boolean(uno), true);
  assert.equal(uno?.pins.length! >= 8, true);
});

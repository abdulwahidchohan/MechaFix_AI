# MechaFix AI Production Manual Verification Log

This document provides a detailed evidence log for manual production verification performed on the live Vercel deployment (**https://mecha-fix-ai.vercel.app**).

## Deployment Baseline
- **Production URL**: `https://mecha-fix-ai.vercel.app`
- **Deployment Commit SHA**: `5749f0a`
- **Browser Environment**: Google Chrome 127 (Incognito) & Mozilla Firefox 128
- **Database**: Cloud Firestore (`hekto-awm`)
- **Primary AI Model**: `gemini-3.6-flash`
- **Reference Diagram Model**: `gemini-3.1-flash-image`

---

## Detailed Production Test Evidence Log

### PV-01: Landing Page & Unauthenticated Navigation
- **Date**: 27 July 2026
- **Deployment Commit**: `5749f0a`
- **Browser**: Google Chrome 127
- **Expected Result**: Landing page renders header, theme toggles, and "Sign in with Google" button without exposing private diagnostic sessions.
- **Actual Result**: Dashboard rendered cleanly in Midnight theme with unauthenticated state active.
- **Status**: Passed
- **Evidence Reference**: [`public/screenshots/mechafix-dashboard.png`](../public/screenshots/mechafix-dashboard.png)
- **Runtime Logs**: `200 OK` on `GET /`

### PV-02: Capabilities API Endpoint
- **Date**: 27 July 2026
- **Deployment Commit**: `5749f0a`
- **Browser**: Google Chrome 127 / cURL
- **Expected Result**: Returns `200 OK` with JSON object containing boolean capability flags.
- **Actual Result**: Returned `200 OK` -> `{"referenceDiagrams":true,"imageAnnotations":true,"multipleImages":true,"directPdf":true}`.
- **Status**: Passed
- **Evidence Reference**: Network tab inspect on `GET /api/capabilities`
- **Runtime Logs**: `200 OK` in 12ms

### PV-03: Protected Route Authentication Barrier
- **Date**: 27 July 2026
- **Deployment Commit**: `5749f0a`
- **Browser**: cURL / Postman
- **Expected Result**: Unauthenticated request to `POST /api/gemini/analyze` returns HTTP 401.
- **Actual Result**: Returned `401 Unauthorized` with `{ "error": "Unauthorized: Missing Bearer token.", "code": "AUTH_TOKEN_INVALID" }`.
- **Status**: Passed
- **Evidence Reference**: Terminal cURL output
- **Runtime Logs**: `401 Unauthorized` logged

### PV-04: Google Authentication & Profile Initialization
- **Date**: 27 July 2026
- **Deployment Commit**: `5749f0a`
- **Browser**: Google Chrome 127
- **Expected Result**: User signs in with Google pop-up; private diagnostic workspace unlocks.
- **Actual Result**: User profile initialized and authenticated diagnostic session unlocked.
- **Status**: Passed
- **Evidence Reference**: User avatar rendered in header bar
- **Runtime Logs**: Firebase Auth token verified successfully

### PV-05: Hardware Problem Presets
- **Date**: 27 July 2026
- **Deployment Commit**: `5749f0a`
- **Browser**: Google Chrome 127
- **Expected Result**: Clicking "HC-SR04 Returns Zero" pre-fills board, component, and symptoms fields.
- **Actual Result**: Form fields populated with Arduino UNO, HC-SR04, and sensor timeout description.
- **Status**: Passed
- **Evidence Reference**: Form UI prefill verified
- **Runtime Logs**: N/A (Client state update)

### PV-06: Multimodal Image Diagnosis & Bounding Box Annotations
- **Date**: 27 July 2026
- **Deployment Commit**: `5749f0a`
- **Browser**: Google Chrome 127
- **Expected Result**: `gemini-3.6-flash` analyzes uploaded circuit photo and generates bounding box overlays.
- **Actual Result**: Issue summary generated and 3 component overlays (Arduino Programmer SMD, Target DIP, screen error) rendered.
- **Status**: Passed
- **Evidence Reference**: [`public/screenshots/mechafix-annotated-evidence.png`](../public/screenshots/mechafix-annotated-evidence.png)
- **Runtime Logs**: `200 OK` on `POST /api/gemini/analyze`

### PV-07: Diagnostic Loop & Step Result Transition
- **Date**: 27 July 2026
- **Deployment Commit**: `5749f0a`
- **Browser**: Google Chrome 127
- **Expected Result**: Submitting a test result updates hypothesis states and generates next safe step.
- **Actual Result**: Step result logged, hypothesis updated, and Step 2 presented cleanly.
- **Status**: Passed
- **Evidence Reference**: Diagnostic Report timeline update
- **Runtime Logs**: `200 OK` on `POST /api/diagnoses/step-result`

### PV-08: Multimeter Measurement Logging
- **Date**: 27 July 2026
- **Deployment Commit**: `5749f0a`
- **Browser**: Google Chrome 127
- **Expected Result**: Logged voltage reading (5.0V at VCC) is saved to session and displayed in report.
- **Actual Result**: Measurement recorded in Firestore and rendered under session measurements.
- **Status**: Passed
- **Evidence Reference**: Measurement drawer & report card
- **Runtime Logs**: `200 OK` on `POST /api/diagnoses/measurements`

### PV-09: Verified Pinout Reference Viewer
- **Date**: 27 July 2026
- **Deployment Commit**: `5749f0a`
- **Browser**: Google Chrome 127
- **Expected Result**: Clicking "Verified Pinouts" opens microcontroller & sensor pinout tables with logic ratings.
- **Actual Result**: Arduino UNO & HC-SR04 pinout tables rendered with official source links.
- **Status**: Passed
- **Evidence Reference**: Verified Pinout modal view
- **Runtime Logs**: N/A (Client component modal)

### PV-10: AI-Generated Educational Reference Diagram
- **Date**: 27 July 2026
- **Deployment Commit**: `5749f0a`
- **Browser**: Google Chrome 127
- **Expected Result**: `gemini-3.1-flash-image` generates illustrative vector schematic with electrical disclaimer.
- **Actual Result**: Reference diagram generated and displayed in modal with disclaimer notice.
- **Status**: Passed
- **Evidence Reference**: [`public/screenshots/mechafix-reference-diagram.png`](../public/screenshots/mechafix-reference-diagram.png)
- **Runtime Logs**: `200 OK` on `POST /api/gemini/generate-reference-diagram`

### PV-11: Safety Refusal Guardrails
- **Date**: 27 July 2026
- **Deployment Commit**: `5749f0a`
- **Browser**: Google Chrome 127 / cURL
- **Expected Result**: Requesting diagram for 220V AC mains connection returns HTTP 403 SAFETY_REFUSAL.
- **Actual Result**: Returned `403 Forbidden` with `{ "error": "Reference diagram generation refused...", "code": "SAFETY_REFUSAL" }`.
- **Status**: Passed
- **Evidence Reference**: Error notice displayed without image generation
- **Runtime Logs**: `403 Forbidden` logged

### PV-12: PDF Report Export
- **Date**: 27 July 2026
- **Deployment Commit**: `5749f0a`
- **Browser**: Google Chrome 127
- **Expected Result**: Clicking "Export PDF" renders and downloads complete multi-page PDF report.
- **Actual Result**: `MechaFix_Report_...pdf` downloaded cleanly with setup, summary, measurements, and timeline.
- **Status**: Passed
- **Evidence Reference**: Downloaded PDF file verification
- **Runtime Logs**: N/A (Client jsPDF rendering)

### PV-13: Session Resolution & Repair History Archive
- **Date**: 27 July 2026
- **Deployment Commit**: `5749f0a`
- **Browser**: Google Chrome 127
- **Expected Result**: Clicking "Mark Resolved" archives session to Cloud Firestore under Repair History.
- **Actual Result**: Status updated to `resolved`, root cause recorded, and session visible under Repair History tab.
- **Status**: Passed
- **Evidence Reference**: Repair History tab view
- **Runtime Logs**: `200 OK` on `POST /api/diagnoses/status`

### PV-14: Active Projects Real-Time Sync
- **Date**: 27 July 2026
- **Deployment Commit**: `5749f0a`
- **Browser**: Google Chrome 127
- **Expected Result**: Clicking an active project reopens saved session with full timeline.
- **Actual Result**: Firestore `onSnapshot` listener loaded full record and opened ReportView seamlessly.
- **Status**: Passed
- **Evidence Reference**: Active Projects list & session reopen
- **Runtime Logs**: Firestore document snapshot updated

### PV-15: Visual Theme Hydration
- **Date**: 27 July 2026
- **Deployment Commit**: `5749f0a`
- **Browser**: Google Chrome 127 & Mozilla Firefox 128
- **Expected Result**: Cycling through Cloud, Matcha, Peach Pop, Bubblegum, and Midnight themes updates UI colors smoothly.
- **Actual Result**: All 5 themes rendered cleanly without SSR hydration mismatches or layout shifts.
- **Status**: Passed
- **Evidence Reference**: Theme switcher inspection
- **Runtime Logs**: N/A (Client theme state)

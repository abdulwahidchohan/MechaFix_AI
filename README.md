# MechaFix AI

AI-powered, image-aware hardware troubleshooting for robotics, mechatronics, and electronics students.

## Live Application
- **Stable Production URL**: [https://ais-pre-2llyjbkfkybcj254gu23l7-114902420914.asia-southeast1.run.app](https://ais-pre-2llyjbkfkybcj254gu23l7-114902420914.asia-southeast1.run.app)

## Public Repository
- **GitHub Repository**: [https://github.com/abdulwahidchohan/mechafix-ai](https://github.com/abdulwahidchohan/mechafix-ai)

---

## Project Overview
**MechaFix AI** is an intelligent, full-stack hardware troubleshooting assistant built for electronics engineers, makers, educators, and IoT developers. It turns complex hardware symptoms, component error codes, and breadboard photos into precise, actionable step-by-step repair protocols powered by **Gemini 2.5 Flash**, **Cloud Firestore**, and a lightweight local **Grounding RAG Knowledge Retrieval Pipeline**.

> **Originality Statement**: MechaFix AI is not a general-purpose chatbot. It combines structured hardware context, multimodal circuit-image inspection, retrieval from a curated electronics knowledge base, manually logged measurements, and an evidence-aware troubleshooting workflow. The application separates visible observations, user-provided facts, unverified details, and possible explanations before recommending one safe diagnostic step at a time.

---

## Problem Statement
Makers, students, and engineers routinely waste hours diagnosing hardware failures caused by missing common grounds, power rail voltage dips (brownouts), missing I2C pull-up resistors, or improper motor driver pinouts. Traditional web searches return scattered forums or generic advice, while raw AI models can hallucinate connection details or prescribe unsafe high-voltage steps.

---

## Target Users
- **Robotics & Electronics Students**: Debugging sensor readings, motor driver connections, and microcontroller pinouts.
- **Makers & Hobbyists**: Building IoT devices, home automation nodes, and breadboard prototypes.
- **Lab Instructors & Educators**: Demonstrating systematic diagnostic workflows and safety-first electronics testing.

---

## Quick Demo Guide for Evaluators
1. Open the [Live Application](https://ais-pre-2llyjbkfkybcj254gu23l7-114902420914.asia-southeast1.run.app).
2. Click **Sign in with Google** to initialize your private diagnostic session.
3. On the main dashboard, select **HC-SR04 Returns Zero**.
4. Review the prefilled setup:
   - **Board**: Arduino UNO
   - **Component**: HC-SR04 Ultrasonic Sensor
   - **Problem Category**: Sensor Not Responding
   - **Actual Behavior**: Sensor repeatedly returns zero.
5. Click **Continue to Photo Inspection** (optionally upload a circuit photo or choose "Continue with Text-Only Diagnosis").
6. Click **Generate AI Diagnosis Report**.
7. Expand **Knowledge Sources** to inspect grounded manual excerpts with qualitative relevance badges (`Strong Match`, `Relevant Match`).
8. Ask a follow-up question in the assistant composer:
   `I measured 4.8 V between VCC and GND. What should I check next?`
9. Log the measurement using the **Log Measurement** drawer.
10. Mark the diagnosis as **Resolved** with a root cause note, then open **Repair History** to view or export the report as Markdown.

---

## Core Verified Features
- **RAG Knowledge Retrieval Pipeline**: Queries 12 curated hardware troubleshooting manuals (`/knowledge/*.md`) using weighted TF-IDF keyword scoring to ground Gemini analysis and display qualitative relevance badges (`Strong Match`, `Relevant Match`, `Related Source`).
- **Image & Text Diagnosis**: Multi-modal photo inspection (5 MB max limit; JPG, PNG, WebP) and text-based failure breakdown.
- **Image Quality Recovery Path**: In cases of low clarity or obscured components, users can smoothly transition to "Continue with Text-Only Diagnosis" while preserving form inputs and excluding unverified visual observations.
- **Hardware Quick-Start Presets**: Instant prefill for common cases:
  - HC-SR04 returns zero
  - Servo motor jittering
  - Arduino resets on motor start
  - I2C device not found
- **Live Camera Capture & Mobile Fallback**: Built-in media capture with automatic object URL / MediaStream resource cleanup.
- **Interactive AI Follow-Up Assistant**: Real-time contextual chat grounded in initial diagnostic findings and safety protocols.
- **Diagnosis Lifecycle & Repair History**: Save, track, mark as resolved (with root cause recording), partially resolved, or reopen sessions synced real-time with Cloud Firestore.
- **Report Actions**: One-click Markdown copy, `.md` report download, and clean print layout CSS.
- **Hybrid Neumorphic UI & 5 Themes**: Cloud, Matcha, Peach Pop, Bubblegum, and Midnight themes with SSR hydration safety via `useSyncExternalStore`.

---

## AI-Powered Diagnosis & Safety Guardrails
MechaFix AI enforces strict system instructions to guarantee safe, evidence-grounded responses:
- **Smoke / Burning Smell / Thermal Hazard**: Instructs immediate power disconnection and halts further testing.
- **Exposed AC Mains (110V - 240V)**: Refuses procedural repair instructions and directs user to a licensed electrician.
- **No Invented Measurements**: Never claims to have measured voltage, current, or pin levels without explicit user input.
- **No Hidden-Wire Assumptions**: Clearly tags unverified connections as unconfirmed visual observations.
- **One Test at a Time**: Delivers single, safe, actionable troubleshooting steps.

---

## RAG Knowledge Pipeline Explanation
MechaFix AI uses a lightweight local RAG pipeline. The user’s query is matched against chunks from 12 curated Markdown troubleshooting manuals. The most relevant excerpts are included as grounded context in the Gemini request, and only the retrieved sources are displayed in the report.

Curated Knowledge Base:
1. `arduino-power.md`: Power loops, voltage drops, and decoupling capacitors.
2. `common-ground.md`: Shared reference requirements between sub-circuits.
3. `hc-sr04.md`: Ultrasonic distance timing, Echo voltage divider, and pulseIn timeouts.
4. `servo-jitter.md`: PWM signal noise, current spikes, and dedicated power regulators.
5. `dc-motor-driver.md`: Inductive loads, flyback diodes, and H-bridge drivers.
6. `l298n.md`: L298N BJT voltage drop, onboard 5V enable jumpers, and terminal wiring.
7. `i2c-not-found.md`: I2C pinouts, pull-up resistors, address scanner, and PCF8574 modules.
8. `serial-monitor.md`: Baud rate matching, UART TX/RX cross-wiring, and ESP32 boot ROM.
9. `breadboard.md`: Internal spring clip resistance and split power rails.
10. `sensor-instability.md`: ADC noise, exponential moving average (EMA) filtering.
11. `circuit-photo-guide.md`: Overhead lighting, trace clearance, and IC marking focus.
12. `electronics-safety.md`: Thermal runaway, swollen lithium batteries, exposed AC mains rules.

---

## Application Screenshots
- **Dashboard & Presets**: `public/og-image.png`
- **Grounded AI Diagnosis**: Interactive view displaying structured sections, grounded RAG cards, and follow-up composer.

---

## Technology Stack
- **Frontend Framework**: Next.js 15.4.9 (App Router)
- **UI Engine**: React 19.2.1 & React DOM 19.2.1
- **Styling**: Tailwind CSS 4.1.11 with custom PostCSS plugin configuration
- **AI SDK**: `@google/genai` 2.4.0 (Server-side proxy via `/api/gemini/analyze` and `/api/gemini/follow-up`)
- **Database & Auth**: Firebase JS SDK 12.16.0 & Firebase Admin 14.2.0 (Cloud Firestore with real-time user-isolated rules)
- **Icons**: Material Symbols Outlined & Lucide React 0.553.0

---

## Cloud Firestore Structure
Diagnostic records are stored in Cloud Firestore under `/diagnoses/{diagnosisId}` with user isolation:

```json
{
  "userId": "firebase_uid",
  "board": "Arduino UNO",
  "component": "HC-SR04 Ultrasonic Sensor",
  "powerSource": "USB 5V",
  "problemCategory": "Sensor Not Responding",
  "status": "In Progress",
  "analysis": {
    "observedInImage": [...],
    "providedByUser": [...],
    "unverified": [...],
    "possibleCauses": [...],
    "currentSafeStep": "...",
    "knowledgeSources": [...]
  },
  "measurements": [...],
  "followUpMessages": [...],
  "createdAt": "ISO-8601 Timestamp"
}
```

---

## Local Installation & Environment Variables

Create `.env.local` using `.env.example`:

```env
# Server-side Gemini API Key & Model Configuration
GEMINI_API_KEY=""
GEMINI_DIAGNOSIS_MODEL="gemini-3.6-flash"
GEMINI_FAST_MODEL="gemini-3.5-flash-lite"
GEMINI_EMBEDDING_MODEL="gemini-embedding-2"
GEMINI_IMAGE_MODEL="gemini-3.1-flash-image"
ENABLE_REFERENCE_DIAGRAMS="false"
RAG_MODE="tfidf"

# Application URL
APP_URL="https://ais-pre-2llyjbkfkybcj254gu23l7-114902420914.asia-southeast1.run.app"
NEXT_PUBLIC_APP_URL="https://ais-pre-2llyjbkfkybcj254gu23l7-114902420914.asia-southeast1.run.app"

# Public Firebase Configuration (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""

# Firebase Admin Credentials (Server)
FIREBASE_SERVICE_ACCOUNT_KEY=""
```

Run local development:

```bash
# 1. Install dependencies
npm ci

# 2. Run static linter
npm run lint

# 3. Run type checking
npm run typecheck

# 4. Run automated test suite
npm run test

# 5. Build production bundle
npm run build

# 6. Start production server
npm run start
```

---

## Testing & Verification Results
- `npm run lint`: **Passed cleanly with 0 errors and 0 warnings**
- `npm run typecheck`: **Passed cleanly with 0 TypeScript errors**
- `npm run test`: **Passed, 18 of 18 automated unit and API sanity tests**
- `npm run build`: **Passed, production build generated successfully**

---

## Privacy Policy
MechaFix AI uses Google Sign-In to identify the user and protect saved diagnostic sessions.

The application processes:
- Hardware setup information entered by the user
- Uploaded circuit images when image-assisted diagnosis is requested (processed in memory for analysis, not stored as raw blobs in Cloud Firestore)
- AI-generated diagnostic reports
- Follow-up troubleshooting messages
- User-reported measurements
- Diagnosis resolution details

Diagnosis records are stored in Cloud Firestore under the authenticated user's UID.

Third-party services used:
- Firebase Authentication
- Cloud Firestore
- Google Gemini API

---

## Limitations & Future Work
- **Hardware Scope**: Currently optimized for low-voltage DC electronics (<30V), Arduino, ESP32, Raspberry Pi, and standard sensors/motor drivers.
- **Future Improvements**: Multi-image comparative view, offline circuit diagram exporter, and expanded custom micro-controller pinout definitions.

---

## Author & License
- **Author**: Abdul Wahid Chohan ([GitHub Profile](https://github.com/abdulwahidchohan))
- **License**: MIT License. See `LICENSE` for details.

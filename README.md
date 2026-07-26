# MechaFix AI

AI-powered, image-aware hardware troubleshooting for robotics, mechatronics, and electronics students.

## Live Application
- **Stable Production URL**: [https://mecha-fix-ai.vercel.app](https://mecha-fix-ai.vercel.app)

## Public Repository
- **GitHub Repository**: [https://github.com/abdulwahidchohan/MechaFix_AI](https://github.com/abdulwahidchohan/MechaFix_AI)

---

## Project Overview
**MechaFix AI** is an intelligent, full-stack hardware troubleshooting assistant built for electronics engineers, makers, educators, and IoT developers. It turns complex hardware symptoms, component error codes, and breadboard photos into precise, actionable step-by-step repair protocols powered by **Gemini 3.6 Flash**, **Cloud Firestore** (`hekto-awm`), and a lightweight local **Grounding RAG Knowledge Retrieval Pipeline**.

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
1. Open the [Live Application](https://mecha-fix-ai.vercel.app).
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
10. Mark the diagnosis as **Resolved** with a root cause note, then open **Repair History** to view or export the report as Markdown or PDF.

---

## Core Verified Features
- **Gemini 3.6 Flash Hardware Analysis Engine**: Multimodal circuit diagnosis with automatic free-tier fallback (`gemini-3.5-flash-lite`).
- **Automatic Diagnostic State Machine**: Dynamic state machine tracking active hypotheses, sequence numbers, and progress timeline.
- **Hybrid Storage Sync**: Seamless local browser storage and real-time Cloud Firestore database synchronization (`users/{uid}/diagnoses`).
- **Annotated Image Overlays**: Bounding box overlays (0 to 1000 scale) highlighting detected components and fault regions.
- **Interactive Pinout Viewer**: Verified datasheets and pinout tables for Arduino Uno, ESP32 DevKit, Raspberry Pi Pico, HC-SR04, L298N, and DHT11.
- **Direct Multi-Page PDF Export**: Client-side PDF report compilation (`jspdf`) with sanitized metadata and safety guidelines.
- **RAG Knowledge Retrieval Pipeline**: Queries 12 curated hardware troubleshooting manuals using weighted TF-IDF keyword scoring.
- **Hardware Safety Refusal System**: Emergency hazard warnings and high-voltage AC mains refusal rules.

---

## RAG Knowledge Base Manuals
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

## Technology Stack
- **Frontend Framework**: Next.js 15.5.21 (App Router)
- **UI Engine**: React 19 & React DOM 19
- **Styling**: Tailwind CSS v4 with custom hybrid-neumorphic design tokens
- **AI SDK**: `@google/genai` 2.13.0 (Server-side proxy via `/api/gemini/*`)
- **Database & Auth**: Firebase JS SDK 12.16.0 & Firebase Admin 14.2.0 (Cloud Firestore project `hekto-awm`)
- **Icons & PDF**: Lucide React & `jspdf`

---

## Local Installation & Environment Variables

Create `.env.local` using `.env.example`:

```env
# Gemini AI Configuration
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
GEMINI_DIAGNOSIS_MODEL="gemini-3.6-flash"
GEMINI_FAST_MODEL="gemini-3.5-flash-lite"
GEMINI_IMAGE_MODEL="gemini-3.1-flash-image"
GEMINI_EMBEDDING_MODEL="gemini-embedding-2"
ENABLE_REFERENCE_DIAGRAMS="false"
RAG_MODE="tfidf"

# Application URL
APP_URL="https://mecha-fix-ai.vercel.app"
NEXT_PUBLIC_APP_URL="https://mecha-fix-ai.vercel.app"

# Firebase Client Configuration (Project: hekto-awm)
NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="hekto-awm.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="hekto-awm"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="hekto-awm.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="920507935916"
NEXT_PUBLIC_FIREBASE_APP_ID="1:920507935916:web:addb2991a3546f2ea70309"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-8Q29K5XQ8H"

# Firebase Admin Credentials (Server)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"hekto-awm", ...}'
```

Run local development:

```bash
# 1. Install dependencies
npm install

# 2. Run type checking
npm run typecheck

# 3. Build production bundle
npm run build

# 4. Start production server
npm run start
```

---

## Testing & Verification Results
- `npm run typecheck`: **Passed cleanly with 0 TypeScript errors**
- `npm run build`: **Passed, 14/14 static & dynamic pages generated successfully**
- `10/10 Verification Suite`: **Passed all 10 feature assertion checks**

---

## Privacy Policy
MechaFix AI uses Google Sign-In to identify the user and protect saved diagnostic sessions.

Diagnosis records are stored in Cloud Firestore under the authenticated user's UID (`users/{userId}/diagnoses/{diagnosisId}`).

Third-party services used:
- Firebase Authentication
- Cloud Firestore (`hekto-awm`)
- Google Gemini API (`gemini-3.6-flash`)

---

## Author & License
- **Author**: Abdul Wahid Chohan ([GitHub Profile](https://github.com/abdulwahidchohan))
- **License**: MIT License. See `LICENSE` for details.

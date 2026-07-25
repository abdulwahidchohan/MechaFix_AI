# MechaFix AI - Next-Gen Hardware Diagnostic Laboratory

**MechaFix AI** is an intelligent, full-stack hardware troubleshooting assistant built for electronics engineers, makers, educators, and IoT developers. It turns complex hardware symptoms, component error codes, and breadboard photos into precise, actionable step-by-step repair protocols powered by **Gemini 2.5 Flash**, **Cloud Firestore**, and a custom **Grounding RAG Knowledge Retrieval Pipeline**.

---

## Live Application
- **Production Preview URL**: [https://ais-dev-2llyjbkfkybcj254gu23l7-114902420914.asia-southeast1.run.app](https://ais-dev-2llyjbkfkybcj254gu23l7-114902420914.asia-southeast1.run.app)

---

## Real Problem & Target Audience
Makers and engineers routinely waste hours diagnosing hardware failures caused by missing common grounds, power rail voltage dips (brownouts), missing I2C pull-up resistors, or improper motor driver pinouts. MechaFix AI synthesizes circuit logic, grounding knowledge, and visual photo inspection into immediate, safe troubleshooting steps.

---

## Core Verified Features
- **RAG Knowledge Retrieval Pipeline**: Queries 12 curated hardware troubleshooting manuals (`/knowledge/*.md`) using weighted TF-IDF keyword scoring to ground Gemini analysis and display qualitative relevance badges (Strong Match, Relevant Match, Related Source).
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
- **Hybrid Neumorphic UI & 5 Themes**: Cloud, Matcha, Peach Pop, Bubblegum, and Midnight themes.

---

## Hardware Knowledge Base (RAG Pipeline)
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

## AI System Prompt & Non-Negotiable Safety Protocols
- **Smoke / Burning Smell / Thermal Hazard**: Instructs immediate power disconnection and halts testing.
- **Exposed AC Mains (110V - 240V)**: Refuses procedural repair instructions and directs user to a licensed electrician.
- **Separation of Fact & Inference**: Distinguishes between visual photo findings and user-reported symptoms without inventing unverified pinouts or component ratings.

---

## Stable Technology Stack Used
- **Frontend Framework**: Next.js 15.4.9 (App Router) — *Stable retained version preserving App Router compatibility and eliminating late-stage migration risks*
- **UI Engine**: React 19.2.1 & React DOM 19.2.1
- **Styling & Neumorphism**: Tailwind CSS 4.1.11 with custom PostCSS plugin configuration
- **AI SDK**: `@google/genai` 2.4.0 (Server-side proxy with configurable model via `process.env.GEMINI_MODEL`, defaulting to `gemini-2.5-flash`)
- **Database & Auth**: Firebase JS SDK 12.16.0 & Firebase Admin 14.2.0 (Cloud Firestore with real-time listeners)
- **Icons & Animation**: `lucide-react` 0.553.0 & `motion` 12.23.24

---

## Required Environment Variables

```env
# Server-side Gemini API Key & Configurable Model
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.5-flash"

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

---

## Local Installation & Verification

```bash
# 1. Install dependencies
npm ci

# 2. Run static linter
npm run lint

# 3. Run type checking
npm run typecheck

# 4. Run test suite
npm run test

# 5. Build production bundle
npm run build

# 6. Start production server
npm run start
```

---

## License
MIT License. See `LICENSE` for details.

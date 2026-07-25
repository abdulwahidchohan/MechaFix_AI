# MechaFix AI - Testing & Functional Verification Plan

## Advanced Module Test Suites

### 1. Automatic Diagnostic State Machine Tests
- Current step evaluation & user result selection (`passed`, `failed`, `not_sure`, `could_not_perform`, `measurement`)
- Single next step progression
- Duplicate & stale step submission handling
- Persistence of `currentDiagnosticStep`, `diagnosticProgress`, and `activeHypotheses` in Firestore

### 2. Multiple-Image Evidence Tests
- Maximum 5 images enforcement
- Image format validation (JPG, PNG, WebP)
- 5 MB per-image payload cap
- No base64 raw data saved directly into Firestore

### 3. Annotated Image Overlay Tests
- Bounding box scale validation (0 to 1000 range check)
- Responsive alignment & window resize handling
- Severity tag categorization (`Observed`, `Possible`, `Not verified`, `Safety concern`)

### 4. Pinout Viewer Tests
- Verified pinout details for Arduino, ESP32, and Raspberry Pi Pico
- Unverified board variant disclaimer banner

### 5. Direct PDF Export Tests
- Comprehensive diagnostic report compilation
- Multi-page page-break safety
- Token and secret omission check

### 6. Reference Diagram Generation Tests
- Migration from deprecated Imagen to `gemini-3.1-flash-image`
- Safety refusal for high-voltage mains and damaged batteries
- Synthetic educational graphic disclaimer verification

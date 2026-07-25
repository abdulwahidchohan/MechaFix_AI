# MechaFix AI - Schema v2 Specification

## Document Version: 2

### DiagnosticSession
- `version`: `2`
- `id`: string
- `userId`: string
- `status`: `"draft" | "analyzing" | "in_progress" | "waiting_for_user" | "resolved" | "partially_resolved" | "needs_review" | "safety_stop" | "failed"`
- `setup`: Board & component configuration
- `evidence`: `EvidenceItem[]` (Up to 5 images/screenshots with mime, size, unusable flags, annotations)
- `initialAnalysis`: Legacy or primary AI output summary
- `currentStep`: `DiagnosticStep` (The single active test step)
- `diagnosticProgress`: `StepResult[]` (History of completed/attempted test steps)
- `activeHypotheses`: `Hypothesis[]` (Ranked potential causes with evidence for/against)
- `measurements`: `Measurement[]`
- `followUpHistory`: Messages
- `resolution`: Final outcome details
- `generatedReferences`: `GeneratedReference[]` (Synthetic AI-generated reference diagrams)
- `pinoutReferences`: `string[]` (Referenced pinout IDs)

### DiagnosticStep
- `id`: string
- `sequence`: number
- `title`: string
- `instruction`: string
- `reason`: string
- `safetyNote`: string
- `expectedResult`: string
- `resultOptions`: string[]
- `status`: `"current" | "completed" | "skipped" | "blocked" | "unsafe"`
- `requiresPowerDisconnected`: boolean
- `requiresMeasurement`: boolean
- `requestedMeasurementType`?: string

### StepResult
- `id`: string
- `stepId`: string
- `resultType`: `"passed" | "failed" | "not_sure" | "could_not_perform" | "measurement" | "text_observation" | "photo_evidence"`
- `selectedOption`: string
- `observation`?: string
- `measurementIds`?: string[]
- `evidenceIds`?: string[]
- `submittedAt`: string
- `isUserReported`: true

### ImageAnnotation (Normalized 0-1000)
- `id`: string
- `evidenceId`: string
- `label`: string
- `category`: `"board" | "sensor" | "actuator" | "power" | "connector" | "wire_region" | "damaged_region" | "unreadable_region" | "expected_test_point" | "other"`
- `box2d`: [y_min, x_min, y_max, x_max]
- `observation`: string
- `certaintyType`: `"observed" | "possible" | "not_verified" | "safety_concern"`

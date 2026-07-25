# MechaFix AI - Advanced Diagnostics Testing Suite

## Test Protocols
1. **Schema Validation Tests**: Validate `DiagnosticStep`, `StepResult`, `Hypothesis`, `EvidenceItem`, `ImageAnnotation` with normalized coordinates `0 <= val <= 1000`.
2. **Backward Compatibility Tests**: Validate `normalizeDiagnosis` converts v1 records with default fields without crashing or losing data.
3. **State Machine Step Transitions**:
   - `POST /api/diagnoses/step-result` with valid token + step verification.
   - Reject duplicate client request IDs.
   - Reassess hypotheses and return exactly one next safe step.
4. **Multiple-Image Analysis**: Validate up to 5 images, max 5MB size limit, reject invalid mimes.
5. **Annotated Image Overlay Coordinate Mapping**: Percentage calculation `top: y_min/10%`, `left: x_min/10%`, `height: (y_max - y_min)/10%`, `width: (x_max - x_min)/10%`.
6. **Pinout Record Accuracy**: Validate static pinout dataset against official source links.
7. **Direct PDF Generation**: Test PDF document creation with non-sensitive fields.
8. **Reference Image Generation**: Test `/api/gemini/generate-reference-diagram` safety filter and synthetic label disclaimers.

# MechaFix AI - Cloud Firestore Schema Specification

## Database Architecture
- **Service**: Cloud Firestore
- **Security Scope**: Strictly user-owned documents under `users/{userId}/diagnoses/{diagnosisId}`.

## Schema Definition (`users/{userId}/diagnoses/{diagnosisId}`)

| Field | Type | Description |
|---|---|---|
| `version` | string | Document schema version ("1.0") |
| `createdAt` | timestamp | Document creation timestamp |
| `updatedAt` | timestamp | Document last modified timestamp |
| `status` | string | Lifecycle state: `"in_progress"`, `"resolved"`, `"partially_resolved"` |
| `setup` | map | Board name, component label, power source, problem category |
| `originalInput` | map | User reported symptoms, expected/actual behavior, error code, notes |
| `result` | map | Gemini AI diagnostic findings (`issue_summary`, `components_detected`, `potential_causes`, `troubleshooting_steps`, `safetyLevel`, `currentDiagnosticStep`, `followUpQuestions`) |
| `resolution` | map | Resolution details (`rootCause`, `actionTaken`, `finalNote`, `resolvedAt`) |
| `followUpHistory` | array of maps | Interactive chat messages (`id`, `role`, `text`, `createdAt`) |

## Security Rules (`firestore.rules`)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
    match /users/{userId}/diagnoses/{diagnosisId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

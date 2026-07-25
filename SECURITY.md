# MechaFix AI - Security Remediation & Security Policy

## Security Remediation Log (Phase 0)
- **Secret Scan**: Verified `.gitignore` excludes `.env*`, `*.pem`, `service-account*.json`, and local credential files.
- **Key Rotation**: Exposed keys revoked/rotated. `.env.local` is isolated locally and ignored by Git. `.env.example` contains placeholders only.
- **Zero-Trust Token Verification**: Server API routes derive user identity exclusively from verified Firebase ID tokens via `firebase-admin`.
- **Secret Isolation**: `GEMINI_API_KEY` and `FIREBASE_SERVICE_ACCOUNT_KEY` are server-only environment variables and never exposed to the client bundle.
- **Data Protection**: User diagnosis sessions and evidence are strictly scoped to the authenticated user ID (`users/{userId}/diagnoses/{id}`).

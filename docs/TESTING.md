# MechaFix AI Test Architecture & Execution Guide

MechaFix AI uses Node's native test runner (`tsx --test`) to execute safe, maintainable, non-destructive automated test suites without requiring paid API keys or live production database credentials for standard test runs.

## Non-Overlapping Test Suite Architecture

```text
tests/
├── env-validation.test.ts          # Legacy & environmental regression unit tests (10 tests)
├── unit/
│   ├── config-env.test.ts          # Capability, Firebase config, Date normalization & Gemini error unit tests (6 tests)
│   ├── rag.test.ts                 # Local TF-IDF RAG retrieval & prompt safety unit tests (4 tests)
│   ├── image-annotation.test.ts    # Image validation & bounding box coordinate unit tests (2 tests)
│   └── pdf.test.ts                 # Non-destructive in-memory jsPDF report generation unit test (1 test)
├── api/
│   └── routes.test.ts              # API route handler contracts & error status mapping tests (3 tests)
├── auth-ownership/
│   └── auth-ownership.test.ts      # Token validation & User-A vs User-B ownership isolation tests (3 tests)
└── state-machine/
    └── state-machine.test.ts       # Diagnostic state machine transitions & idempotency tests (3 tests)
```

---

## Non-Overlapping Suite Summary

| Non-Overlapping Suite | Test Directory | Count | Execution Description |
| :--- | :--- | :---: | :--- |
| **Unit Tests** | `tests/unit/*.test.ts`, `tests/env-validation.test.ts` | **23** | Pure local logic, capabilities, dates, RAG, images, PDF, and error parsing. |
| **API Contract & Route Tests** | `tests/api/*.test.ts` | **3** | Handlers, `/api/capabilities`, HTTP status codes (`401`, `403`, `404`, `409`, `429`, `503`). |
| **Auth & Ownership Tests** | `tests/auth-ownership/*.test.ts` | **3** | Synthetic Bearer tokens & User-A vs User-B Firestore document isolation. |
| **State-Machine Tests** | `tests/state-machine/*.test.ts` | **3** | Step transitions, hypothesis states, progress tracking, and idempotency. |
| **Total Automated Tests** | **All non-overlapping suites** | **32** | **Main Test Suite**: Executes cleanly with 0 external credentials needed. |

> **Note on Topic Breakdown**: Topic counts (e.g. Environment & Config: 6, RAG: 4, Image: 2, PDF: 1, Legacy Env: 10) are descriptive sub-categories of the 23 unit tests and **must not be added to the 32-test total**.

---

## Command Matrix

```bash
# 1. Run unit tests only (23 tests)
npm run test:unit

# 2. Run API route handler & contract tests (3 tests)
npm run test:api

# 3. Run auth & ownership isolation tests (3 tests)
npm run test:auth

# 4. Run state-machine transition tests (3 tests)
npm run test:state

# 5. Run full automated test suite (32 tests)
npm test

# 6. Run complete CI verification pipeline (Lint -> Typecheck -> Test -> Build)
npm run verify
```

---

## Safety & Non-Destructive Principles

1. **No External Paid Calls**: Automated test suites mock Gemini API model calls to prevent incurring quota charges.
2. **No Production Database Mutation**: Tests execute in-memory with synthetic fixtures.
3. **No Hardcoded Credentials**: Tests use synthetic placeholders and verify token validation logic without exposing secret keys.
4. **Narrow PDF Scope**: The PDF unit test verifies in-memory buffer creation and field wrapping. Browser download and visual PDF layout remain covered by manual smoke testing.

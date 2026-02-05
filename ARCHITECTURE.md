
# System Architecture: INT Inc Engine

## 1. Frontend Layer (React 19)
- **Engine:** ESM-native execution via `esm.sh`.
- **State:** React Hooks with local simulation for "Live" feel.
- **PWA:** Service Worker (Stale-While-Revalidate) + Manifest.

## 2. Intelligence Layer (Google Gemini)
- **Model Binding:** Intent-based routing between Flash (fast) and Pro (complex).
- **Governance Concierge:** First-mile setup for user compliance.
- **Safety Gates:** PII detection and risk classification using `lib/governance.ts`.

## 3. Data Flow
1. **Intake:** Unstructured doc -> Gemini 2.5 Flash -> Structured JSON (DepartmentConfig).
2. **Analysis:** Structured JSON -> Gemini 3 Flash -> AIInsights.
3. **Observability:** Token usage and safety status tracked via internal metadata.

## 4. Components
- **KPICard:** Reactive visualization component.
- **OnboardingConcierge:** Modal flow for governance activation.
- **Generator:** File-to-Dashboard ingestion logic.

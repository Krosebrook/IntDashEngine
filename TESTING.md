
# Testing Strategy

## 1. Automated Suites
- **Unit (Jest):** `lib/utils.ts` (parsing), `lib/governance.ts` (risk logic).
- **Component (React Testing Library):** `OnboardingConcierge` (step transitions).
- **E2E (Playwright):** Full Golden Path (Auth -> Onboarding -> Generation).

## 2. Smoke Checks
Run `npm run smoke` (hypothetical) or manual:
1. Load `/` -> Auth works.
2. Complete Concierge -> Governance logs 'Active'.
3. Toggle 'Live Data' -> Observe values drifting.
4. Upload `sample.csv` -> Dashboard generates successfully.

## 3. Security Checks
- Inject "my email is test@example.com" into prompt -> Concierge should flag PII.
- Verify Service Worker does not cache `generativelanguage.googleapis.com`.

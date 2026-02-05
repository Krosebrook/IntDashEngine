
# Runbook & Operations

## Incident: AI Generations Failing
**Cause:** API Quota exceeded or invalid API_KEY.
**Fix:**
1. Check `process.env.API_KEY`.
2. Review Gemini usage dashboard.
3. **Fallback:** System uses `getDefaultInsights()` in `geminiService.ts`.

## Incident: PWA Not Updating
**Cause:** Service Worker stale cache.
**Fix:**
1. Deploy `sw.js` with incremented `CACHE_NAME`.
2. Users will receive `skipWaiting()` update on next session.

## Rollback Procedure
1. `git revert <commit_hash>`
2. Deploy to Vercel/Cloudflare immediately.
3. Clear CDN cache for `/sw.js` and `/manifest.json`.

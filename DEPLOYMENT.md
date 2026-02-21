
# Deployment Guide

## Repo Inventory

| Item | Value |
|------|-------|
| App type | Vite 6 + React 19 SPA (static) |
| Entry point | `index.html` → `index.tsx` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | ≥ 20 (see `.nvmrc`) |
| Package manager | npm |
| Runtime | Browser-only; no SSR or server functions |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values before running locally.

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini AI key. Obtain at [aistudio.google.com](https://aistudio.google.com/app/apikey). **Restrict by HTTP referrer in Google Cloud Console.** |

> **Security note:** This key is inlined into the client bundle at build time (Vite `define`). It is visible to anyone who inspects the built JavaScript. Mitigate this by adding an HTTP-referrer restriction for your production domain in Google Cloud Console → Credentials.

---

## Option A — Vercel (Recommended for simplicity)

Vercel auto-detects Vite projects. The `vercel.json` in the repo handles SPA routing, security headers, and service-worker cache settings.

### UI Setup

| Setting | Value |
|---------|-------|
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm install` |
| Node version | 20.x |

### Environment Variables (Vercel Dashboard → Settings → Environment Variables)

| Key | Environment |
|-----|-------------|
| `GEMINI_API_KEY` | Production, Preview, Development |

### CLI Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# First-time project setup
vercel link

# Deploy to production
vercel --prod
```

---

## Option B — Cloudflare Pages (Recommended for global edge performance)

The `wrangler.toml`, `public/_headers`, and `public/_redirects` in the repo provide full Pages configuration.

### UI Setup (Cloudflare Dashboard → Pages → Create Application)

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version (env var) | `NODE_VERSION = 20` |

### Environment Variables (Cloudflare Pages Dashboard → Settings → Environment Variables)

| Key | Environment |
|-----|-------------|
| `GEMINI_API_KEY` | Production + Preview |

### CLI Deploy (Wrangler)

```bash
# Install Wrangler
npm i -g wrangler

# Authenticate
wrangler login

# Build and deploy
npm run build
wrangler pages deploy dist --project-name int-dash-engine
```

### Local Preview (Cloudflare)

```bash
npm run build
wrangler pages dev dist --compatibility-date 2024-09-23
```

---

## Smoke Test (Both Platforms)

Run this before every production deploy:

```bash
# 1. Type-check + build + start preview
npm run smoke

# 2. In a separate terminal — verify the app loads
curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/
# Expected: 200

# 3. Verify service worker is served without cache headers
curl -sI http://localhost:4173/sw.js | grep -i cache-control
# Expected: no-store or no-cache

# 4. Verify SPA fallback works (any deep path returns 200)
curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/some/deep/path
# Expected: 200
```

---

## Deployment Checklist

### Vercel
- [ ] `GEMINI_API_KEY` set in Vercel dashboard
- [ ] Node version set to 20.x
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Smoke test passes locally (`npm run smoke`)
- [ ] HTTP Referrer restriction on API key in Google Cloud Console

### Cloudflare Pages
- [ ] `GEMINI_API_KEY` set in CF Pages dashboard
- [ ] `NODE_VERSION=20` set in CF environment variables
- [ ] Build command: `npm run build`
- [ ] Build output directory: `dist`
- [ ] Smoke test passes locally (`npm run smoke`)
- [ ] HTTP Referrer restriction on API key in Google Cloud Console

---

## Rollback Plan

### Vercel
```bash
# List recent deployments
vercel ls

# Promote a specific previous deployment to production
vercel alias set <previous-deployment-url> <your-production-domain>
```

### Cloudflare Pages
```bash
# List deployments
wrangler pages deployment list --project-name int-dash-engine

# Roll back via dashboard: Pages → Deployments → select older deploy → "Rollback to this deployment"
```

---

## Launch Health Check

After deploying to production:

1. Open the production URL — verify the dashboard renders (non-blank page).
2. Open DevTools → Application → Service Workers — verify SW is registered and active.
3. Open DevTools → Network — filter for `sw.js` — confirm `Cache-Control: no-cache` response header.
4. Open DevTools → Console — no uncaught errors.
5. AI features: click "Intelligence" on any department — verify Gemini insights load (requires valid API key).
6. Offline: toggle airplane mode → navigate → confirm the offline fallback page appears.

### Observability

- **Vercel**: Logs are in the Vercel dashboard → Deployment → Runtime Logs.
- **Cloudflare Pages**: Logs are in CF dashboard → Pages → your project → Real-time Logs.
- All errors are caught by the `ErrorBoundary` and logged to the console (structured JSON on server; browser console in SPA).

---

## Known Tradeoffs

| Item | Detail |
|------|--------|
| Bundle size | Main chunk is ~945 kB (254 kB gzipped). Consider lazy-loading department views with `React.lazy` + `Suspense` to reduce initial load. |
| API key exposure | `GEMINI_API_KEY` is client-visible. Mitigate with HTTP referrer restrictions. |
| SW precache list | The service worker precaches `index.tsx` and `manifest.json` by their dev paths; in production these paths change. The SW degrades gracefully (try-catch) but offline caching of the manifest is skipped. A future improvement is to use `vite-plugin-pwa` for build-time manifest injection. |
| No SSR | The app is a pure SPA. SEO is limited; not suitable for public search indexing without adding a prerender step. |


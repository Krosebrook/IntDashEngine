
# Deployment Targets

### 1. Vercel (Recommended)
Automatically handles the custom `importmap` and Service Worker headers.
- Build: `npm run build` (or equivalent)
- Output: `dist` or root

### 2. Cloudflare Pages
Ideal for global edge performance.
- Ensure `sw.js` is served with `Cache-Control: max-age=0, no-cache`.

### 3. Netlify
Use `netlify.toml` to set custom headers for the PWA manifest.


# Security Policy

## Auth Boundaries
All PWA caching excludes sensitive API responses. Service Worker logic is explicitly prevented from caching `generativelanguage.googleapis.com` calls to prevent PII leaks in local storage.

## Content Security Policy (CSP)
Recommended headers for production:
```
default-src 'self';
script-src 'self' 'unsafe-inline' cdn.tailwindcss.com esm.sh;
style-src 'self' 'unsafe-inline' fonts.googleapis.com;
connect-src 'self' esm.sh generativelanguage.googleapis.com api.dicebear.com;
img-src 'self' data: api.dicebear.com;
```

## Secrets
Zero secrets are hardcoded. The Gemini `API_KEY` is strictly managed via environment variables.

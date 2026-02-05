
# INT Dashboard PWA Strategy

## Overview
The INT Dashboard is designed as a production-grade PWA focusing on performance and reliability in low-connectivity enterprise environments.

## Capabilities
- **Installability**: Standalone display mode with custom icons.
- **Offline Mode**: Core dashboard assets are cached for immediate access.
- **Caching Strategy**: 
  - **Stale-While-Revalidate**: Applied to `index.tsx` and library modules to ensure the UI is fast while updating in the background.
  - **Network-First**: Applied to AI Insights to ensure fresh data whenever possible.

## Update Strategy
The Service Worker uses `skipWaiting()` and `clients.claim()` to ensure that when a new version is pushed, users are transitioned to the new assets on the next session.

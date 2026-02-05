
# Observability

## KPI Tracking
- **Lighthouse PWA Score**: Aiming for 100/100.
- **SW Registration Rate**: Tracked via console/telemetry.
- **Cache Hit Ratio**: Monitor Service Worker fetch events.

## Error Reporting
Service Worker registration failures are logged to the console. For production, integration with Sentry is recommended.

## QualityScore Formula
`QualityScore = 0.4(Lighthouse PWA) + 0.3(Offline Availability) + 0.3(Cache Efficiency)`

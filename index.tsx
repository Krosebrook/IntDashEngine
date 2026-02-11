
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// PWA Service Worker Registration with environment-aware detection
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const protocol = window.location.protocol;
    if (protocol !== 'http:' && protocol !== 'https:') {
      console.warn(`[PWA] Service Workers are not supported on the current protocol: ${protocol}. Skipping registration.`);
      return;
    }

    try {
      const currentPath = window.location.pathname;
      const directory = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
      const swUrl = `${window.location.origin}${directory}sw.js`;

      navigator.serviceWorker.register(swUrl)
        .then((registration) => {
          console.log('[PWA] ServiceWorker registered with scope:', registration.scope);
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  window.dispatchEvent(new CustomEvent('pwa-update-available'));
                }
              });
            }
          });
        })
        .catch((error) => {
          if (error.name === 'InvalidStateError' || error.message?.includes('invalid state')) {
            console.warn('[PWA] Registration skipped: Document is in an invalid state.');
          } else {
            console.error('[PWA] ServiceWorker registration failed:', error);
          }
        });
    } catch (e) {
      console.error('[PWA] Unexpected error during Service Worker setup:', e);
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

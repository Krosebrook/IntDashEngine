
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// PWA Service Worker Registration with environment-aware detection
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    /**
     * In proxied or sandboxed environments (like Google AI Studio or IDX), 
     * Service Worker registration can be tricky due to:
     * 1. Invalid State: The document might be in a 'blob:' protocol or being discarded.
     * 2. Origin Mismatch: Relative paths might resolve to the host (ai.studio) instead of the sandbox.
     * 
     * We only attempt registration on standard web protocols (http/https).
     */
    const protocol = window.location.protocol;
    
    if (protocol !== 'http:' && protocol !== 'https:') {
      console.warn(`[PWA] Service Workers are not supported on the current protocol: ${protocol}. Skipping registration.`);
      return;
    }

    try {
      /**
       * We build an absolute URL using the window's current origin and pathname 
       * to ensure we stay within the sandbox and don't leak to the host domain.
       */
      const currentPath = window.location.pathname;
      const directory = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
      const swUrl = `${window.location.origin}${directory}sw.js`;

      console.log('[PWA] Attempting registration at:', swUrl);
      
      navigator.serviceWorker.register(swUrl)
        .then((registration) => {
          console.log('[PWA] ServiceWorker registered with scope:', registration.scope);
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New content available');
                  window.dispatchEvent(new CustomEvent('pwa-update-available'));
                }
              });
            }
          });
        })
        .catch((error) => {
          // If the error is 'The document is in an invalid state', it's usually 
          // a race condition or a specific browser restriction in this context.
          if (error.name === 'InvalidStateError' || error.message?.includes('invalid state')) {
            console.warn('[PWA] Registration skipped: Document is in an invalid state (likely a sandboxed or temporary context).');
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

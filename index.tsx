
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

// Global Debug Utility for Admins
(window as any).debugCache = async () => {
  const keys = await caches.keys();
  console.group('%c 🛠 PWA Cache Diagnostics Report ', 'background: #1e293b; color: #3b82f6; padding: 4px 10px; border: 1px solid #3b82f6; border-radius: 4px; font-weight: bold;');
  
  let totalSize = 0;
  
  for (const key of keys) {
    const cache = await caches.open(key);
    const requests = await cache.keys();
    
    console.log(`%c Store: ${key} (${requests.length} items) `, 'background: #3b82f6; color: #fff; padding: 2px 6px; border-radius: 2px;');
    
    const reportData = await Promise.all(requests.map(async r => {
      const res = await cache.match(r);
      const blob = await res?.blob();
      const size = blob?.size || 0;
      totalSize += size;
      
      const ts = res?.headers.get('X-Cache-Timestamp');
      const date = ts ? new Date(parseInt(ts)) : null;
      
      return {
        URL: r.url.replace(window.location.origin, ''),
        Size: (size / 1024).toFixed(2) + ' KB',
        CachedAt: date ? date.toLocaleTimeString() : 'N/A',
        Status: date ? (Math.floor((Date.now() - date.getTime()) / 60000) < 60 ? 'Fresh' : 'Stale') : 'Unknown'
      };
    }));
    
    console.table(reportData);
  }
  
  console.log(`%c Total Storage Consumption: ${(totalSize / 1024 / 1024).toFixed(2)} MB `, 'color: #fbbf24; font-weight: bold;');
  console.groupEnd();
  return `Finished analyzing ${keys.length} cache stores.`;
};

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

'use client';

import { useEffect } from 'react';

/**
 * Service Worker Cleanup Component
 * 
 * This component unregisters any existing service workers that might be
 * causing "Failed to fetch" errors. This is useful when service workers
 * were previously registered but are no longer needed or are causing issues.
 */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Unregister all service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration
            .unregister()
            .then((success) => {
              if (success) {
                console.log('Service worker unregistered successfully');
              }
            })
            .catch((error) => {
              console.warn('Error unregistering service worker:', error);
            });
        }
      });

      // Also clear service worker cache
      if ('caches' in window) {
        caches
          .keys()
          .then((cacheNames) => {
            return Promise.all(
              cacheNames.map((cacheName) => {
                return caches.delete(cacheName);
              })
            );
          })
          .then(() => {
            console.log('Service worker caches cleared');
          })
          .catch((error) => {
            console.warn('Error clearing service worker caches:', error);
          });
      }
    }
  }, []);

  return null;
}


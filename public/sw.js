/**
 * TdyTime PWA — Zero-Dependency Service Worker (TdyTripZ Architecture)
 *
 * Design Principles:
 * 1. Tier A (App Shell & Icons) + Tier B (Core Offline Features: Schedule, Exams, Statistics, Notes, Settings)
 *    are 100% precached and atomically verified during `install`.
 * 2. Tier C (Heavy On-Demand Chunks: PDF Report Engine / Fonts / Excel / DevTools) are cached on-demand
 *    via Cache-First the first time the user invokes them, making initial PWA install 3x faster.
 * 3. Prompt-before-reload update control: Updates wait in `waiting` state until the user confirms reload
 *    in PWAUpdateHandler (`{ type: 'SKIP_WAITING' }`).
 * 4. Retains 1 adjacent previous cache (`N-1`) during `activate` to prevent `ChunkLoadError` on active tabs.
 * 5. Strips cache-busting & tracking parameters (`?v=`, `?utm_*`, `?fbclid`) when matching cached shell assets.
 */

const CACHE_NAME = 'tdytime-pwa-v2026.11.09';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg?v=2026.11',
  '/apple-touch-icon.png?v=2026.11',
  '/pwa-64x64.png?v=2026.11',
  '/pwa-192x192.png?v=2026.11',
  '/pwa-512x512.png?v=2026.11',
  '/pwa-maskable-192x192.png?v=2026.11',
  '/pwa-maskable-512x512.png?v=2026.11',
];

const WARM_CACHE_URLS = [];

const IGNORED_QUERY_PARAM_PATTERNS = [/^v$/, /^utm_/i, /^fbclid$/i];

function normalizeCacheUrl(rawUrl) {
  const url = new URL(rawUrl, self.location.origin);
  if (url.origin === self.location.origin) {
    for (const key of Array.from(url.searchParams.keys())) {
      if (IGNORED_QUERY_PARAM_PATTERNS.some((rx) => rx.test(key))) {
        url.searchParams.delete(key);
      }
    }
  }
  return url.toString();
}

async function cacheAssetUrl(cache, url) {
  const isHashedAsset = url.startsWith('/assets/');
  const response = await fetch(url, { cache: isHashedAsset ? 'force-cache' : 'no-cache' });
  if (!response || response.status !== 200) {
    throw new Error(`Precache failed for required offline asset: ${url}`);
  }
  await cache.put(url, response.clone());
  const normalized = normalizeCacheUrl(url);
  if (normalized !== new URL(url, self.location.origin).toString()) {
    await cache.put(normalized, response.clone());
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(PRECACHE_URLS.map((url) => cacheAssetUrl(cache, url)));

      for (const requiredUrl of PRECACHE_URLS) {
        const matched = await cache.match(requiredUrl);
        if (!matched) {
          throw new Error(`Verification failed for required offline asset: ${requiredUrl}`);
        }
      }

      // Activate immediately only on initial installation (no existing active controller).
      // For subsequent updates, stay in `waiting` state until user confirms reload (`SKIP_WAITING`).
      if (!self.registration.active) {
        await self.skipWaiting();
      }
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        const oldKeys = keys.filter((key) => key !== CACHE_NAME).sort();
        // Retain at most 1 adjacent previous cache (N-1) so open tabs mid-session
        // can still load lazy chunks offline without throwing ChunkLoadError.
        const keysToDelete = oldKeys.length > 1 ? oldKeys.slice(0, oldKeys.length - 1) : [];
        return Promise.all(keysToDelete.map((key) => caches.delete(key)));
      })
      .then(() => self.clients.claim())
      .then(async () => {
        // Gently warm Tier B route chunks sequentially in background without blocking activation
        if (WARM_CACHE_URLS.length > 0) {
          try {
            const cache = await caches.open(CACHE_NAME);
            for (const url of WARM_CACHE_URLS) {
              const existing = await cache.match(url);
              if (!existing) {
                await cacheAssetUrl(cache, url).catch(() => {});
              }
            }
          } catch {
            // Non-fatal background warmup
          }
        }
      })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip version check endpoint, Vite dev internals, and API routes
  if (
    url.pathname === '/version.json' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return;
  }

  const isStaticShellIconOrManifest =
    url.origin === self.location.origin &&
    /\.(svg|png|ico|webmanifest)$/i.test(url.pathname);

  const isImmutableOrOnDemandAsset =
    url.pathname.startsWith('/assets/') ||
    isStaticShellIconOrManifest ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';

  // Cache-First strategy for hashed build assets, static shell icons/manifest, and Google Fonts
  if (isImmutableOrOnDemandAsset) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        if (cached) return cached;
        if (isStaticShellIconOrManifest) {
          const normCached = await caches.match(normalizeCacheUrl(request.url));
          if (normCached) return normCached;
        }
        return fetch(request).then((response) => {
          const isCacheable =
            response &&
            (response.status === 200 || response.status === 0) &&
            (response.type === 'basic' || response.type === 'cors' || response.type === 'opaque');
          if (isCacheable) {
            const copy = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, copy.clone());
                if (isStaticShellIconOrManifest) {
                  const normalized = normalizeCacheUrl(request.url);
                  if (normalized !== request.url) {
                    cache.put(normalized, copy);
                  }
                }
              })
              .catch(() => {});
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-First strategy with offline cache fallback (and query param normalization) for HTML navigation & App Shell
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, copy.clone());
              const normalized = normalizeCacheUrl(request.url);
              if (normalized !== request.url) {
                cache.put(normalized, copy);
              }
            })
            .catch(() => {});
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          const normalized = normalizeCacheUrl(request.url);
          return caches.match(normalized).then((normCached) => {
            if (normCached) return normCached;
            if (request.mode === 'navigate') {
              return caches.match('/index.html').then((idx) => idx || caches.match('/'));
            }
            return caches.match('/');
          });
        })
      )
  );
});

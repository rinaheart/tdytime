VitePWA({
  registerType: 'prompt',

  includeAssets: [
    'favicon.svg',
    'pwa-192x192.png',
    'pwa-512x512.png',
  ],

  manifest: {
    name: 'TdyTime - Phân tích Lịch giảng',
    short_name: 'TdyTime',
    description: 'Công cụ Phân tích và Quản lý Lịch giảng thông minh.',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },

  workbox: {
    // ===== CORE =====
    globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/api/],

    cleanupOutdatedCaches: true,
    clientsClaim: false,
    skipWaiting: false,

    // Giữ mức hợp lý để tránh cache bundle quá lớn
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,

    // Optional (bật nếu muốn future-proof, không critical với SWR)
    navigationPreload: false,

    // ===== RUNTIME CACHING =====
    runtimeCaching: [
      /**
       * 1. HTML Navigation (App Shell)
       * Instant load + background update
       */
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'tdytime-html-v1',
          plugins: [
            {
              cacheWillUpdate: async ({ response }) => {
                // chỉ cache response hợp lệ
                if (response && response.status === 200) return response;
                return null;
              },
            },
          ],
        },
      },

      /**
       * 2. JS / CSS (Hashed assets → CacheFirst)
       */
      {
        urlPattern: ({ request }) =>
          request.destination === 'script' ||
          request.destination === 'style',
        handler: 'CacheFirst',
        options: {
          cacheName: 'tdytime-static-v1',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },

      /**
       * 3. Images
       */
      {
        urlPattern: ({ request }) => request.destination === 'image',
        handler: 'CacheFirst',
        options: {
          cacheName: 'tdytime-images-v1',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },

      /**
       * 4. Fonts (Google)
       */
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'tdytime-fonts-css',
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'tdytime-fonts-files',
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },

      /**
       * 5. API (future-ready)
       * Không cache aggressive để tránh stale data
       */
      {
        urlPattern: /^\/api\/.*$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'tdytime-api',
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 60 * 5, // 5 phút
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },

  devOptions: {
    enabled: true,
    type: 'module',
  },
})
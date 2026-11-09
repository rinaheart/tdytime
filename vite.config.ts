import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const isAIStudio = Boolean(
    process.env.APPLET_ID ||
    process.env.K_SERVICE ||
    process.env.DISABLE_HMR === 'true'
);

export default defineConfig({
    optimizeDeps: {
        include: ['react', 'react-dom', '@react-pdf/renderer'],
    },

    define: {
        global: 'window',
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
        __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: true,
        forwardConsole: false,
        hmr: !isAIStudio,
        watch: isAIStudio ? null : {},
    },

    preview: {
        port: 3000,
        host: '0.0.0.0',
    },

    plugins: [
        react(),

        VitePWA({
            registerType: 'prompt', // ✔ giữ control update bằng UI của bạn

            includeAssets: [
                'favicon.svg',
                'apple-touch-icon.png',
                'pwa-64x64.png',
                'pwa-192x192.png',
                'pwa-512x512.png',
                'pwa-maskable-192x192.png',
                'pwa-maskable-512x512.png',
                'screenshots/desktop-welcome.png',
                'screenshots/mobile-today.png',
            ],

            manifest: {
                id: '/tdytime',
                name: 'TdyTime - Your Today, Your Time',
                short_name: 'TdyTime',
                description: 'Phân tích và Quản lý Lịch giảng thông minh - Your Today, Your Time',
                lang: 'vi',
                dir: 'ltr',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'any',
                start_url: '/',
                scope: '/',
                form_factors: ['wide', 'narrow'],
                display_override: ['standalone', 'window-controls-overlay'],
                icons: [
                    {
                        src: '/pwa-64x64.png?v=2026.11',
                        sizes: '64x64',
                        type: 'image/png',
                        purpose: 'any',
                    },
                    {
                        src: '/pwa-192x192.png?v=2026.11',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any',
                    },
                    {
                        src: '/pwa-512x512.png?v=2026.11',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any',
                    },
                    {
                        src: '/pwa-maskable-192x192.png?v=2026.11',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                    {
                        src: '/pwa-maskable-512x512.png?v=2026.11',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
                screenshots: [
                    {
                        src: '/screenshots/desktop-welcome.png',
                        sizes: '1280x720',
                        type: 'image/png',
                        form_factor: 'wide',
                        label: 'TdyTime - Desktop',
                    },
                    {
                        src: '/screenshots/mobile-today.png',
                        sizes: '390x844',
                        type: 'image/png',
                        form_factor: 'narrow',
                        label: 'TdyTime - Mobile',
                    },
                ],
                categories: ['education', 'productivity', 'utilities'],
                prefer_related_applications: false,
            },

            workbox: {
                globPatterns: process.env.NODE_ENV === 'production' 
                    ? ['**/*.{js,css,html,ico,png,svg,json,woff2}']
                    : [],
                ignoreURLParametersMatching: [/^v$/, /^utm_/, /^fbclid$/],
                navigateFallback: '/index.html',
                navigateFallbackDenylist: [/^\/api/],
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                navigationPreload: false, // Disabled — not needed with CacheFirst

                cleanupOutdatedCaches: true,
                clientsClaim: false,
                skipWaiting: false,

                runtimeCaching: [
                    // HTML — CacheFirst: instant open, offline-first
                    // Update flow: new deploy → SW detects precache diff → installs in background
                    // → PWAUpdateHandler shows toast → user clicks update → reload
                    {
                        urlPattern: ({ request }) => request.mode === 'navigate',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'html-shell-cache',
                            plugins: [
                                {
                                    cacheWillUpdate: async ({ response }) => {
                                        return response && response.status === 200 ? response : null;
                                    },
                                },
                            ],
                        },
                    },

                    // Static assets (JS/CSS)
                    {
                        urlPattern: ({ request }) =>
                            request.destination === 'script' ||
                            request.destination === 'style',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'static-assets',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 * 30,
                            },
                        },
                    },

                    // Google Fonts CSS
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365,
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },

                    // Google Fonts files
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365,
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
            },

            devOptions: {
                enabled: false,
                type: 'module',
            },
        }),
        {
            name: 'dev-sw-cleanup',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    if (req.url && (req.url.startsWith('/dev-sw.js') || req.url.startsWith('/sw.js'))) {
                        res.setHeader('Content-Type', 'application/javascript');
                        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
                        res.end(`
self.addEventListener('install', () => {
    self.skipWaiting();
});
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
            .then(() => self.registration.unregister())
            .then(() => self.clients.matchAll({ type: 'window' }))
            .then((clients) => {
                clients.forEach((client) => {
                    if ('navigate' in client) client.navigate(client.url);
                });
            })
    );
});
`);
                        return;
                    }
                    next();
                });
            },
            transform(code, id) {
                if (id.includes('vite/dist/client/client.mjs')) {
                    let patched = code
                        .replace('ws.send(JSON.stringify(data))', 'ws?.send(JSON.stringify(data))')
                        .replace('if (!options.enabled) return;', 'return;');
                    if (isAIStudio) {
                        patched = patched
                            .replace(
                                'transport.connect(createHMRHandler(handleMessage));',
                                '// HMR WebSocket disabled in AI Studio preview'
                            )
                            .replace(
                                'else throw new SendBeforeConnectError("send was called before connect");',
                                'else return;'
                            );
                    }
                    return {
                        code: patched,
                        map: null,
                    };
                }
            },
        },
    ],

    build: {
        target: 'esnext',
        minify: 'terser',
        reportCompressedSize: false,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        // React core only (~140KB instead of 341KB)
                        if (
                            id.includes('/react/') ||
                            id.includes('/react-dom/') ||
                            id.includes('/scheduler/')
                        ) {
                            return 'vendor-react';
                        }
                        // i18n — separate chunk
                        if (id.includes('i18next') || id.includes('react-i18next')) {
                            return 'vendor-i18n';
                        }
                        if (id.includes('react-router')) {
                            return 'vendor-router';
                        }
                        if (id.includes('lucide-react') || id.includes('zustand')) {
                            return 'vendor-utils';
                        }
                        // Vercel monitoring — separate to defer loading
                        if (
                            id.includes('@vercel/analytics') ||
                            id.includes('@vercel/speed-insights')
                        ) {
                            return 'vendor-monitoring';
                        }
                        if (id.includes('@react-pdf/renderer')) {
                            return 'vendor-pdf';
                        }
                    }
                },
            },
        },

        chunkSizeWarningLimit: 1500,

        modulePreload: {
            polyfill: true,
        },
    },

    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, './src'),
        },
    },

    test: {
        environment: 'jsdom',
        setupFiles: ['./src/setupTests.ts'],
        globals: true
    }
});
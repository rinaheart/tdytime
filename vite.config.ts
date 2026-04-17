import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
        __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    server: {
        port: 3000,
        host: '0.0.0.0',
        forwardConsole: true,
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
                'pwa-192x192.png',
                'pwa-512x512.png',
            ],

			manifest: {
				id: '/tdytime', // ← Explicit App ID (tránh conflict khi update)
				name: 'TdyTime - Your Today, Your Time',
				short_name: 'TdyTime',
				description: 'Your Today, Your Time',
				theme_color: '#ffffff',
				background_color: '#ffffff',
				display: 'standalone',
				start_url: '/',
				
				// 🎯 Richer Install UI: Support both desktop & mobile
				form_factors: ['wide', 'narrow'],
				
				// Optional: Enable Window Controls Overlay on desktop PWA
				display_override: ['standalone', 'window-controls-overlay'],

				icons: [
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any',
					},
					// Recommended: Add maskable icon for adaptive launcher icons
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable',
					},
				],

				// 📸 Screenshots for App Store-like Install Prompt
				screenshots: [
					{
						src: '/screenshots/desktop-welcome.png',
						sizes: '1280x720',
						type: 'image/png',
						form_factor: 'wide',
						label: 'TdyTime - Upload & quản lý lịch giảng trên Desktop'
					},
					{
						src: '/screenshots/mobile-today.png',
						sizes: '390x844',
						type: 'image/png',
						form_factor: 'narrow',
						label: 'TdyTime - Xem lịch hôm nay trên Mobile'
					}
				],

				// Optional: Protocol handler for deep-linking (ví dụ: tdytime://load?url=...)
				protocol_handlers: [{
					protocol: 'web+tdytime',
					url: '/?source=%s'
				}],

				// Optional: Categories for app store discovery
				categories: ['education', 'productivity', 'utilities'],
				
				// Optional: Prefer related applications (nếu có native app sau này)
				prefer_related_applications: false,
			},

            workbox: {
                globPatterns: process.env.NODE_ENV === 'production' 
                    ? ['**/*.{js,css,html,ico,png,svg,json,woff2}']
                    : [],
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
                enabled: true,
                type: 'module',
            },
        }),
    ],

    build: {
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
                        if (id.includes('lucide-react') || id.includes('zustand') || id.includes('@tanstack')) {
                            return 'vendor-utils';
                        }
                        // Vercel monitoring — separate to defer loading
                        if (
                            id.includes('@vercel/analytics') ||
                            id.includes('@vercel/speed-insights')
                        ) {
                            return 'vendor-monitoring';
                        }
                    }
                },
            },
        },

        chunkSizeWarningLimit: 1000,

        modulePreload: {
            polyfill: false,
        },
    },

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
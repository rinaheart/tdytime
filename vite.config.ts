import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const isAIStudio = Boolean(
    process.env.APPLET_ID ||
    process.env.K_SERVICE ||
    process.env.DISABLE_HMR === 'true'
);

/**
 * Zero-Dependency Custom PWA Plugin (TdyTripZ Architecture adapted for TdyTime)
 * 1. Syncs `version` from package.json into `public/version.json` and `CACHE_NAME` in `public/sw.js`.
 * 2. On `closeBundle`, scans `dist/assets/` and injects Tier A/B built assets into `dist/sw.js` `PRECACHE_URLS`,
 *    while leaving Tier C Heavy Chunks (PDF Engine, Fonts, Excel, DevTools) for Cache-on-Demand.
 */
function tdyTimePwaPlugin(): Plugin {
    const syncVersionMetadata = () => {
        try {
            const pkgPath = path.resolve(rootDir, 'package.json');
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { version?: string };
            const version = pkg.version;
            if (!version) return;

            // 1. Sync to public/version.json
            const versionJsonPath = path.resolve(rootDir, 'public/version.json');
            const nextJson = JSON.stringify({ version }, null, 2) + '\n';
            if (!fs.existsSync(versionJsonPath) || fs.readFileSync(versionJsonPath, 'utf-8') !== nextJson) {
                fs.writeFileSync(versionJsonPath, nextJson);
            }

            // 2. Sync CACHE_NAME in public/sw.js
            const swPath = path.resolve(rootDir, 'public/sw.js');
            if (fs.existsSync(swPath)) {
                const swContent = fs.readFileSync(swPath, 'utf-8');
                const nextSw = swContent.replace(
                    /const CACHE_NAME\s*=\s*['"][^'"]+['"];/,
                    `const CACHE_NAME = 'tdytime-pwa-v${version}';`
                );
                if (swContent !== nextSw) {
                    fs.writeFileSync(swPath, nextSw);
                }
            }
        } catch {
            // Ignore non-fatal sync errors
        }
    };

    const injectBuiltAssetsIntoDistSw = () => {
        try {
            const distDir = path.resolve(rootDir, 'dist');
            const distSwPath = path.resolve(distDir, 'sw.js');
            const assetsDir = path.resolve(distDir, 'assets');
            if (!fs.existsSync(distSwPath) || !fs.existsSync(assetsDir)) return;

            // Tier A (Core Entry Bundles — already in browser HTTP cache from initial load, 0ms force-cache install)
            const TIER_A_CORE_ENTRY_PREFIXES = [
                'index-',
                'rolldown-runtime-',
                'vendor-react-',
                'vendor-router-',
                'vendor-i18n-',
                'vendor-utils-',
            ];

            // Tier C (Cache-on-Demand): Heavy optional chunks (~2.3MB combined) are cached on first use
            // via Cache-First in sw.js, making initial PWA install 3x faster.
            const TIER_C_ON_DEMAND_PREFIXES = [
                'vendor-pdf-',
                'react-pdf.browser-',
                'ScheduleReport-',
                'Roboto-',
                'DevToolsView-',
                'exceljs-',
                'vendor-monitoring-',
                'FileSaver.min-',
            ];

            const allBuildAssets = fs
                .readdirSync(assetsDir)
                .filter((file) => /\.(js|css|svg|png|jpg|jpeg|webp|woff2?)$/i.test(file))
                .filter((file) => !TIER_C_ON_DEMAND_PREFIXES.some((prefix) => file.startsWith(prefix)))
                .sort();

            if (allBuildAssets.length === 0) return;

            const tierAAssets = allBuildAssets
                .filter((file) => TIER_A_CORE_ENTRY_PREFIXES.some((prefix) => file.startsWith(prefix)))
                .map((file) => `/assets/${file}`);

            const tierBAssets = allBuildAssets
                .filter((file) => !TIER_A_CORE_ENTRY_PREFIXES.some((prefix) => file.startsWith(prefix)))
                .map((file) => `/assets/${file}`);

            let swContent = fs.readFileSync(distSwPath, 'utf-8');
            const precacheMatch = swContent.match(/const PRECACHE_URLS\s*=\s*\[([\s\S]*?)\];/);
            if (precacheMatch) {
                const existingUrls = Array.from(precacheMatch[1].matchAll(/['"]([^'"]+)['"]/g)).map((m) => m[1]);
                const mergedUrls = Array.from(new Set([...existingUrls, ...tierAAssets]));
                const formattedPrecache = `const PRECACHE_URLS = [\n${mergedUrls.map((u) => `  '${u}',`).join('\n')}\n];`;
                swContent = swContent.replace(/const PRECACHE_URLS\s*=\s*\[[\s\S]*?\];/, formattedPrecache);
            }

            if (tierBAssets.length > 0 && /const WARM_CACHE_URLS\s*=\s*\[[\s\S]*?\];/.test(swContent)) {
                const formattedWarm = `const WARM_CACHE_URLS = [\n${tierBAssets.map((u) => `  '${u}',`).join('\n')}\n];`;
                swContent = swContent.replace(/const WARM_CACHE_URLS\s*=\s*\[[\s\S]*?\];/, formattedWarm);
            }

            fs.writeFileSync(distSwPath, swContent);
        } catch {
            // Ignore post-build injection errors
        }
    };

    return {
        name: 'tdytime-zero-dep-pwa',
        buildStart: syncVersionMetadata,
        handleHotUpdate: syncVersionMetadata,
        closeBundle: injectBuiltAssetsIntoDistSw,
    };
}

export default defineConfig(({ command, mode }) => {
    if (command === 'build' || mode === 'production') {
        process.env.NODE_ENV = 'production';
    }

    return {
    optimizeDeps: {
        include: ['react', 'react-dom'],
    },

    define: {
        global: 'window',
        'process.env.NODE_ENV': JSON.stringify(command === 'build' || mode === 'production' ? 'production' : 'development'),
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
        tdyTimePwaPlugin(),
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
                manualChunks(rawId) {
                    const id = rawId.replace(/\\/g, '/');
                    if (id.includes('node_modules')) {
                        // React core + JSX runtime (strictly root node_modules to avoid nested @react-pdf/reconciler/node_modules/scheduler or zustand/esm/react)
                        if (
                            id.includes('/node_modules/react/') ||
                            id.includes('/node_modules/react-dom/') ||
                            id.includes('/node_modules/scheduler/')
                        ) {
                            return 'vendor-react';
                        }
                        // Note: Do NOT manually group @react-pdf into a manualChunk here.
                        // Because @react-pdf/renderer is exclusively imported via dynamic import(),
                        // Rolldown automatically splits it into an isolated async chunk (react-pdf.browser-*.js)
                        // without ever hoisting static CJS wrappers (require_jsx_runtime) into it under NODE_ENV=production.
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
                        if (id.includes('exceljs')) {
                            return 'exceljs';
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
            '@': path.resolve(rootDir, './src'),
        },
    },

    test: {
        environment: 'jsdom',
        setupFiles: ['./src/setupTests.ts'],
        globals: true,
    },
    };
});
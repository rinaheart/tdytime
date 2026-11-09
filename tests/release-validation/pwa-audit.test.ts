/**
 * PWA & Lighthouse CI Audit Verification Suite (Zero-Dependency TdyTripZ Architecture)
 *
 * Validates:
 * 1. Zero-Dependency PWA setup in package.json (no vite-plugin-pwa / workbox-window bloat) & Node 26 LTS
 * 2. GitHub Action workflows (.github/workflows/audit.yml & ci.yml) & lighthouserc.json configuration
 * 3. Complete PWA icon asset suite (dimensions, bit-depth, SVG, Apple Touch Icon, Any & Maskable icons)
 * 4. HTML head PWA & iOS Safari compliance, manifest link, and CSP inline script SHA-256 integrity
 * 5. Static Web App Manifest (public/manifest.webmanifest), Tiered Service Worker (public/sw.js),
 *    version sync (public/version.json), and tdyTimePwaPlugin in vite.config.ts
 * 6. Native SW Update/Sync action ("Cập nhật/Đồng bộ") with draft flush & calendar store re-hydration
 * 7. Strict package.json <-> package-lock.json parity and CalVer README badge
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '../..');

function readPngHeader(relPath: string) {
    const absPath = resolve(ROOT_DIR, relPath);
    expect(existsSync(absPath)).toBe(true);
    const buf = readFileSync(absPath);
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    expect(buf[0]).toBe(0x89);
    expect(buf.toString('ascii', 1, 4)).toBe('PNG');
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    const bitDepth = buf[24];
    const colorType = buf[25];
    return { width, height, bitDepth, colorType, byteLength: buf.length };
}

describe('PWA & Lighthouse CI Audit Verification (Zero-Dependency TdyTripZ Architecture)', () => {
    it('1. package.json uses Zero-Dependency PWA architecture (free of vite-plugin-pwa / workbox-window) and engines.node (>=22.0.0)', () => {
        const pkg = JSON.parse(readFileSync(resolve(ROOT_DIR, 'package.json'), 'utf-8'));
        expect(pkg.devDependencies['vite-plugin-pwa']).toBeUndefined();
        expect(pkg.dependencies['workbox-window']).toBeUndefined();
        expect(pkg.engines.node).toBe('>=22.0.0');
        expect(pkg.scripts['test:perf']).toBe('lhci autorun');

        expect(readFileSync(resolve(ROOT_DIR, '.nvmrc'), 'utf-8').trim()).toBe('26');
        expect(readFileSync(resolve(ROOT_DIR, '.node-version'), 'utf-8').trim()).toBe('26');
    });

    it('2. .github/workflows/audit.yml, ci.yml, and lighthouserc.json are configured with Node 26 LTS', () => {
        const workflowPath = resolve(ROOT_DIR, '.github/workflows/audit.yml');
        expect(existsSync(workflowPath)).toBe(true);
        const workflowYaml = readFileSync(workflowPath, 'utf-8');

        expect(workflowYaml).toContain('push:');
        expect(workflowYaml).toContain('"main"');
        expect(workflowYaml).toContain("node-version: '26'");
        expect(workflowYaml).toContain('npm run build');
        expect(workflowYaml).toContain('treosh/lighthouse-ci-action@v12');
        expect(workflowYaml).toContain('./lighthouserc.json');

        const ciYaml = readFileSync(resolve(ROOT_DIR, '.github/workflows/ci.yml'), 'utf-8');
        expect(ciYaml).toContain("node-version: '26'");

        const lhrcPath = resolve(ROOT_DIR, 'lighthouserc.json');
        expect(existsSync(lhrcPath)).toBe(true);
        const lhrc = JSON.parse(readFileSync(lhrcPath, 'utf-8'));

        expect(lhrc.ci.collect.staticDistDir).toBe('./dist');
        expect(lhrc.ci.collect.settings.onlyCategories).toEqual(
            expect.arrayContaining(['performance', 'accessibility', 'best-practices'])
        );
        expect(lhrc.ci.assert.assertions['categories:performance']).toBeDefined();
        expect(lhrc.ci.assert.assertions['categories:accessibility']).toBeDefined();
        expect(lhrc.ci.assert.assertions['categories:best-practices']).toBeDefined();
    });

    it('3. All PWA icons and screenshots exist with valid PNG headers, dimensions, and 8-bit color depth', () => {
        // Vector SVG
        const svgPath = resolve(ROOT_DIR, 'public/favicon.svg');
        expect(existsSync(svgPath)).toBe(true);
        const svgContent = readFileSync(svgPath, 'utf-8');
        expect(svgContent).toContain('<svg');
        expect(svgContent).toContain('#0358d5');

        // PNG Icon Suite
        const iconSpecs = [
            { path: 'public/pwa-64x64.png', width: 64, height: 64 },
            { path: 'public/apple-touch-icon.png', width: 180, height: 180 },
            { path: 'public/pwa-192x192.png', width: 192, height: 192 },
            { path: 'public/pwa-512x512.png', width: 512, height: 512 },
            { path: 'public/pwa-maskable-192x192.png', width: 192, height: 192 },
            { path: 'public/pwa-maskable-512x512.png', width: 512, height: 512 },
            { path: 'public/screenshots/desktop-welcome.png', width: 1280, height: 720 },
            { path: 'public/screenshots/mobile-today.png', width: 390, height: 844 },
        ];

        for (const spec of iconSpecs) {
            const info = readPngHeader(spec.path);
            expect(info.width).toBe(spec.width);
            expect(info.height).toBe(spec.height);
            expect(info.bitDepth).toBe(8);
            expect(info.byteLength).toBeGreaterThan(200);
        }
    });

    it('4. index.html includes complete PWA & iOS Safari meta tags, manifest link, and preserves CSP inline script SHA-256 hash', () => {
        const html = readFileSync(resolve(ROOT_DIR, 'index.html'), 'utf-8');
        expect(html).toContain('name="theme-color"');
        expect(html).toContain('name="mobile-web-app-capable" content="yes"');
        expect(html).toContain('name="apple-mobile-web-app-capable" content="yes"');
        expect(html).toContain('name="apple-mobile-web-app-title" content="TdyTime"');
        expect(html).toContain('rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2026.11"');
        expect(html).toContain('rel="icon" type="image/svg+xml" href="/favicon.svg?v=2026.11"');
        expect(html).toContain('rel="manifest" href="/manifest.webmanifest"');

        // Verify CSP SHA-256 match with vercel.json
        const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
        expect(scriptMatch).not.toBeNull();
        const hash = 'sha256-' + createHash('sha256').update(scriptMatch![1]).digest('base64');

        const vercelConfig = JSON.parse(readFileSync(resolve(ROOT_DIR, 'vercel.json'), 'utf-8'));
        const cspHeader = vercelConfig.headers
            .flatMap((h: { headers: Array<{ key: string; value: string }> }) => h.headers)
            .find((h: { key: string; value: string }) => h.key === 'Content-Security-Policy');
        expect(cspHeader?.value).toContain(hash);
    });

    it('5. public/manifest.webmanifest, public/sw.js, public/version.json, and vite.config.ts implement TdyTripZ Zero-Dependency PWA architecture', () => {
        const pkg = JSON.parse(readFileSync(resolve(ROOT_DIR, 'package.json'), 'utf-8'));
        const versionJson = JSON.parse(readFileSync(resolve(ROOT_DIR, 'public/version.json'), 'utf-8'));
        expect(versionJson.version).toBe(pkg.version);

        const manifest = JSON.parse(readFileSync(resolve(ROOT_DIR, 'public/manifest.webmanifest'), 'utf-8'));
        expect(manifest.id).toBe('/tdytime');
        expect(manifest.short_name).toBe('TdyTime');
        expect(manifest.start_url).toBe('/');
        expect(manifest.scope).toBe('/');
        expect(manifest.display).toBe('standalone');
        expect(manifest.icons).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ src: '/pwa-192x192.png?v=2026.11', purpose: 'any' }),
                expect.objectContaining({ src: '/pwa-512x512.png?v=2026.11', purpose: 'any' }),
                expect.objectContaining({ src: '/pwa-maskable-192x192.png?v=2026.11', purpose: 'maskable' }),
                expect.objectContaining({ src: '/pwa-maskable-512x512.png?v=2026.11', purpose: 'maskable' }),
            ])
        );

        const swCode = readFileSync(resolve(ROOT_DIR, 'public/sw.js'), 'utf-8');
        expect(swCode).toContain(`const CACHE_NAME = 'tdytime-pwa-v${pkg.version}';`);
        expect(swCode).toContain("event.data.type === 'SKIP_WAITING'");
        expect(swCode).toContain('oldKeys.length > 1 ? oldKeys.slice(0, oldKeys.length - 1) : []');
        expect(swCode).toContain('normalizeCacheUrl');

        const viteConfig = readFileSync(resolve(ROOT_DIR, 'vite.config.ts'), 'utf-8');
        expect(viteConfig).not.toContain('vite-plugin-pwa');
        expect(viteConfig).toContain('tdyTimePwaPlugin');
        expect(viteConfig).toContain('TIER_C_ON_DEMAND_PREFIXES');
        expect(viteConfig).toContain("'exceljs-'");
    });

    it('6. Update/Sync action re-fetches critical calendar data and forces a Native Service Worker update check', () => {
        const viJson = JSON.parse(readFileSync(resolve(ROOT_DIR, 'src/i18n/locales/vi.json'), 'utf-8'));
        const enJson = JSON.parse(readFileSync(resolve(ROOT_DIR, 'src/i18n/locales/en.json'), 'utf-8'));
        expect(viJson.pwa.update_check).toBe('Cập nhật/Đồng bộ');
        expect(enJson.pwa.update_check).toBe('Update/Sync');

        const handlerCode = readFileSync(resolve(ROOT_DIR, 'src/app/PWAUpdateHandler.tsx'), 'utf-8');
        expect(handlerCode).not.toContain('virtual:pwa-register');
        expect(handlerCode).toContain('useScheduleStore.getState().initFromStorage()');
        expect(handlerCode).toContain('useExamStore.persist?.rehydrate?.()');
        expect(handlerCode).toContain('useNotesStore.persist?.rehydrate?.()');
        expect(handlerCode).toContain('await registration.update()');
        expect(handlerCode).toContain("postMessage({ type: 'SKIP_WAITING' })");
        expect(handlerCode).toContain('draftService.flushAll()');
    });

    it('7. package.json and package-lock.json are strictly synchronized (prevents npm ci failures) and README badge supports CalVer', () => {
        const pkg = JSON.parse(readFileSync(resolve(ROOT_DIR, 'package.json'), 'utf-8'));
        const lock = JSON.parse(readFileSync(resolve(ROOT_DIR, 'package-lock.json'), 'utf-8'));
        const rootLockPkg = lock.packages?.[''];

        expect(rootLockPkg).toBeDefined();
        expect(rootLockPkg.dependencies).toEqual(pkg.dependencies);
        expect(rootLockPkg.devDependencies).toEqual(pkg.devDependencies);

        // Ensure every declared dependency and devDependency is resolved in node_modules of lockfile
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        for (const depName of Object.keys(allDeps)) {
            expect(lock.packages?.[`node_modules/${depName}`]).toBeDefined();
        }

        // Verify vite-plugin-pwa and workbox-window are completely removed from lockfile
        expect(lock.packages?.['node_modules/vite-plugin-pwa']).toBeUndefined();
        expect(lock.packages?.['node_modules/workbox-window']).toBeUndefined();

        // Verify README version badge uses dynamic JSON query compatible with CalVer (e.g. 2026.11.05)
        const readme = readFileSync(resolve(ROOT_DIR, 'README.md'), 'utf-8');
        expect(readme).not.toContain('img.shields.io/github/package-json/v/');
        expect(readme).toContain('img.shields.io/badge/dynamic/json');
    });
});

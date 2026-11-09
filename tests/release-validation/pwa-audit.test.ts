/**
 * PWA & Lighthouse CI Audit Verification Suite
 *
 * Validates:
 * 1. vite-plugin-pwa upgraded to latest v2.0.0 in package.json
 * 2. GitHub Action workflow .github/workflows/audit.yml & lighthouserc.json configuration
 * 3. Complete PWA icon asset suite (dimensions, bit-depth, SVG, Apple Touch Icon, Any & Maskable icons)
 * 4. HTML head PWA & iOS Safari compliance and CSP inline script SHA-256 integrity
 * 5. VitePWA manifest & Workbox configuration in vite.config.ts
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

describe('PWA & Lighthouse CI Audit Verification', () => {
    it('1. package.json specifies latest vite-plugin-pwa (^2.0.0), workbox-window (^7.4.1), and engines.node (>=22.0.0)', () => {
        const pkg = JSON.parse(readFileSync(resolve(ROOT_DIR, 'package.json'), 'utf-8'));
        expect(pkg.devDependencies['vite-plugin-pwa']).toBe('^2.0.0');
        expect(pkg.dependencies['workbox-window']).toBe('^7.4.1');
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

    it('4. index.html includes complete PWA & iOS Safari meta tags and preserves CSP inline script SHA-256 hash', () => {
        const html = readFileSync(resolve(ROOT_DIR, 'index.html'), 'utf-8');
        expect(html).toContain('name="theme-color"');
        expect(html).toContain('name="mobile-web-app-capable" content="yes"');
        expect(html).toContain('name="apple-mobile-web-app-capable" content="yes"');
        expect(html).toContain('name="apple-mobile-web-app-title" content="TdyTime"');
        expect(html).toContain('rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2026.11"');
        expect(html).toContain('rel="icon" type="image/svg+xml" href="/favicon.svg?v=2026.11"');

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

    it('5. vite.config.ts defines compliant Web App Manifest with separate any and maskable icons and ?v=2026.11 cache-busting', () => {
        const viteConfig = readFileSync(resolve(ROOT_DIR, 'vite.config.ts'), 'utf-8');
        expect(viteConfig).toContain("id: '/tdytime'");
        expect(viteConfig).toContain("short_name: 'TdyTime'");
        expect(viteConfig).toContain("start_url: '/'");
        expect(viteConfig).toContain("scope: '/'");
        expect(viteConfig).toContain("display: 'standalone'");
        expect(viteConfig).toContain("src: '/pwa-192x192.png?v=2026.11'");
        expect(viteConfig).toContain("src: '/pwa-512x512.png?v=2026.11'");
        expect(viteConfig).toContain("src: '/pwa-maskable-192x192.png?v=2026.11'");
        expect(viteConfig).toContain("src: '/pwa-maskable-512x512.png?v=2026.11'");
        expect(viteConfig).toContain('ignoreURLParametersMatching');
        expect(viteConfig).toContain('cleanupOutdatedCaches: true');
    });

    it('6. Update/Sync action re-fetches critical calendar data and forces a Service Worker update check', () => {
        const viJson = JSON.parse(readFileSync(resolve(ROOT_DIR, 'src/i18n/locales/vi.json'), 'utf-8'));
        const enJson = JSON.parse(readFileSync(resolve(ROOT_DIR, 'src/i18n/locales/en.json'), 'utf-8'));
        expect(viJson.pwa.update_check).toBe('Cập nhật/Đồng bộ');
        expect(enJson.pwa.update_check).toBe('Update/Sync');

        const handlerCode = readFileSync(resolve(ROOT_DIR, 'src/app/PWAUpdateHandler.tsx'), 'utf-8');
        expect(handlerCode).toContain('useScheduleStore.getState().initFromStorage()');
        expect(handlerCode).toContain('useExamStore.persist?.rehydrate?.()');
        expect(handlerCode).toContain('useNotesStore.persist?.rehydrate?.()');
        expect(handlerCode).toContain('await registration.update()');
    });
});

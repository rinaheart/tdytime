/**
 * Unit & Compiled CSS Runtime Tests for Design System Integrity, WCAG 2.2 Contrast & Scanner Fixtures — TdyTime
 * Run via: npm test -- src/core/themes/designSystem.test.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { render } from '@testing-library/react';
import postcss from 'postcss';
import tailwindcssPostcss from '@tailwindcss/postcss';
import { describe, it, expect } from 'vitest';
import {
    THEME_IDS,
    DEFAULT_THEME,
    THEMES,
    THEME_PALETTES,
    THEME_MIGRATION,
    getTheme,
    isValidTheme,
} from './theme.registry';
import {
    PERIOD_TIMES,
    PERIOD_TIMES_TH,
    SESSION_ACCENT_COLORS,
    getPeriodTimes,
} from '../config/constants';
import Badge from '../../ui/primitives/Badge';
import {
    TAILWIND_COLOR_RGB,
    SEMANTIC_COLOR_EXCEPTIONS,
    getContrastRatio,
    scanFileContentForContrast,
    verifySemanticExceptionsManifest,
    runDesignSystemAudit,
} from '../../../scripts/check-design-system.mjs';

function parseRgb(rgbStr: string): [number, number, number] {
    const parts = rgbStr.trim().split(/\s+/).map(Number);
    if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
        throw new Error(`Invalid 3-channel RGB string: "${rgbStr}"`);
    }
    return [parts[0], parts[1], parts[2]];
}

describe('Design System Theme Registry, WCAG 2.2 Contrast & Compiled CSS Runtime Integrity', () => {
    it('registers all 7 canonical AccentTheme IDs with preview swatches and canonical THEME_PALETTES', () => {
        expect(THEME_IDS).toHaveLength(7);
        expect(DEFAULT_THEME).toBe('themeBlue');
        expect(THEMES).toHaveLength(7);

        for (const id of THEME_IDS) {
            expect(isValidTheme(id)).toBe(true);
            const def = getTheme(id);
            expect(def.id).toBe(id);
            expect(def.nameKey).toBe(`settings.themes.${id}`);
            expect(def.preview).toHaveLength(4);
            expect(def.palette).toBe(THEME_PALETTES[id]);
        }
    });

    it('resolves legacy identifiers in THEME_MIGRATION to valid themes', () => {
        for (const [, targetTheme] of Object.entries(THEME_MIGRATION)) {
            expect(isValidTheme(targetTheme)).toBe(true);
        }
        expect(THEME_MIGRATION.themeViolet).toBe('themeViolet');
        expect(THEME_MIGRATION.themePurple).toBe('themeViolet');
        expect(THEME_MIGRATION.themeAmber).toBe('themeYellow');
    });

    it('enforces 1:1 palette parity between THEME_PALETTES and tokens.css (:root fallback + all 7 themes), WCAG 2.2 AA (>= 4.5:1) action contrast, and SC 1.4.11 (>= 3.0:1) focus contrast in Light & Dark modes', () => {
        const tokensPath = path.resolve(process.cwd(), 'src/styles/tokens.css');
        const tokensCss = fs.readFileSync(tokensPath, 'utf8');

        const lightWhite: [number, number, number] = [255, 255, 255];
        const lightSlate50: [number, number, number] = [248, 250, 252];
        const darkSlate900: [number, number, number] = [15, 23, 42];
        const darkSlate950: [number, number, number] = [2, 6, 23];

        // 1. Verify :root fallback block matches THEME_PALETTES.themeBlue 1:1 across all 16 tokens
        const rootMatch = tokensCss.match(/:root\s*\{([^}]*)\}/m);
        expect(rootMatch).not.toBeNull();
        const rootBlock = rootMatch![1];
        const bluePalette = THEME_PALETTES.themeBlue;
        for (const shade of ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const) {
            const match = rootBlock.match(new RegExp(`--accent-${shade}:\\s*([0-9\\s]+);`));
            expect(match, `:root missing --accent-${shade}`).not.toBeNull();
            expect(match![1].trim()).toBe(bluePalette[shade]);
        }
        expect(rootBlock.match(/--accent-action-bg:\s*([0-9\s]+);/)?.[1].trim()).toBe(bluePalette.actionBg);
        expect(rootBlock.match(/--accent-action-hover:\s*([0-9\s]+);/)?.[1].trim()).toBe(bluePalette.actionHover);
        expect(rootBlock.match(/--accent-on-action:\s*([0-9\s]+);/)?.[1].trim()).toBe(bluePalette.onAction);
        expect(rootBlock.match(/--accent-focus-light:\s*([0-9\s]+);/)?.[1].trim()).toBe(bluePalette.focusLight);
        expect(rootBlock.match(/--accent-focus-dark:\s*([0-9\s]+);/)?.[1].trim()).toBe(bluePalette.focusDark);

        // 2. Verify all 7 theme blocks (including official Tailwind yellow-800: 133 77 14)
        expect(THEME_PALETTES.themeYellow['800']).toBe('133 77 14');
        expect(THEME_PALETTES.themeYellow.actionHover).toBe('133 77 14');

        for (const themeId of THEME_IDS) {
            const escaped = `[data-accent="${themeId}"]`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const blockMatch = tokensCss.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm'));
            expect(blockMatch, `Missing CSS block for ${themeId}`).not.toBeNull();

            const block = blockMatch![1];
            const palette = THEME_PALETTES[themeId];

            for (const shade of ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const) {
                const match = block.match(new RegExp(`--accent-${shade}:\\s*([0-9\\s]+);`));
                expect(match, `${themeId} missing --accent-${shade}`).not.toBeNull();
                expect(match![1].trim()).toBe(palette[shade]);
            }

            const actionBgMatch = block.match(/--accent-action-bg:\s*([0-9\s]+);/);
            const actionHoverMatch = block.match(/--accent-action-hover:\s*([0-9\s]+);/);
            const onActionMatch = block.match(/--accent-on-action:\s*([0-9\s]+);/);
            const focusLightMatch = block.match(/--accent-focus-light:\s*([0-9\s]+);/);
            const focusDarkMatch = block.match(/--accent-focus-dark:\s*([0-9\s]+);/);

            expect(actionBgMatch![1].trim()).toBe(palette.actionBg);
            expect(actionHoverMatch![1].trim()).toBe(palette.actionHover);
            expect(onActionMatch![1].trim()).toBe(palette.onAction);
            expect(focusLightMatch![1].trim()).toBe(palette.focusLight);
            expect(focusDarkMatch![1].trim()).toBe(palette.focusDark);

            const bgRatio = getContrastRatio(parseRgb(actionBgMatch![1]), parseRgb(onActionMatch![1]));
            const hoverRatio = getContrastRatio(parseRgb(actionHoverMatch![1]), parseRgb(onActionMatch![1]));
            expect(bgRatio).toBeGreaterThanOrEqual(4.5);
            expect(hoverRatio).toBeGreaterThanOrEqual(4.5);

            const focusLightRgb = parseRgb(focusLightMatch![1]);
            const focusDarkRgb = parseRgb(focusDarkMatch![1]);

            expect(getContrastRatio(focusLightRgb, lightWhite)).toBeGreaterThanOrEqual(3.0);
            expect(getContrastRatio(focusLightRgb, lightSlate50)).toBeGreaterThanOrEqual(3.0);
            expect(getContrastRatio(focusDarkRgb, darkSlate900)).toBeGreaterThanOrEqual(3.0);
            expect(getContrastRatio(focusDarkRgb, darkSlate950)).toBeGreaterThanOrEqual(3.0);
        }
    });

    it('includes all 22 official Tailwind CSS color families × 11 shades in TAILWIND_COLOR_RGB with accurate RGB values', () => {
        const expectedFamilies = [
            'slate', 'gray', 'zinc', 'neutral', 'stone',
            'red', 'orange', 'amber', 'yellow', 'lime',
            'green', 'emerald', 'teal', 'cyan', 'sky',
            'blue', 'indigo', 'violet', 'purple', 'fuchsia',
            'pink', 'rose',
        ];
        expect(Object.keys(TAILWIND_COLOR_RGB).sort()).toEqual([...expectedFamilies].sort());

        const expectedShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
        for (const family of expectedFamilies) {
            const shadesObj = TAILWIND_COLOR_RGB[family as keyof typeof TAILWIND_COLOR_RGB];
            expect(Object.keys(shadesObj)).toEqual(expectedShades);
            for (const shade of expectedShades) {
                const rgb = shadesObj[Number(shade) as keyof typeof shadesObj];
                expect(rgb).toHaveLength(3);
                expect(rgb.every((c: number) => Number.isInteger(c) && c >= 0 && c <= 255)).toBe(true);
            }
        }
        // Verify official Tailwind yellow-800 (#854D0E) is [133, 77, 14]
        expect(TAILWIND_COLOR_RGB.yellow[800]).toEqual([133, 77, 14]);
    });

    it('verifies two-way parity of all 30 canonical SEMANTIC_COLOR_EXCEPTIONS against the live codebase', async () => {
        expect(SEMANTIC_COLOR_EXCEPTIONS).toHaveLength(30);
        const auditResult = await runDesignSystemAudit();
        expect(auditResult.ok).toBe(true);
        expect(auditResult.errors).toEqual([]);
        expect(auditResult.discoveredExceptions).toHaveLength(SEMANTIC_COLOR_EXCEPTIONS.length);

        // Verify SESSION_ACCENT_COLORS use WCAG AA compliant shades with text-white
        expect(SESSION_ACCENT_COLORS.morning.bg).toBe('bg-blue-600');
        expect(SESSION_ACCENT_COLORS.afternoon.bg).toBe('bg-orange-700');
        expect(SESSION_ACCENT_COLORS.evening.bg).toBe('bg-purple-600');
    });

    it('catches intentional WCAG contrast & manifest violations across multi-line JSX, newly added Tailwind families, dark focus rings, hover/dark bg states, opacity modifiers, and unknown color names', () => {
        // 1. Multi-line className where bg-amber-600 and text-white are on different lines
        const multiLineTextViolation = `
            export const BadMultiLineButton = () => (
                <button
                    className="
                        px-4 py-2
                        bg-amber-600
                        rounded-control
                        text-white
                    "
                >
                    Confirm
                </button>
            );
        `;
        const res1 = scanFileContentForContrast(multiLineTextViolation, 'src/fixtures/MultiLine.tsx');
        expect(res1.errors.some((e) => e.includes('[Text Contrast Failure]') && e.includes('bg-amber-600'))).toBe(true);

        // 2. Newly added Tailwind families (lime, fuchsia, zinc, neutral, stone) + multi-line template interpolation
        const newFamiliesViolation = `
            export const BadNewFamilies = ({ mode }: { mode: string }) => (
                <div
                    className={\`p-2 text-white \${
                        mode === 'a'
                            ? 'bg-lime-500'
                            : mode === 'b'
                            ? 'bg-fuchsia-400'
                            : 'bg-zinc-400'
                    }\`}
                />
            );
        `;
        const res2 = scanFileContentForContrast(newFamiliesViolation, 'src/fixtures/NewFamilies.tsx');
        expect(res2.errors.some((e) => e.includes('bg-lime-500'))).toBe(true);
        expect(res2.errors.some((e) => e.includes('bg-fuchsia-400'))).toBe(true);
        expect(res2.errors.some((e) => e.includes('bg-zinc-400'))).toBe(true);

        // 3. Fail-closed unknown color family or shade
        const unknownColorFixture = `
            export const UnknownColor = () => (
                <button className="bg-brand-500 text-white focus-visible:ring-custom-400">Test</button>
            );
        `;
        const res3 = scanFileContentForContrast(unknownColorFixture, 'src/fixtures/UnknownColor.tsx');
        expect(res3.errors.some((e) => e.includes('[Fail-Closed Color Lookup]') && e.includes('bg-brand-500'))).toBe(true);
        expect(res3.errors.some((e) => e.includes('[Fail-Closed Color Lookup]') && e.includes('focus-visible:ring-custom-400'))).toBe(true);

        // 4. Standalone dark:focus-visible:ring-* violation (no light fixed focus ring on same element)
        // plus unprefixed focus ring that passes Light Mode but fails Dark Mode without dark: override
        const darkFocusViolation = `
            export const BadDarkFocus = () => (
                <>
                    <button className="focus-visible:ring-accent-focus dark:focus-visible:ring-amber-900" />
                    <button className="focus-visible:ring-slate-700" />
                </>
            );
        `;
        const res4 = scanFileContentForContrast(darkFocusViolation, 'src/fixtures/DarkFocus.tsx');
        expect(
            res4.errors.some(
                (e) => e.includes('[Non-Text Focus Contrast Failure]') && e.includes('dark:focus-visible:ring-amber-900')
            )
        ).toBe(true);
        expect(
            res4.errors.some(
                (e) => e.includes('[Non-Text Focus Contrast Failure]') && e.includes('focus-visible:ring-slate-700')
            )
        ).toBe(true);

        // 5. Hover and Dark background states paired with text-white
        const hoverAndDarkBgViolation = `
            export const BadHoverDarkBg = () => (
                <button className="bg-amber-700 hover:bg-amber-500 dark:bg-stone-400 text-white">Action</button>
            );
        `;
        const res5 = scanFileContentForContrast(hoverAndDarkBgViolation, 'src/fixtures/HoverDarkBg.tsx');
        expect(res5.errors.some((e) => e.includes('hover:bg-amber-500'))).toBe(true);
        expect(res5.errors.some((e) => e.includes('dark:bg-stone-400'))).toBe(true);

        // 6. Opacity modifier alpha-blending violations (bg-red-600/50 text-white and focus-visible:ring-red-600/40)
        const opacityViolation = `
            export const BadOpacity = () => (
                <button className="bg-red-600/50 text-white focus-visible:ring-red-600/40">Translucent</button>
            );
        `;
        const res6 = scanFileContentForContrast(opacityViolation, 'src/fixtures/Opacity.tsx');
        expect(res6.errors.some((e) => e.includes('bg-red-600/50'))).toBe(true);
        expect(res6.errors.some((e) => e.includes('focus-visible:ring-red-600/40'))).toBe(true);

        // 7. Two-way manifest enforcement: valid contrast exception that is NOT in SEMANTIC_COLOR_EXCEPTIONS
        // and stale manifest entry that was removed from source
        const unregisteredValidException = `
            export const UnregisteredValid = () => (
                <button className="bg-emerald-800 text-white">Valid Contrast But Unregistered</button>
            );
        `;
        const res7 = scanFileContentForContrast(unregisteredValidException, 'src/fixtures/Unregistered.tsx');
        expect(res7.errors).toEqual([]);
        expect(res7.discoveredExceptions).toHaveLength(1);

        const manifestCheck = verifySemanticExceptionsManifest(res7.discoveredExceptions, SEMANTIC_COLOR_EXCEPTIONS);
        expect(manifestCheck.some((e) => e.includes('[Unregistered Semantic Exception]') && e.includes('bg-emerald-800'))).toBe(true);
        expect(manifestCheck.some((e) => e.includes('[Stale Semantic Exception Manifest Entry]'))).toBe(true);
    });

    it('compiles global.css via PostCSS + @tailwindcss/postcss with zero self-referencing variables and exact radius/shadow/action/focus selector rules', async () => {
        const globalCssPath = path.resolve(process.cwd(), 'src/styles/global.css');
        const rawCss = fs.readFileSync(globalCssPath, 'utf8');
        const result = await postcss([tailwindcssPostcss()]).process(rawCss, {
            from: globalCssPath,
        });
        const compiled = result.css;

        const selfRefRegex = /(--[a-zA-Z0-9-]+)\s*:\s*var\(\s*\1\s*\)/g;
        expect(compiled.match(selfRefRegex)).toBeNull();

        expect(compiled).toMatch(/\.rounded-badge\s*\{[^}]*border-radius:\s*var\(--tdy-radius-badge\)/);
        expect(compiled).toMatch(/\.rounded-control\s*\{[^}]*border-radius:\s*var\(--tdy-radius-control\)/);
        expect(compiled).toMatch(/\.rounded-card\s*\{[^}]*border-radius:\s*var\(--tdy-radius-card\)/);
        expect(compiled).toMatch(/\.rounded-dialog\s*\{[^}]*border-radius:\s*var\(--tdy-radius-dialog\)/);

        expect(compiled).toMatch(/\.shadow-card\s*\{[^}]*--tw-shadow:\s*var\(--tdy-shadow-card\)/);
        expect(compiled).toMatch(/\.hover\\:shadow-card-hover:hover\s*\{[^}]*--tw-shadow:\s*var\(--tdy-shadow-card-hover\)/);
        expect(compiled).toMatch(/\.shadow-modal\s*\{[^}]*--tw-shadow:\s*var\(--tdy-shadow-modal\)/);

        expect(compiled).toMatch(/\.bg-accent-action\s*\{[^}]*background-color:\s*rgb\(var\(--accent-action-bg\)\)/);
        expect(compiled).toMatch(/\.hover\\:bg-accent-action-hover:hover\s*\{[^}]*background-color:\s*rgb\(var\(--accent-action-hover\)\)/);
        expect(compiled).toMatch(/\.text-accent-on-action\s*\{[^}]*color:\s*rgb\(var\(--accent-on-action\)\)/);
        expect(compiled).toMatch(/\.focus-visible\\:ring-accent-focus:focus-visible\s*\{[^}]*--tw-ring-color:\s*rgb\(var\(--accent-focus\)\)/);
        expect(compiled).toMatch(/\.focus\\:ring-accent-focus:focus\s*\{[^}]*--tw-ring-color:\s*rgb\(var\(--accent-focus\)\)/);
    });

    it('supports explicit showDot={false} and dot={false} on Badge to suppress automatic semantic dots', () => {
        const { container: defaultMorning } = render(
            React.createElement(Badge, { variant: 'morning' }, 'Sáng')
        );
        expect(defaultMorning.querySelector('span.rounded-full')).not.toBeNull();

        const { container: suppressedViaShowDot } = render(
            React.createElement(Badge, { variant: 'morning', showDot: false }, 'Sáng')
        );
        expect(suppressedViaShowDot.querySelector('span.rounded-full')).toBeNull();

        const { container: suppressedViaDot } = render(
            React.createElement(Badge, { variant: 'morning', dot: false }, 'Sáng')
        );
        expect(suppressedViaDot.querySelector('span.rounded-full')).toBeNull();
    });

    it('returns 45-min grid for LT and 60-min grid for TH in getPeriodTimes', () => {
        const lt = getPeriodTimes('LT');
        const th = getPeriodTimes('TH');

        expect(lt).toBe(PERIOD_TIMES);
        expect(th).toBe(PERIOD_TIMES_TH);

        expect(lt[1]).toEqual({ start: [7, 0], end: [7, 45] });
        expect(th[1]).toEqual({ start: [7, 0], end: [8, 0] });
    });
});

/**
 * Unit & Compiled CSS Runtime Tests for Design System Integrity, WCAG 2.2 Contrast & Components — TdyTime
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
    getPeriodTimes,
} from '../config/constants';
import Badge from '../../ui/primitives/Badge';

function parseRgb(rgbStr: string): [number, number, number] {
    const parts = rgbStr.trim().split(/\s+/).map(Number);
    if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
        throw new Error(`Invalid 3-channel RGB string: "${rgbStr}"`);
    }
    return [parts[0], parts[1], parts[2]];
}

/**
 * W3C WCAG 2.2 relative luminance using canonical 0.04045 linearization threshold.
 */
function getRelativeLuminance([r, g, b]: [number, number, number]): number {
    const toLinear = (c: number) => {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(rgbA: [number, number, number], rgbB: [number, number, number]): number {
    const lumA = getRelativeLuminance(rgbA);
    const lumB = getRelativeLuminance(rgbB);
    return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);
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

    it('enforces 1:1 palette parity between THEME_PALETTES and tokens.css, WCAG 2.2 AA (>= 4.5:1) action contrast, and SC 1.4.11 (>= 3.0:1) focus contrast in Light & Dark modes', () => {
        const tokensPath = path.resolve(process.cwd(), 'src/styles/tokens.css');
        const tokensCss = fs.readFileSync(tokensPath, 'utf8');

        const lightWhite: [number, number, number] = [255, 255, 255];
        const lightSlate50: [number, number, number] = [248, 250, 252];
        const darkSlate900: [number, number, number] = [15, 23, 42];
        const darkSlate950: [number, number, number] = [2, 6, 23];

        for (const themeId of THEME_IDS) {
            const escaped = `[data-accent="${themeId}"]`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const blockMatch = tokensCss.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm'));
            expect(blockMatch, `Missing CSS block for ${themeId}`).not.toBeNull();

            const block = blockMatch![1];
            const palette = THEME_PALETTES[themeId];

            // Verify all 11 shades match THEME_PALETTES
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

            expect(actionBgMatch, `${themeId} missing --accent-action-bg`).not.toBeNull();
            expect(actionHoverMatch, `${themeId} missing --accent-action-hover`).not.toBeNull();
            expect(onActionMatch, `${themeId} missing --accent-on-action`).not.toBeNull();
            expect(focusLightMatch, `${themeId} missing --accent-focus-light`).not.toBeNull();
            expect(focusDarkMatch, `${themeId} missing --accent-focus-dark`).not.toBeNull();

            expect(actionBgMatch![1].trim()).toBe(palette.actionBg);
            expect(actionHoverMatch![1].trim()).toBe(palette.actionHover);
            expect(onActionMatch![1].trim()).toBe(palette.onAction);
            expect(focusLightMatch![1].trim()).toBe(palette.focusLight);
            expect(focusDarkMatch![1].trim()).toBe(palette.focusDark);

            // Action contrast >= 4.5:1
            const bgRatio = getContrastRatio(parseRgb(actionBgMatch![1]), parseRgb(onActionMatch![1]));
            const hoverRatio = getContrastRatio(parseRgb(actionHoverMatch![1]), parseRgb(onActionMatch![1]));
            expect(bgRatio, `${themeId} action-bg contrast ${bgRatio.toFixed(2)}:1 < 4.5`).toBeGreaterThanOrEqual(4.5);
            expect(hoverRatio, `${themeId} action-hover contrast ${hoverRatio.toFixed(2)}:1 < 4.5`).toBeGreaterThanOrEqual(4.5);

            // Focus ring contrast >= 3.0:1 against Light & Dark adjacent surfaces (WCAG 2.2 SC 1.4.11)
            const focusLightRgb = parseRgb(focusLightMatch![1]);
            const focusDarkRgb = parseRgb(focusDarkMatch![1]);

            expect(getContrastRatio(focusLightRgb, lightWhite)).toBeGreaterThanOrEqual(3.0);
            expect(getContrastRatio(focusLightRgb, lightSlate50)).toBeGreaterThanOrEqual(3.0);
            expect(getContrastRatio(focusDarkRgb, darkSlate900)).toBeGreaterThanOrEqual(3.0);
            expect(getContrastRatio(focusDarkRgb, darkSlate950)).toBeGreaterThanOrEqual(3.0);
        }
    });

    it('compiles global.css via PostCSS + @tailwindcss/postcss with zero self-referencing variables and valid radius/shadow/action/focus utility rules', async () => {
        const globalCssPath = path.resolve(process.cwd(), 'src/styles/global.css');
        const rawCss = fs.readFileSync(globalCssPath, 'utf8');
        const result = await postcss([tailwindcssPostcss()]).process(rawCss, {
            from: globalCssPath,
        });
        const compiled = result.css;

        // 1. Must never contain cyclic self-referencing custom properties (--x: var(--x))
        const selfRefRegex = /(--[a-zA-Z0-9-]+)\s*:\s*var\(\s*\1\s*\)/g;
        expect(compiled.match(selfRefRegex)).toBeNull();

        // 2. Semantic radius utilities must resolve to --tdy-radius-* source tokens
        expect(compiled).toMatch(/\.rounded-badge\s*\{[^}]*border-radius:\s*var\(--tdy-radius-badge\)/);
        expect(compiled).toMatch(/\.rounded-control\s*\{[^}]*border-radius:\s*var\(--tdy-radius-control\)/);
        expect(compiled).toMatch(/\.rounded-card\s*\{[^}]*border-radius:\s*var\(--tdy-radius-card\)/);
        expect(compiled).toMatch(/\.rounded-dialog\s*\{[^}]*border-radius:\s*var\(--tdy-radius-dialog\)/);

        // 3. Shadow utilities must resolve to --tdy-shadow-* source tokens
        expect(compiled).toMatch(/\.shadow-card\s*\{[^}]*--tw-shadow:\s*var\(--tdy-shadow-card\)/);
        expect(compiled).toMatch(/\.shadow-modal\s*\{[^}]*--tw-shadow:\s*var\(--tdy-shadow-modal\)/);

        // 4. Action and Focus color utilities must resolve to --accent-action-* and --accent-focus
        expect(compiled).toMatch(/\.bg-accent-action\s*\{[^}]*background-color:\s*rgb\(var\(--accent-action-bg\)\)/);
        expect(compiled).toMatch(/\.text-accent-on-action\s*\{[^}]*color:\s*rgb\(var\(--accent-on-action\)\)/);
        expect(compiled).toMatch(/--tw-ring-color:\s*rgb\(var\(--accent-focus\)\)/);
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

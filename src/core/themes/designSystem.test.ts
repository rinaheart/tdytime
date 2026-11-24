/**
 * Unit Tests for Design System Integrity, WCAG 2.2 AA Contrast & Components — TdyTime
 * Run via: npm test -- src/core/themes/designSystem.test.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
    THEME_IDS,
    DEFAULT_THEME,
    THEMES,
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
    return [parts[0], parts[1], parts[2]];
}

function getRelativeLuminance([r, g, b]: [number, number, number]): number {
    const toLinear = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(rgbA: [number, number, number], rgbB: [number, number, number]): number {
    const lumA = getRelativeLuminance(rgbA);
    const lumB = getRelativeLuminance(rgbB);
    return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);
}

describe('Design System Theme Registry, WCAG Contrast & Component Integrity', () => {
    it('registers all 7 canonical AccentTheme IDs with preview swatches', () => {
        expect(THEME_IDS).toHaveLength(7);
        expect(DEFAULT_THEME).toBe('themeBlue');
        expect(THEMES).toHaveLength(7);

        for (const id of THEME_IDS) {
            expect(isValidTheme(id)).toBe(true);
            const def = getTheme(id);
            expect(def.id).toBe(id);
            expect(def.nameKey).toBe(`settings.themes.${id}`);
            expect(def.preview).toHaveLength(4);
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

    it('enforces WCAG 2.2 AA (>= 4.5:1) contrast for --accent-action-bg and --accent-action-hover across all 7 themes in tokens.css', () => {
        const tokensPath = path.resolve(process.cwd(), 'src/styles/tokens.css');
        const tokensCss = fs.readFileSync(tokensPath, 'utf8');

        for (const themeId of THEME_IDS) {
            const escaped = `[data-accent="${themeId}"]`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const blockMatch = tokensCss.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm'));
            expect(blockMatch, `Missing CSS block for ${themeId}`).not.toBeNull();

            const block = blockMatch![1];
            const actionBgMatch = block.match(/--accent-action-bg:\s*([0-9\s]+);/);
            const actionHoverMatch = block.match(/--accent-action-hover:\s*([0-9\s]+);/);
            const onActionMatch = block.match(/--accent-on-action:\s*([0-9\s]+);/);

            expect(actionBgMatch, `${themeId} missing --accent-action-bg`).not.toBeNull();
            expect(actionHoverMatch, `${themeId} missing --accent-action-hover`).not.toBeNull();
            expect(onActionMatch, `${themeId} missing --accent-on-action`).not.toBeNull();

            const bgRatio = getContrastRatio(parseRgb(actionBgMatch![1]), parseRgb(onActionMatch![1]));
            const hoverRatio = getContrastRatio(parseRgb(actionHoverMatch![1]), parseRgb(onActionMatch![1]));

            expect(bgRatio, `${themeId} action-bg contrast ${bgRatio.toFixed(2)}:1 < 4.5`).toBeGreaterThanOrEqual(4.5);
            expect(hoverRatio, `${themeId} action-hover contrast ${hoverRatio.toFixed(2)}:1 < 4.5`).toBeGreaterThanOrEqual(4.5);
        }
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

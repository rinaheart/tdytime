/**
 * Unit Tests for Design System Theme Registry & Constants — TdyTime
 */

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

describe('Design System Theme Registry & Constants', () => {
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

    it('returns 45-min grid for LT and 60-min grid for TH in getPeriodTimes', () => {
        const lt = getPeriodTimes('LT');
        const th = getPeriodTimes('TH');

        expect(lt).toBe(PERIOD_TIMES);
        expect(th).toBe(PERIOD_TIMES_TH);

        expect(lt[1]).toEqual({ start: [7, 0], end: [7, 45] });
        expect(th[1]).toEqual({ start: [7, 0], end: [8, 0] });
    });
});

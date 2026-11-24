/**
 * Node:test verification suite for Design System Theme Registry & Constants — TdyTime
 * Executed via `npx --yes tsx --test scripts/designSystem.node-test.ts`
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
    THEME_IDS,
    DEFAULT_THEME,
    THEMES,
    THEME_MIGRATION,
    getTheme,
    isValidTheme,
} from '../src/core/themes/theme.registry';
import {
    PERIOD_TIMES,
    PERIOD_TIMES_TH,
    getPeriodTimes,
} from '../src/core/config/constants';

test('Design System: registers all 7 canonical AccentTheme IDs with preview swatches', () => {
    assert.equal(THEME_IDS.length, 7);
    assert.equal(DEFAULT_THEME, 'themeBlue');
    assert.equal(THEMES.length, 7);

    for (const id of THEME_IDS) {
        assert.equal(isValidTheme(id), true, `Expected ${id} to be a valid theme`);
        const def = getTheme(id);
        assert.equal(def.id, id);
        assert.equal(def.nameKey, `settings.themes.${id}`);
        assert.equal(def.preview.length, 4, `Theme ${id} must have 4 preview swatches`);
    }
});

test('Design System: THEME_MIGRATION resolves legacy identifiers to valid themes', () => {
    for (const [legacyKey, targetTheme] of Object.entries(THEME_MIGRATION)) {
        assert.equal(
            isValidTheme(targetTheme),
            true,
            `Legacy key "${legacyKey}" mapped to invalid theme "${targetTheme}"`
        );
    }
    assert.equal(THEME_MIGRATION.themeViolet, 'themeViolet');
    assert.equal(THEME_MIGRATION.themePurple, 'themeViolet');
    assert.equal(THEME_MIGRATION.themeAmber, 'themeYellow');
});

test('Design System: getPeriodTimes returns 45-min grid for LT and 60-min grid for TH', () => {
    const lt = getPeriodTimes('LT');
    const th = getPeriodTimes('TH');

    assert.equal(lt, PERIOD_TIMES);
    assert.equal(th, PERIOD_TIMES_TH);

    assert.deepEqual(lt[1], { start: [7, 0], end: [7, 45] });
    assert.deepEqual(th[1], { start: [7, 0], end: [8, 0] });
});

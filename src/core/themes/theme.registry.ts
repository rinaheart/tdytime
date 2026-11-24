/**
 * Theme Registry — TdyTime v2
 * Re-exports centralized theme constants from `@/core/config/constants` and provides
 * lookup/validation helpers. To add a theme: update `src/core/config/constants.ts`,
 * CSS vars in `tokens.css`, and i18n keys.
 */

import { THEMES, THEME_IDS, type AccentTheme, type ThemeDefinition } from '../config/constants';

export {
    THEME_IDS,
    DEFAULT_THEME,
    THEMES,
    THEME_MIGRATION,
    type AccentTheme,
    type ThemeDefinition,
} from '../config/constants';

/** Returns the theme metadata definition for an AccentTheme ID (defaults to first theme). */
export const getTheme = (id: AccentTheme): ThemeDefinition =>
    THEMES.find((t) => t.id === id) || THEMES[0];

/** Type guard checking whether a string is a registered AccentTheme ID. */
export const isValidTheme = (id: string): id is AccentTheme =>
    THEME_IDS.includes(id as AccentTheme);

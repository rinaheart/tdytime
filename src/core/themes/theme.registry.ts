/**
 * Theme Registry — TdyTime v2
 * Central source of truth for all accent themes.
 * To add a new theme: add entry here + CSS vars in tokens.css + i18n keys.
 */

export const THEME_IDS = [
    'themeBlue',
    'themeGreen',
    'themeViolet',
    'themePink',
    'themeRed',
    'themeOrange',
    'themeYellow',
] as const;

export type AccentTheme = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: AccentTheme = 'themeBlue';

export interface ThemeDefinition {
    id: AccentTheme;
    /** i18n key for display name: settings.themes.{id} */
    nameKey: string;
    /** Tailwind classes for preview swatches in ThemePicker (light shades → dark) */
    preview: [string, string, string];
}

/** All registered themes — order here = order in ThemePicker */
export const THEMES: ThemeDefinition[] = [
    { id: 'themeBlue', nameKey: 'settings.themes.themeBlue', preview: ['bg-blue-50', 'bg-blue-300', 'bg-blue-600'] },
    { id: 'themeGreen', nameKey: 'settings.themes.themeGreen', preview: ['bg-emerald-50', 'bg-emerald-300', 'bg-emerald-600'] },
    { id: 'themeViolet', nameKey: 'settings.themes.themeViolet', preview: ['bg-violet-50', 'bg-violet-300', 'bg-violet-600'] },
    { id: 'themePink', nameKey: 'settings.themes.themePink', preview: ['bg-pink-50', 'bg-pink-300', 'bg-pink-600'] },
    { id: 'themeRed', nameKey: 'settings.themes.themeRed', preview: ['bg-red-50', 'bg-red-300', 'bg-red-600'] },
    { id: 'themeOrange', nameKey: 'settings.themes.themeOrange', preview: ['bg-orange-50', 'bg-orange-300', 'bg-orange-600'] },
    { id: 'themeYellow', nameKey: 'settings.themes.themeYellow', preview: ['bg-yellow-50', 'bg-yellow-300', 'bg-yellow-600'] },
];

/** Migration map: old theme IDs → new theme IDs */
export const THEME_MIGRATION: Record<string, AccentTheme> = {
    blue: 'themeBlue',
    pink: 'themePink',
    blueTheme: 'themeBlue',
    pinkTheme: 'themePink',
    greenTheme: 'themeGreen',
    themeAmber: 'themeOrange',
    themePurple: 'themeViolet',
};

export const getTheme = (id: AccentTheme): ThemeDefinition =>
    THEMES.find((t) => t.id === id) || THEMES[0];

export const isValidTheme = (id: string): id is AccentTheme =>
    THEME_IDS.includes(id as AccentTheme);

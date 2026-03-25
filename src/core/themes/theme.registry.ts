/**
 * Theme Registry — TdyTime v2
 * Central source of truth for all accent themes.
 * To add a new theme: add entry here + CSS vars in tokens.css + i18n keys.
 */

export const THEME_IDS = [
    'themeBlue',
    'themeGreen',
    'themePink',
    'themeViolet',
    'themeRed',
    'themeYellow',
    'themeGrey',
] as const;

export type AccentTheme = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: AccentTheme = 'themeBlue';

export interface ThemeDefinition {
    id: AccentTheme;
    /** i18n key for display name: settings.themes.{id} */
    nameKey: string;
    /** Tailwind classes for preview swatches in ThemePicker (light shades → dark) */
    preview: [string, string, string, string];
}

/** All registered themes — order here = order in ThemePicker */
export const THEMES: ThemeDefinition[] = [
    { id: 'themeBlue', nameKey: 'settings.themes.themeBlue', preview: ['bg-blue-100', 'bg-blue-300', 'bg-blue-500', 'bg-blue-700'] },
    { id: 'themeGreen', nameKey: 'settings.themes.themeGreen', preview: ['bg-emerald-100', 'bg-emerald-300', 'bg-emerald-500', 'bg-emerald-700'] },
    { id: 'themePink', nameKey: 'settings.themes.themePink', preview: ['bg-pink-100', 'bg-pink-300', 'bg-pink-500', 'bg-pink-700'] },
    { id: 'themeViolet', nameKey: 'settings.themes.themeViolet', preview: ['bg-violet-100', 'bg-violet-300', 'bg-violet-500', 'bg-violet-700'] },
    { id: 'themeRed', nameKey: 'settings.themes.themeRed', preview: ['bg-red-100', 'bg-red-300', 'bg-red-500', 'bg-red-700'] },
    { id: 'themeYellow', nameKey: 'settings.themes.themeYellow', preview: ['bg-yellow-100', 'bg-yellow-300', 'bg-yellow-500', 'bg-yellow-700'] },
    { id: 'themeGrey', nameKey: 'settings.themes.themeGrey', preview: ['bg-slate-200', 'bg-slate-400', 'bg-slate-600', 'bg-slate-800'] },
];

/** Migration map: old theme IDs → new theme IDs */
export const THEME_MIGRATION: Record<string, AccentTheme> = {
    blue: 'themeBlue',
    pink: 'themePink',
    blueTheme: 'themeBlue',
    pinkTheme: 'themePink',
    greenTheme: 'themeGreen',
    themeAmber: 'themeYellow',
    themePurple: 'themeGrey',
    themeViolet: 'themeGrey',
};

export const getTheme = (id: AccentTheme): ThemeDefinition =>
    THEMES.find((t) => t.id === id) || THEMES[0];

export const isValidTheme = (id: string): id is AccentTheme =>
    THEME_IDS.includes(id as AccentTheme);

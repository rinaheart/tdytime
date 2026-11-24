/**
 * Centralized Application & Build Configuration — TdyTime
 * Single source of truth for endpoints, storage keys, PWA cache strategies,
 * theme constants, schedule grids, and feature limits.
 *
 * Invariant: Must remain 100% pure TypeScript (no DOM, React, `import.meta.env`,
 * or `@/*` path aliases) so both Node.js (`vite.config.ts`) and browser bundles
 * can import it safely with full tree-shaking via named exports.
 */

declare const __APP_VERSION__: string;

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

/** Public static & service-worker endpoints */
export const API_ENDPOINTS = {
    version: '/version.json',
    serviceWorker: '/sw.js',
    devServiceWorker: '/dev-sw.js',
    manifest: '/manifest.webmanifest',
} as const;

/** Official contact & external links displayed in About/Info */
export const APP_LINKS = {
    email: 'tdyphan@gmail.com',
    mailto: 'mailto:tdyphan@gmail.com',
    github: 'https://github.com/rinaheart/tdytime',
    web: 'https://time.tdy.io.vn/',
} as const;

/** Persistent localStorage, sessionStorage & IndexedDB keys */
export const STORAGE_KEYS = {
    activeSchedule: 'last_schedule_data',
    abbreviations: 'global_abbreviations',
    history: 'timetable_history_v1',
    examStorage: 'exam-storage',
    analytics: 'tdytime_analytics_v1',
    lastBackupDate: 'tdytime_last_backup_date',
    legacySessionNotes: 'tdy_session_notes',
    language: 'language',
    colorTheme: 'color-theme',
    accentTheme: 'accent-theme',
    legacyTheme: 'tdytime_theme',
    legacyThemeAlt: 'theme',
    legacyFontSize: 'tdytime_font_size',
    installPromptDismissed: 'tdytime_install_prompt_dismissed',
    pwaDismissDate: 'tdytime_pwa_dismiss_date',
    preloadReloadTs: '__tdytime_preload_reload_ts__',
    debugLogs: 'tdytime_debug_logs',
} as const;

/** Runtime PWA update, cache-control messages & safety timeouts */
export const PWA_CONFIG = {
    cachePrefix: 'tdytime-pwa-v',
    messages: {
        skipWaiting: 'SKIP_WAITING',
        clearCache: 'CLEAR_CACHE',
    },
    timeouts: {
        updateReloadFallbackMs: 1500,
        clearCacheAckMs: 1200,
        preloadRecoveryCooldownMs: 15000,
        installDismissDurationMs: 24 * 60 * 60 * 1000,
        updateCheckDelayMs: 1200,
        updateCheckFallbackDelayMs: 800,
        statusResetMs: 3000,
        offlineNoticeMs: 3500,
    },
} as const;

/**
 * Build-time PWA & Vite chunk configuration (consumed by `vite.config.ts`).
 * Exported separately so bundlers tree-shake it out of browser bundles.
 */
export const PWA_BUILD_CONFIG = {
    serverPort: 3000,
    chunkSizeWarningLimit: 500,
    /** Tier A: Core entry & bootstrap bundles precached atomically during SW install */
    tierACoreEntryPrefixes: [
        'index-',
        'rolldown-runtime-',
        'vendor-react-',
        'vendor-router-',
        'vendor-i18n-',
        'vendor-utils-',
        'App-',
        'Monitoring-',
        'config-',
        'constants-',
        'logger-',
        'vi-',
        'en-',
        'useAnalytics-',
        'analytics.store-',
        'createAtomicStore-',
        'exam.store-',
        'exam.parser-',
        'exam.utils-',
        'ui-',
    ] as readonly string[],
    /** Tier C: Heavy optional chunks cached on-demand via Cache-First */
    tierCOnDemandPrefixes: [
        'vendor-pdf-',
        'react-pdf.browser-',
        'ScheduleReport-',
        'Roboto-',
        'DevToolsView-',
        'exceljs-',
        'vendor-monitoring-',
        'FileSaver.min-',
        'export-csv-',
    ] as readonly string[],
} as const;

/** Offline-first analytics buffer settings */
export const ANALYTICS_CONFIG = {
    appId: 'tdytime',
    maxEvents: 100,
} as const;

/** Upload history retention settings */
export const HISTORY_CONFIG = {
    maxItems: 10,
} as const;

/** Full JSON backup format settings */
export const BACKUP_CONFIG = {
    format: 'tdytime-backup',
    formatVersion: 1,
    filenamePrefix: 'tdytime-backup',
} as const;

/** Supported Accent Theme IDs */
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

/** All registered themes — order here determines display order in ThemePicker */
export const THEMES: ThemeDefinition[] = [
    { id: 'themeBlue', nameKey: 'settings.themes.themeBlue', preview: ['bg-blue-100', 'bg-blue-300', 'bg-blue-500', 'bg-blue-700'] },
    { id: 'themeGreen', nameKey: 'settings.themes.themeGreen', preview: ['bg-emerald-100', 'bg-emerald-300', 'bg-emerald-500', 'bg-emerald-700'] },
    { id: 'themePink', nameKey: 'settings.themes.themePink', preview: ['bg-pink-100', 'bg-pink-300', 'bg-pink-500', 'bg-pink-700'] },
    { id: 'themeViolet', nameKey: 'settings.themes.themeViolet', preview: ['bg-violet-100', 'bg-violet-300', 'bg-violet-500', 'bg-violet-700'] },
    { id: 'themeRed', nameKey: 'settings.themes.themeRed', preview: ['bg-red-100', 'bg-red-300', 'bg-red-500', 'bg-red-700'] },
    { id: 'themeYellow', nameKey: 'settings.themes.themeYellow', preview: ['bg-yellow-100', 'bg-yellow-300', 'bg-yellow-500', 'bg-yellow-700'] },
    { id: 'themeGrey', nameKey: 'settings.themes.themeGrey', preview: ['bg-slate-200', 'bg-slate-400', 'bg-slate-600', 'bg-slate-800'] },
];

/** Migration map from legacy theme identifiers to current AccentTheme IDs */
export const THEME_MIGRATION: Record<string, AccentTheme> = {
    blue: 'themeBlue',
    pink: 'themePink',
    blueTheme: 'themeBlue',
    pinkTheme: 'themePink',
    greenTheme: 'themeGreen',
    themeAmber: 'themeYellow',
    themePurple: 'themeViolet',
    themeViolet: 'themeViolet',
};

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const VI_DAYS_OF_WEEK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
export const UNKNOWN_TEACHER = 'Unknown Teacher';
export const CHUA_RO = 'Chưa rõ';

/** @deprecated Legacy v1 session card style — v2 uses stateless SessionCard + semantic tokens */
export const SESSION_COLORS = {
    morning: 'bg-blue-50/50 border-l-4 border-l-blue-500 border-blue-100 text-slate-700',
    afternoon: 'bg-blue-50/50 border-l-4 border-l-orange-500 border-orange-100 text-slate-700',
    evening: 'bg-blue-50/50 border-l-4 border-l-purple-600 border-purple-100 text-slate-700',
};

/** Accent badges (S/C/T legend) */
export const SESSION_ACCENT_COLORS = {
    morning: { bg: 'bg-blue-500', text: 'text-white', label: 'Sáng', translationKey: 'shifts.morning', short: 'S' },
    afternoon: { bg: 'bg-orange-500', text: 'text-white', label: 'Chiều', translationKey: 'shifts.afternoon', short: 'C' },
    evening: { bg: 'bg-purple-600', text: 'text-white', label: 'Tối', translationKey: 'shifts.evening', short: 'T' },
};

/** Course type badge colors */
export const COURSE_TYPE_COLORS = {
    LT: 'bg-accent-100 text-accent-700 border-accent-200 dark:bg-accent-900/40 dark:text-accent-300 dark:border-accent-800',
    TH: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
};

/** Warning thresholds defaults */
export const DEFAULT_THRESHOLDS = {
    daily: { warning: 8, danger: 10 },
    weekly: { warning: 25, danger: 35 },
};

/**
 * Standard period times in [hour, minute] format for Theory (LT):
 * 45 min/period with breaks.
 */
export const PERIOD_TIMES: Record<number, { start: [number, number]; end: [number, number] }> = {
    // Sáng
    1: { start: [7, 0], end: [7, 45] },
    2: { start: [7, 55], end: [8, 40] },
    3: { start: [8, 50], end: [9, 35] },
    4: { start: [9, 45], end: [10, 30] },
    5: { start: [10, 40], end: [11, 25] },
    // Chiều
    6: { start: [13, 30], end: [14, 15] },
    7: { start: [14, 25], end: [15, 10] },
    8: { start: [15, 20], end: [16, 5] },
    9: { start: [16, 15], end: [17, 0] },
    // Tối
    11: { start: [17, 10], end: [17, 55] },
    12: { start: [18, 0], end: [18, 45] },
    13: { start: [18, 50], end: [19, 35] },
};

/**
 * Standard period times in [hour, minute] format for Practice (TH):
 * 60 min/period, consecutive (no breaks).
 */
export const PERIOD_TIMES_TH: Record<number, { start: [number, number]; end: [number, number] }> = {
    // Sáng
    1: { start: [7, 0], end: [8, 0] },
    2: { start: [8, 0], end: [9, 0] },
    3: { start: [9, 0], end: [10, 0] },
    4: { start: [10, 0], end: [11, 0] },
    5: { start: [11, 0], end: [12, 0] },
    // Chiều
    6: { start: [13, 30], end: [14, 30] },
    7: { start: [14, 30], end: [15, 30] },
    8: { start: [15, 30], end: [16, 30] },
    9: { start: [16, 30], end: [17, 30] },
    // Tối
    11: { start: [17, 10], end: [18, 10] },
    12: { start: [18, 10], end: [19, 10] },
    13: { start: [19, 10], end: [20, 10] },
};

/**
 * Returns the standard period time table matching the given course type.
 * @param type - `'LT'` (45m theory periods) or `'TH'` (60m practical periods)
 */
export const getPeriodTimes = (
    type: 'LT' | 'TH'
): Record<number, { start: [number, number]; end: [number, number] }> =>
    type === 'TH' ? PERIOD_TIMES_TH : PERIOD_TIMES;

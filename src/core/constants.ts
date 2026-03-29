declare const __APP_VERSION__: string;

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const VI_DAYS_OF_WEEK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
export const UNKNOWN_TEACHER = 'Unknown Teacher';
export const CHUA_RO = 'Chưa rõ';

/** Session card style by time of day */
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
 * Standard period times in [hour, minute] format.
 * Based on the university's official schedule grid.
 *
 * LT (Theory): 45 min/period with breaks.
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
 * TH (Practical): 60 min/period, consecutive (no breaks).
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

/** Get the correct period time table based on CourseType */
export const getPeriodTimes = (type: 'LT' | 'TH'): Record<number, { start: [number, number]; end: [number, number] }> =>
    type === 'TH' ? PERIOD_TIMES_TH : PERIOD_TIMES;


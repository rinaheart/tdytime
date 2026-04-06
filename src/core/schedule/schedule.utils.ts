/**
 * Schedule Utilities — TdyTime v2
 * Shared date parsing and session filtering helpers.
 * Used across multiple views (weekly, semester, today).
 */

import { CourseSession, WeekSchedule, DaySchedule } from './schedule.types';
import { DAYS_OF_WEEK, CHUA_RO } from '../constants';

/** Regex pattern for DD/MM/YYYY format */
export const DATE_REGEX_SINGLE = /(\d{2})\/(\d{2})\/(\d{4})/;
export const DATE_REGEX_GLOBAL = /(\d{2})\/(\d{2})\/(\d{4})/g;

/** Regex for detecting Practical (TH) courses from group code */
export const COURSE_TYPE_TH_REGEX = /-TH\./i;

/** Normalize teacher name for comparison */
export const normalizeTeacherName = (name: string) => {
    if (!name) return '';
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
};

/** Check if a session belongs to the main teacher */
export const isMainTeacher = (tName: string, mainTeacherName: string) => {
    if (!tName || tName === CHUA_RO || tName === 'Unknown') return true;
    const main = normalizeTeacherName(mainTeacherName);
    const target = normalizeTeacherName(tName);
    return target.includes(main) || main.includes(target);
};

/**
 * Get date string for a specific day within a week's date range.
 * @param weekDateRange - e.g. "01/02/2026 - 07/02/2026"
 * @param dayIndex - 0=Monday, 6=Sunday
 */
export const getDayDateString = (weekDateRange: string, dayIndex: number): string => {
    try {
        const match = weekDateRange.match(DATE_REGEX_SINGLE);
        if (!match) return '';

        const d = parseInt(match[1]);
        const m = parseInt(match[2]);
        const y = parseInt(match[3]);
        const startDate = new Date(y, m - 1, d);
        const targetDate = new Date(startDate);
        targetDate.setDate(startDate.getDate() + dayIndex);

        const day = String(targetDate.getDate()).padStart(2, '0');
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const year = targetDate.getFullYear();

        return `${day}/${month}/${year}`;
    } catch {
        return '';
    }
};

/**
 * Get the date range string for the week containing the given date.
 * (Monday to Sunday)
 */
export const getCurrentWeekRange = (date: Date): string => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const fmt = (dt: Date) => `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
    return `${fmt(monday)} - ${fmt(sunday)}`;
};

/**
 * Parse start or end date from a week's date range string.
 * @param dateRange - e.g. "01/02/2026 - 07/02/2026"
 * @param position - 'start' or 'end'
 */
export const parseDateFromRange = (dateRange: string, position: 'start' | 'end'): Date | null => {
    try {
        const matches = dateRange.match(DATE_REGEX_GLOBAL);
        if (!matches || matches.length < 2) return null;
        const dateStr = position === 'start' ? matches[0] : matches[1];
        const [d, m, y] = dateStr.split('/').map(Number);
        return new Date(y, m - 1, d);
    } catch {
        return null;
    }
};

/** Check if current date falls within a week's date range */
export const isCurrentWeek = (dateRange: string, now: Date): boolean => {
    const matches = dateRange.match(DATE_REGEX_GLOBAL);
    if (!matches || matches.length < 2) return false;

    const [ds, ms, ys] = matches[0].split('/').map(Number);
    const [de, me, ye] = matches[1].split('/').map(Number);

    const start = new Date(ys, ms - 1, ds);
    const end = new Date(ye, me - 1, de);
    const check = new Date(now);
    check.setHours(0, 0, 0, 0);

    return check >= start && check <= end;
};

/** Check if a specific day in a week date range is today */
export const isDayToday = (dateRange: string, dayIdx: number, now: Date): boolean => {
    const dayDate = getDayDateString(dateRange, dayIdx);
    if (!dayDate) return false;
    const todayStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    return dayDate === todayStr;
};

/** Check if a week has already passed */
export const isPastWeek = (dateRange: string, now: Date): boolean => {
    const matches = dateRange.match(DATE_REGEX_GLOBAL);
    if (!matches || matches.length < 2) return false;

    const [de, me, ye] = matches[1].split('/').map(Number);
    const end = new Date(ye, me - 1, de, 23, 59, 59, 999);
    return now > end;
};

/** Filter state for session search/filter UI */
export interface FilterState {
    search: string;
    className: string;
    room: string;
    teacher: string;
    sessionTime: string;
}

/** Create a filter function for sessions based on filter state */
export const createSessionFilter = (filters: FilterState) => {
    return (session: CourseSession): boolean => {
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const nameMatch = session.courseName.toLowerCase().includes(searchLower);
            const codeMatch = session.courseCode.toLowerCase().includes(searchLower);
            if (!nameMatch && !codeMatch) return false;
        }
        if (filters.className && session.className !== filters.className) return false;
        if (filters.room && session.room !== filters.room) return false;
        if (filters.teacher && session.teacher !== filters.teacher) return false;
        return true;
    };
};

/**
 * Filter a week's sessions and return a new cloned week object if changes occurred.
 * Returns null if the week has completely 0 matching sessions.
 */
export const getFilteredWeek = (week: WeekSchedule, filterFn: (s: CourseSession) => boolean): { filteredWeek: WeekSchedule, hasSessions: boolean, isChanged: boolean } => {
    let hasSessions = false;
    let isChanged = false;
    const newDays: Record<string, DaySchedule> = {};

    for (const day of DAYS_OF_WEEK) {
        if (!week.days[day]) {
            newDays[day] = week.days[day];
            continue;
        }
        
        const orgM = week.days[day].morning;
        const orgA = week.days[day].afternoon;
        const orgE = week.days[day].evening;
        
        const m = orgM.filter(filterFn);
        const a = orgA.filter(filterFn);
        const e = orgE.filter(filterFn);

        if (m.length !== orgM.length || a.length !== orgA.length || e.length !== orgE.length) {
            isChanged = true;
        }
        if (m.length || a.length || e.length) hasSessions = true;
        
        newDays[day] = { morning: m, afternoon: a, evening: e };
    }
    
    // Only clone if the filter actually removed some sessions
    const filteredWeek = isChanged ? { ...week, days: newDays as typeof week.days } : week;
    return { filteredWeek, hasSessions, isChanged };
};

/**
 * Format semester string
 * - If single number or starts with number: "HK1", "HK2"
 * - If starts with 'hk' already: keep as is
 * - Otherwise: "HK Hè", "HK Spring"
 */
export const formatSemester = (sem: string): string => {
    if (!sem) return '';
    const trimmed = sem.trim();
    if (/^\d/.test(trimmed)) return `HK${trimmed}`;
    if (/^hk\s*/i.test(trimmed)) return trimmed;
    return `HK ${trimmed}`;
};

/**
 * Format room name with fallback
 * @param room - e.g. "C.A101"
 */
export const formatRoom = (room?: string): string => {
    if (!room) return '—';
    const trimmed = room.trim();
    if (!trimmed) return '—';
    // Remove leading dot and optional whitespace after it
    return trimmed.replace(/^\.\s*/, '') || '—';
};

/**
 * Format group name for concise display (e.g., "Nhóm 1" -> "N1")
 * Handles various input formats and guards against invalid groups.
 */
export const formatGroup = (group?: string | number): string => {
    if (!group) return '';
    
    const g = String(group).trim();
    if (!g) return '';

    // If already in N1 format, return as is (normalized to uppercase)
    if (/^N\d+$/i.test(g)) return g.toUpperCase();

    // Extract first number sequence
    const match = g.match(/\d+/);
    if (match) {
        const num = Number(match[0]);
        // Guard against "Nhóm 0" or non-positive numbers
        if (num > 0) return `N${num}`;
    }

    // Fallback: return trimmed original string
    return g;
};

/**
 * Format class and group for unified display (e.g., "DS 13A (N1)")
 * Defensive against missing fields.
 */
export const formatClassDisplay = (session: Partial<CourseSession>): string => {
    const className = session.className?.trim() || '—';
    const groupText = formatGroup(session.group);
    
    return groupText ? `${className} (${groupText})` : className;
};

/**
 * Schedule Utilities — TdyTime v2
 * Shared date parsing and session filtering helpers.
 * Used across multiple views (weekly, semester, today).
 */

import { CourseSession } from './schedule.types';

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
        .replace(/ths\.|ts\.|pgs\.|gs\.|gv\./g, '')
        .trim();
};

/** Check if a session belongs to the main teacher */
export const isMainTeacher = (tName: string, mainTeacherName: string) => {
    if (!tName || tName === 'Chưa rõ' || tName === 'Unknown') return true;
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

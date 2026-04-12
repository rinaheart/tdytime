/**
 * Exam Utils — Memoizable selector helpers
 * Pure functions for TodayHeader conditional prominence.
 */

import { ExamSession } from './exam.types';

/** Exam proximity level for TodayHeader rendering */
export type ExamProximity = 'none' | 'distant' | 'upcoming' | 'today';

/**
 * getExamProximity — Determine how prominently to show exam button
 * - 'none': No exam data
 * - 'distant': No exam within 7 days
 * - 'upcoming': Exam within 7 days (but not today)
 * - 'today': Exam happening today (ongoing or starts today)
 */
export const getExamProximity = (sessions: ExamSession[]): ExamProximity => {
    if (!sessions || sessions.length === 0) return 'none';

    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const sevenDays = now + 7 * 24 * 60 * 60 * 1000;

    let hasToday = false;
    let hasUpcoming = false;

    for (const s of sessions) {
        // Check if ongoing right now
        if (s.startTime <= now && s.endTime >= now) {
            return 'today'; // Ongoing — highest priority, return immediately
        }
        // Check if starts today
        if (s.startTime >= todayStart.getTime() && s.startTime <= todayEnd.getTime()) {
            hasToday = true;
        }
        // Check if within 7 days (and in the future)
        if (s.startTime > now && s.startTime <= sevenDays) {
            hasUpcoming = true;
        }
    }

    if (hasToday) return 'today';
    if (hasUpcoming) return 'upcoming';
    return 'distant';
};

/**
 * getUpcomingExamCount — Count exams within N days from now
 */
export const getUpcomingExamCount = (sessions: ExamSession[], days: number = 7): number => {
    const now = Date.now();
    const threshold = now + days * 24 * 60 * 60 * 1000;
    return sessions.filter(s => s.startTime >= now && s.startTime <= threshold).length;
};

/**
 * hasOngoingExam — Check if any exam is happening right now
 */
export const hasOngoingExam = (sessions: ExamSession[]): boolean => {
    const now = Date.now();
    return sessions.some(s => s.startTime <= now && s.endTime >= now);
};

/**
 * getExamDateRange — Format date range display string for exam sessions
 * Returns "DD/MM — DD/MM" for first and last session dates.
 */
export const getExamDateRange = (sessions: ExamSession[]): string => {
    if (sessions.length === 0) return '';
    const sorted = [...sessions].sort((a, b) => a.startTime - b.startTime);
    const first = sorted[0].dateStr.split('/').slice(0, 2).join('/');
    const last = sorted[sorted.length - 1].dateStr.split('/').slice(0, 2).join('/');
    return first === last ? first : `${first} — ${last}`;
};

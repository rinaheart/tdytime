/**
 * Pure Progress & Group Analytics Calculation Utilities — StatisticsView
 * Provides both the O(N) precomputed sessionsIndex algorithm and the Legacy nested traversal algorithm
 * with strict equivalence guarantees across all standard and edge-case business rules.
 */

import { DAYS_OF_WEEK } from '@/core/constants';
import { isMainTeacher } from '@/core/schedule/schedule.utils';
import { isSessionCancelled, resolveSessionPeriodRange, type FlatSession } from '@/core/schedule/schedule.index';
import type { CourseSession, ScheduleData } from '@/core/schedule/schedule.types';
import type { GroupProgressItem } from './cards/GroupProgressCard';

export interface ProgressStat {
    percent: number;
    done: number;
    total: number;
}

export interface ScheduleProgressResult {
    progress: {
        today: ProgressStat;
        week: ProgressStat;
        month: ProgressStat;
        semester: ProgressStat;
    };
    groupProgress: GroupProgressItem[];
}

const EMPTY_GROUP_PROGRESS: GroupProgressItem[] = [];

const EMPTY_PROGRESS_RESULT: ScheduleProgressResult = {
    progress: {
        today: { percent: 0, done: 0, total: 0 },
        week: { percent: 0, done: 0, total: 0 },
        month: { percent: 0, done: 0, total: 0 },
        semester: { percent: 0, done: 0, total: 0 },
    },
    groupProgress: EMPTY_GROUP_PROGRESS,
};

const pad2 = (n: number): string => (n < 10 ? `0${n}` : `${n}`);

const toValidPeriods = (periodCount: unknown): number => {
    if (typeof periodCount !== 'number' || !Number.isFinite(periodCount) || periodCount <= 0) {
        return 0;
    }
    return periodCount;
};

const toProgressStat = (done: number, total: number): ProgressStat => ({
    percent: total > 0 ? Math.round((done / total) * 100) : 0,
    done,
    total,
});

/**
 * Find all 1-based week indices whose dateRange covers `now` [weekStart 00:00:00, weekStart + 7 days).
 */
export const findMatchingWeekIndices = (data: ScheduleData, now: Date): Set<number> => {
    const matched = new Set<number>();
    if (!data || !Array.isArray(data.weeks)) return matched;

    for (let i = 0; i < data.weeks.length; i++) {
        const w = data.weeks[i];
        if (!w || typeof w.dateRange !== 'string') continue;
        const matches = w.dateRange.match(/(\d{2})\/(\d{2})\/(\d{4})/g);
        if (!matches || matches.length === 0) continue;
        const [ds, ms, ys] = matches[0].split('/').map(Number);
        if (!ds || !ms || !ys) continue;
        const weekStart = new Date(ys, ms - 1, ds, 0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        if (now >= weekStart && now < weekEnd) {
            matched.add(i + 1);
        }
    }
    return matched;
};

/**
 * Optimized O(N) single-pass progress calculation using precomputed `sessionsIndex`.
 */
export const calculateProgressFromIndex = (
    data: ScheduleData | null | undefined,
    sessionsIndex: FlatSession[] | null | undefined,
    now: Date,
    teacherName: string
): ScheduleProgressResult => {
    if (!data || !Array.isArray(data.weeks) || data.weeks.length === 0 || !sessionsIndex || sessionsIndex.length === 0) {
        return EMPTY_PROGRESS_RESULT;
    }

    let todayT = 0,
        todayD = 0,
        weekT = 0,
        weekD = 0,
        monthT = 0,
        monthD = 0,
        semT = 0,
        semD = 0;

    const groupMap = new Map<
        string,
        {
            code: string;
            courseName: string;
            className: string;
            group: string;
            type: CourseSession['type'];
            done: number;
            total: number;
        }
    >();

    const overrides = data.overrides;
    const hasOverrides = Boolean(overrides && Object.keys(overrides).length > 0);
    const nowTs = now.getTime();
    const todayStr = `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`;
    const monthSuffix = `/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`;
    const currentWeekIndices = findMatchingWeekIndices(data, now);

    for (let i = 0; i < sessionsIndex.length; i++) {
        const s = sessionsIndex[i];
        if (!s || isSessionCancelled(s as unknown as Partial<CourseSession> & Record<string, unknown>)) continue;

        const p = toValidPeriods(s.periodCount);
        if (p <= 0) continue;

        if (!isMainTeacher(s.teacher, teacherName)) continue;

        const effectiveType = hasOverrides && overrides![s.courseCode] ? overrides![s.courseCode] : s.type;
        const isToday = s.dateStr === todayStr;

        let finished: boolean;
        if (isToday) {
            if (s.hasValidEndTime === false) {
                finished = false;
            } else if (effectiveType !== s.type || s.hasValidEndTime === undefined || !Number.isFinite(s.endTs)) {
                const resolved = resolveSessionPeriodRange(s.timeSlot, effectiveType);
                if (!resolved) {
                    finished = false;
                } else {
                    const currentTotalMin = now.getHours() * 60 + now.getMinutes();
                    finished = resolved.periodEnd.end[0] * 60 + resolved.periodEnd.end[1] <= currentTotalMin;
                }
            } else {
                finished = s.endTs <= nowTs;
            }
        } else if (Number.isFinite(s.endTs)) {
            finished = s.endTs <= nowTs;
        } else {
            finished = false;
        }

        semT += p;
        if (finished) semD += p;

        if (currentWeekIndices.has(s.weekIdx)) {
            weekT += p;
            if (finished) weekD += p;
        }
        if (isToday) {
            todayT += p;
            if (finished) todayD += p;
        }
        if (typeof s.dateStr === 'string' && s.dateStr.endsWith(monthSuffix)) {
            monthT += p;
            if (finished) monthD += p;
        }

        const gKey = `${s.courseCode || ''}|${s.className || ''}|${s.group || ''}`;
        let gEntry = groupMap.get(gKey);
        if (!gEntry) {
            gEntry = {
                code: s.courseCode || '',
                courseName: s.courseName || s.courseCode || '',
                className: s.className || '',
                group: s.group || '',
                type: effectiveType,
                done: 0,
                total: 0,
            };
            groupMap.set(gKey, gEntry);
        }
        gEntry.total += p;
        if (finished) gEntry.done += p;
    }

    const groupProgress: GroupProgressItem[] = Array.from(groupMap.entries()).map(([key, item]) => ({
        key,
        ...item,
        percent: item.total > 0 ? Math.round((item.done / item.total) * 100) : 0,
    }));

    return {
        progress: {
            today: toProgressStat(todayD, todayT),
            week: toProgressStat(weekD, weekT),
            month: toProgressStat(monthD, monthT),
            semester: toProgressStat(semD, semT),
        },
        groupProgress,
    };
};

/**
 * Legacy nested-loop progress calculation over `data.weeks` -> `DAYS_OF_WEEK` -> shifts.
 * Used as fallback when `sessionsIndex` is not provided and as reference oracle in unit tests.
 */
export const calculateProgressLegacy = (
    data: ScheduleData | null | undefined,
    now: Date,
    teacherName: string
): ScheduleProgressResult => {
    if (!data || !Array.isArray(data.weeks) || data.weeks.length === 0) {
        return EMPTY_PROGRESS_RESULT;
    }

    let todayT = 0,
        todayD = 0,
        weekT = 0,
        weekD = 0,
        monthT = 0,
        monthD = 0,
        semT = 0,
        semD = 0;

    const groupMap = new Map<
        string,
        {
            code: string;
            courseName: string;
            className: string;
            group: string;
            type: CourseSession['type'];
            done: number;
            total: number;
        }
    >();

    const overrides = data.overrides || {};
    const currentTotalMin = now.getHours() * 60 + now.getMinutes();
    const todayDate = new Date(now);
    todayDate.setHours(0, 0, 0, 0);
    const seenKeys = new Set<string>();

    const isSessionFinished = (s: CourseSession, effectiveType: CourseSession['type'], sessionDate: Date) => {
        const d = new Date(sessionDate);
        d.setHours(0, 0, 0, 0);
        if (d < todayDate) return true;
        if (d > todayDate) return false;
        const resolved = resolveSessionPeriodRange(s.timeSlot, effectiveType);
        if (!resolved) return false;
        return resolved.periodEnd.end[0] * 60 + resolved.periodEnd.end[1] <= currentTotalMin;
    };

    data.weeks.forEach((w, wIdx) => {
        if (!w || !w.days || typeof w.dateRange !== 'string') return;
        const matches = w.dateRange.match(/(\d{2})\/(\d{2})\/(\d{4})/g);
        if (!matches || matches.length === 0) return;
        const [ds, ms, ys] = matches[0].split('/').map(Number);
        if (!ds || !ms || !ys) return;

        const weekStart = new Date(ys, ms - 1, ds, 0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        const isCurrentWeek = now >= weekStart && now < weekEnd;
        const weekIdx = wIdx + 1;

        DAYS_OF_WEEK.forEach((dName, dIdx) => {
            const dayObj = w.days[dName];
            if (!dayObj) return;

            const targetDate = new Date(weekStart);
            targetDate.setDate(weekStart.getDate() + dIdx);
            const isToday = targetDate.getTime() === todayDate.getTime();
            const isCurrentMonth =
                targetDate.getMonth() === now.getMonth() && targetDate.getFullYear() === now.getFullYear();

            const shifts = ['morning', 'afternoon', 'evening', 'night'] as const;
            shifts.forEach((shiftKey) => {
                const shiftSessions = (dayObj as unknown as Record<string, CourseSession[]>)[shiftKey];
                if (!Array.isArray(shiftSessions)) return;

                shiftSessions.forEach((s) => {
                    if (!s || isSessionCancelled(s as unknown as Partial<CourseSession> & Record<string, unknown>)) return;
                    const p = toValidPeriods(s.periodCount);
                    if (p <= 0) return;
                    if (!isMainTeacher(s.teacher, teacherName)) return;

                    const rawSlot = String(s.timeSlot || '');
                    const dedupKey = `${weekIdx}|${dIdx}|${shiftKey}|${s.courseCode || ''}|${s.className || ''}|${s.group || ''}|${rawSlot}|${s.room || ''}|${s.teacher || ''}`;
                    if (seenKeys.has(dedupKey)) return;
                    seenKeys.add(dedupKey);

                    const effectiveType = overrides[s.courseCode] || s.type;
                    const finished = isSessionFinished(s, effectiveType, targetDate);

                    semT += p;
                    if (finished) semD += p;
                    if (isCurrentWeek) {
                        weekT += p;
                        if (finished) weekD += p;
                    }
                    if (isToday) {
                        todayT += p;
                        if (finished) todayD += p;
                    }
                    if (isCurrentMonth) {
                        monthT += p;
                        if (finished) monthD += p;
                    }

                    const gKey = `${s.courseCode || ''}|${s.className || ''}|${s.group || ''}`;
                    let gEntry = groupMap.get(gKey);
                    if (!gEntry) {
                        gEntry = {
                            code: s.courseCode || '',
                            courseName: s.courseName || s.courseCode || '',
                            className: s.className || '',
                            group: s.group || '',
                            type: effectiveType,
                            done: 0,
                            total: 0,
                        };
                        groupMap.set(gKey, gEntry);
                    }
                    gEntry.total += p;
                    if (finished) gEntry.done += p;
                });
            });
        });
    });

    const groupProgress: GroupProgressItem[] = Array.from(groupMap.entries()).map(([key, item]) => ({
        key,
        ...item,
        percent: item.total > 0 ? Math.round((item.done / item.total) * 100) : 0,
    }));

    return {
        progress: {
            today: toProgressStat(todayD, todayT),
            week: toProgressStat(weekD, weekT),
            month: toProgressStat(monthD, monthT),
            semester: toProgressStat(semD, semT),
        },
        groupProgress,
    };
};

/**
 * Unified entry point used by `StatisticsView`.
 * Uses `sessionsIndex` when available; falls back to `calculateProgressLegacy` only if `sessionsIndex` is null/undefined.
 */
export const calculateScheduleProgress = (
    data: ScheduleData | null | undefined,
    sessionsIndex: FlatSession[] | null | undefined,
    now: Date,
    teacherName: string
): ScheduleProgressResult => {
    if (!data || !Array.isArray(data.weeks) || data.weeks.length === 0) {
        return EMPTY_PROGRESS_RESULT;
    }
    if (Array.isArray(sessionsIndex) && sessionsIndex.length > 0) {
        return calculateProgressFromIndex(data, sessionsIndex, now, teacherName);
    }
    return calculateProgressLegacy(data, now, teacherName);
};

import { CourseSession, ScheduleData } from './schedule.types';
import { getDayDateString } from './schedule.utils';
import { getPeriodTimes } from '../constants';
import { formatTimeRange } from '../../utils/timezone';

export interface FlatSession extends CourseSession {
    id: string;
    startTs: number;
    endTs: number;
    hasValidEndTime?: boolean;
    startTimeStr: string;
    endTimeStr: string;
    timeRangeStr: string;
    dateStr: string;
    weekRange: string;    // e.g. "12/04/2026 - 18/04/2026"
    weekIdx: number;      // 1-based (theo UMS convention)
    dayIdx: number;       // 0 = Monday (ISO 8601)
    shift: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface BuildIndexConfig {
    timezone?: string;
}

const SHIFT_MAP: Record<string, 'morning' | 'afternoon' | 'evening' | 'night'> = {
    morning: 'morning',
    afternoon: 'afternoon',
    evening: 'evening',
    night: 'night'
};

const DAY_NAME_TO_IDX: Record<string, number> = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4,
    'Saturday': 5,
    'Sunday': 6
};

export const isSessionCancelled = (s: Partial<CourseSession> & Record<string, unknown>): boolean => {
    return Boolean(
        s.isCancelled === true ||
        s.cancelled === true ||
        (typeof s.status === 'string' && s.status.toLowerCase() === 'cancelled')
    );
};

export interface ResolvedPeriodRange {
    startP: number;
    endP: number;
    periodStart: { start: readonly [number, number]; end: readonly [number, number] };
    periodEnd: { start: readonly [number, number]; end: readonly [number, number] };
}

/**
 * Strictly validates and resolves a session's `timeSlot` (e.g. "1-3" or "4") against the period table.
 * Rejects empty strings, trailing dashes ("2-"), non-integers ("1-abc"), inverted ranges ("5-2"),
 * or period numbers outside the configured period table.
 */
export const resolveSessionPeriodRange = (
    timeSlot: unknown,
    type: CourseSession['type']
): ResolvedPeriodRange | null => {
    const rawSlot = String(timeSlot ?? '').trim();
    if (!rawSlot) return null;

    const parts = rawSlot.split('-');
    if (parts.length > 2) return null;

    const startStr = parts[0].trim();
    const endStr = parts.length === 2 ? parts[1].trim() : startStr;
    if (!/^\d+$/.test(startStr) || !/^\d+$/.test(endStr)) return null;

    const startP = Number(startStr);
    const endP = Number(endStr);
    if (!Number.isInteger(startP) || !Number.isInteger(endP) || startP <= 0 || endP < startP) {
        return null;
    }

    const times = getPeriodTimes(type);
    const periodStart = times[startP];
    const periodEnd = times[endP];
    if (!periodStart || !periodEnd) return null;

    return { startP, endP, periodStart, periodEnd };
};

/**
 * buildScheduleIndex — Precomputes a flat, sorted list of all teaching sessions.
 * Converts week/day structure into a searchable timeline.
 */
export const buildScheduleIndex = (data: ScheduleData, config: BuildIndexConfig = {}): FlatSession[] => {
    if (!data || !Array.isArray(data.weeks)) return [];

    const index: FlatSession[] = [];
    const { timezone } = config;
    const overrides = data.overrides || {};
    const seenKeys = new Set<string>();

    data.weeks.forEach((week, wIdx) => {
        if (!week || !week.days || !week.dateRange) return;
        // weekIdx is 1-based per UMS convention
        const weekIdx = wIdx + 1;

        Object.entries(week.days).forEach(([dayName, daySchedule]) => {
            if (!daySchedule) return;
            const dayIdx = DAY_NAME_TO_IDX[dayName];
            if (dayIdx === undefined) return;
            const dateStr = getDayDateString(week.dateRange, dayIdx);
            if (!dateStr) return;

            const [d, m, y] = dateStr.split('/').map(Number);
            if (!d || !m || !y) return;
            const baseDate = new Date(y, m - 1, d);

            const shifts = ['morning', 'afternoon', 'evening', 'night'] as const;
            
            shifts.forEach(shiftKey => {
                const sessions = (daySchedule as unknown as Record<string, CourseSession[]>)[shiftKey];
                if (!Array.isArray(sessions)) return;
                
                sessions.forEach((s) => {
                    if (!s || isSessionCancelled(s as unknown as Partial<CourseSession> & Record<string, unknown>)) return;
                    if (s.periodCount !== undefined && (typeof s.periodCount !== 'number' || !Number.isFinite(s.periodCount) || s.periodCount <= 0)) {
                        return;
                    }

                    const effectiveType = overrides[s.courseCode] || s.type;
                    const rawSlot = String(s.timeSlot || '');
                    const dedupKey = `${weekIdx}|${dayIdx}|${shiftKey}|${s.courseCode || ''}|${s.className || ''}|${s.group || ''}|${rawSlot}|${s.room || ''}|${s.teacher || ''}`;
                    if (seenKeys.has(dedupKey)) return;
                    seenKeys.add(dedupKey);

                    const resolvedRange = resolveSessionPeriodRange(rawSlot, effectiveType);
                    const hasValidEndTime = resolvedRange !== null;

                    const startDateTime = new Date(baseDate);
                    if (resolvedRange) {
                        startDateTime.setHours(resolvedRange.periodStart.start[0], resolvedRange.periodStart.start[1], 0, 0);
                    } else {
                        startDateTime.setHours(23, 59, 58, 0);
                    }

                    const endDateTime = new Date(baseDate);
                    if (resolvedRange) {
                        endDateTime.setHours(resolvedRange.periodEnd.end[0], resolvedRange.periodEnd.end[1], 0, 0);
                    } else {
                        endDateTime.setHours(23, 59, 59, 999);
                    }

                    const startTs = startDateTime.getTime();
                    const endTs = endDateTime.getTime();
                    const timeRangeStr = resolvedRange ? formatTimeRange(startTs, endTs, { timezone }) : '00:00 - 23:59';
                    const [startTimeStr, endTimeStr] = timeRangeStr.split(' - ');
                    
                    // Generate a stable ID
                    const id = `w${week.weekNumber}-d${dayIdx}-${shiftKey}-${s.courseCode}-${rawSlot}`.toLowerCase();

                    index.push({
                        ...s,
                        type: effectiveType,
                        id,
                        weekIdx,
                        dayIdx,
                        shift: SHIFT_MAP[shiftKey],
                        dateStr,
                        weekRange: week.dateRange,
                        startTs,
                        endTs,
                        hasValidEndTime,
                        startTimeStr,
                        endTimeStr,
                        timeRangeStr,
                    });
                });
            });
        });
    });

    // Sort by time
    return index.sort((a, b) => a.startTs - b.startTs);
};

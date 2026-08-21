import { CourseSession, ScheduleData } from './schedule.types';
import { getDayDateString } from './schedule.utils';
import { getPeriodTimes } from '../constants';
import { formatTimeRange } from '../../utils/timezone';

export interface FlatSession extends CourseSession {
    id: string;
    startTs: number;
    endTs: number;
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

/**
 * buildScheduleIndex — Precomputes a flat, sorted list of all teaching sessions.
 * Converts week/day structure into a searchable timeline.
 */
export const buildScheduleIndex = (data: ScheduleData, config: BuildIndexConfig = {}): FlatSession[] => {
    if (!data || !data.weeks) return [];

    const index: FlatSession[] = [];
    const { timezone } = config;

    data.weeks.forEach((week, wIdx) => {
        // weekIdx is 1-based per UMS convention
        const weekIdx = wIdx + 1;

        Object.entries(week.days).forEach(([dayName, daySchedule]) => {
            const dayIdx = DAY_NAME_TO_IDX[dayName] ?? 0;
            const dateStr = getDayDateString(week.dateRange, dayIdx);
            if (!dateStr) return;

            const [d, m, y] = dateStr.split('/').map(Number);
            const baseDate = new Date(y, m - 1, d);

            const shifts = ['morning', 'afternoon', 'evening', 'night'] as const;
            
            shifts.forEach(shiftKey => {
                const sessions = (daySchedule as unknown as Record<string, CourseSession[]>)[shiftKey];
                if (!sessions) return;
                
                sessions.forEach((s) => {
                    const times = getPeriodTimes(s.type);
                    const startP = parseInt(s.timeSlot.split('-')[0]);
                    const endP = parseInt(s.timeSlot.split('-')[1] || String(startP));

                    const periodStart = times[startP];
                    const periodEnd = times[endP] || periodStart;

                    if (!periodStart || !periodEnd) return;

                    const startDateTime = new Date(baseDate);
                    startDateTime.setHours(periodStart.start[0], periodStart.start[1], 0, 0);

                    const endDateTime = new Date(baseDate);
                    endDateTime.setHours(periodEnd.end[0], periodEnd.end[1], 0, 0);

                    const startTs = startDateTime.getTime();
                    const endTs = endDateTime.getTime();
                    const timeRangeStr = formatTimeRange(startTs, endTs, { timezone });
                    const [startTimeStr, endTimeStr] = timeRangeStr.split(' - ');
                    
                    // Generate a stable ID
                    const id = `w${week.weekNumber}-d${dayIdx}-${shiftKey}-${s.courseCode}-${s.timeSlot}`.toLowerCase();

                    index.push({
                        ...s,
                        id,
                        weekIdx,
                        dayIdx,
                        shift: SHIFT_MAP[shiftKey],
                        dateStr,
                        weekRange: week.dateRange,
                        startTs,
                        endTs,
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

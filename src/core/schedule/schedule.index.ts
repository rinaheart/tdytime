import { CourseSession, ScheduleData } from './schedule.types';
import { getDayDateString } from './schedule.utils';
import { getPeriodTimes } from '../constants';

export interface FlatSession extends CourseSession {
    absoluteStart: number;
    absoluteEnd: number;
    startTimeStr: string;
    endTimeStr: string;
}

/**
 * buildScheduleIndex — Precomputes a flat, sorted list of all teaching sessions.
 * Converts week/day structure into a searchable timeline.
 */
export const buildScheduleIndex = (data: ScheduleData): FlatSession[] => {
    if (!data || !data.weeks) return [];

    const index: FlatSession[] = [];

    data.weeks.forEach((week) => {
        Object.entries(week.days).forEach(([_, daySchedule], dayIdx) => {
            const dateStr = getDayDateString(week.dateRange, dayIdx);
            if (!dateStr) return;

            const [d, m, y] = dateStr.split('/').map(Number);
            const baseDate = new Date(y, m - 1, d);

            const allSessions = [
                ...daySchedule.morning,
                ...daySchedule.afternoon,
                ...daySchedule.evening,
            ];

            allSessions.forEach((s) => {
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

                const fmt = (t: [number, number]) => 
                    `${String(t[0]).padStart(2, '0')}:${String(t[1]).padStart(2, '0')}`;

                index.push({
                    ...s,
                    dateStr,
                    absoluteStart: startDateTime.getTime(),
                    absoluteEnd: endDateTime.getTime(),
                    startTimeStr: fmt(periodStart.start),
                    endTimeStr: fmt(periodEnd.end),
                });
            });
        });
    });

    // Sort by time
    return index.sort((a, b) => a.absoluteStart - b.absoluteStart);
};

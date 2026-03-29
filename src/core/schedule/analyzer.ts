/**
 * Schedule Analyzer — TdyTime v2
 * Calculates comprehensive metrics from parsed schedule data.
 * Logic preserved from v1 (battle-tested through 9 versions).
 */

import { ScheduleData, Metrics, CourseType, DaySchedule, CourseSession, TranslationItem } from './schedule.types';
import { DAYS_OF_WEEK, CHUA_RO } from '../constants';
import { normalizeTeacherName, isMainTeacher } from './schedule.utils';

/**
 * Calculate all analytics metrics from a parsed schedule.
 * Filters for main teacher only; co-teachers are tracked separately.
 */
export const calculateMetrics = (data: ScheduleData): Metrics => {
    let totalHours = 0;
    let totalSessions = 0;
    const hoursByDay: Record<string, number> = {};
    const hoursByWeek: Record<number, number> = {};
    const typeDistribution = { [CourseType.LT]: 0, [CourseType.TH]: 0 };
    const roomMetrics: Record<string, number> = {};
    const classMetrics: Record<string, number> = {};
    const subjectMetrics: Record<string, number> = {};
    const coTeacherMap = new Map<string, { periods: number; details: Map<string, { subject: string; class: string; group: string; periods: number }> }>();

    const shiftStats = {
        morning: { hours: 0, sessions: 0 },
        afternoon: { hours: 0, sessions: 0 },
        evening: { hours: 0, sessions: 0 },
    };

    const warnings: string[] = [];

    const mainTeacherName = normalizeTeacherName(data.metadata.teacher);

    DAYS_OF_WEEK.forEach((d) => (hoursByDay[d] = 0));

    // Internal helper for localized check if needed, or just use shared one
    const checkIsMain = (t: string) => isMainTeacher(t, mainTeacherName);

    // Check if two time slots overlap
    const isTimeOverlap = (slot1: string, slot2: string) => {
        const parseSlot = (s: string) => {
            const nums = s.split('-').map(Number);
            return nums.length === 2 ? { start: nums[0], end: nums[1] } : { start: nums[0], end: nums[0] };
        };
        const s1 = parseSlot(slot1);
        const s2 = parseSlot(slot2);
        return Math.max(s1.start, s2.start) <= Math.min(s1.end, s2.end);
    };

    // --- Pass 1: Detect Conflicts ---
    data.weeks.forEach((w) => {
        Object.values(w.days).forEach((day) => {
            const parts = day as DaySchedule;
            const allDaySessions = [...parts.morning, ...parts.afternoon, ...parts.evening];

            allDaySessions.forEach((s) => (s.hasConflict = false));

            allDaySessions.forEach((s1) => {
                // Teacher overlap
                const teacherConflicts = allDaySessions.filter(
                    (s2) =>
                        s1 !== s2 &&
                        s1.teacher === s2.teacher &&
                        s1.teacher !== 'Unknown' &&
                        s1.teacher !== CHUA_RO &&
                        isTimeOverlap(s1.timeSlot, s2.timeSlot) &&
                        (s1.room !== s2.room || s1.courseCode !== s2.courseCode || s1.group !== s2.group),
                );

                // Room overlap
                const roomConflicts = allDaySessions.filter(
                    (s2) =>
                        s1 !== s2 &&
                        s1.room === s2.room &&
                        s1.room !== CHUA_RO &&
                        s1.room !== 'Unknown' &&
                        isTimeOverlap(s1.timeSlot, s2.timeSlot) &&
                        (s1.courseCode !== s2.courseCode || s1.group !== s2.group || s1.teacher !== s2.teacher),
                );

                if (teacherConflicts.length > 0 || roomConflicts.length > 0) {
                    s1.hasConflict = true;
                }
            });
        });
    });

    let busiestWeek = { week: 1, hours: 0, range: '' };
    let peakWeekHeatmap: { day: string; count: number }[] = [];
    let peakWeekShiftStats = { morning: 0, afternoon: 0, evening: 0 };
    const heatmapData: number[][] = [];

    // --- Pass 2: Calculate Metrics (main teacher only) ---
    let totalConflictsCount = 0;
    data.weeks.forEach((w) => {
        // Count conflicts
        Object.values(w.days).forEach((day) => {
            const parts = day as DaySchedule;
            [...parts.morning, ...parts.afternoon, ...parts.evening].forEach((s) => {
                if (s.hasConflict) totalConflictsCount++;
            });
        });

        let weekTotal = 0;
        const currentWeekHeatmap: Record<string, number> = {};
        DAYS_OF_WEEK.forEach((d) => (currentWeekHeatmap[d] = 0));
        const currentWeekShifts = { morning: 0, afternoon: 0, evening: 0 };
        const weekMatrixRow: number[] = new Array(7).fill(0);

        Object.entries(w.days).forEach(([day, sessions]) => {
            const parts = sessions as DaySchedule;
            const dayIndex = DAYS_OF_WEEK.indexOf(day);

            const processPart = (part: CourseSession[], shift: 'morning' | 'afternoon' | 'evening') => {
                part.forEach((s) => {
                    // Co-teacher → track separately, skip main stats
                    if (!checkIsMain(s.teacher)) {
                        if (!coTeacherMap.has(s.teacher)) {
                            coTeacherMap.set(s.teacher, { periods: 0, details: new Map() });
                        }
                        const co = coTeacherMap.get(s.teacher)!;
                        co.periods += s.periodCount;
                        const detailKey = `${s.courseName}|${s.className}|${s.group}`;
                        if (!co.details.has(detailKey)) {
                            co.details.set(detailKey, { subject: s.courseName, class: s.className, group: s.group, periods: 0 });
                        }
                        co.details.get(detailKey)!.periods += s.periodCount;
                        return;
                    }

                    // Main teacher stats
                    shiftStats[shift].sessions += 1;
                    shiftStats[shift].hours += s.periodCount;
                    totalSessions += 1;
                    typeDistribution[s.type] += s.periodCount;
                    roomMetrics[s.room] = (roomMetrics[s.room] || 0) + s.periodCount;
                    if (s.className) classMetrics[s.className] = (classMetrics[s.className] || 0) + s.periodCount;
                    subjectMetrics[s.courseName] = (subjectMetrics[s.courseName] || 0) + s.periodCount;
                    totalHours += s.periodCount;
                    hoursByDay[day] += s.periodCount;
                    weekTotal += s.periodCount;
                    currentWeekHeatmap[day] += s.periodCount;
                    currentWeekShifts[shift] += 1;
                    if (dayIndex !== -1) weekMatrixRow[dayIndex] += s.periodCount;

                    // Warnings
                    if (s.sessionTime === 'evening') warnings.push('EVENING_CLASS');
                    if (['Saturday', 'Sunday'].includes(s.dayOfWeek)) warnings.push('WEEKEND_CLASS');
                    if (s.periodCount === 1) warnings.push('SINGLE_PERIOD');
                });
            };

            processPart(parts.morning, 'morning');
            processPart(parts.afternoon, 'afternoon');
            processPart(parts.evening, 'evening');
        });

        heatmapData.push(weekMatrixRow);
        hoursByWeek[w.weekNumber] = weekTotal;

        // Track peak week
        if (weekTotal > busiestWeek.hours) {
            busiestWeek = { week: w.weekNumber, hours: weekTotal, range: w.dateRange };
            peakWeekHeatmap = Object.entries(currentWeekHeatmap).map(([d, c]) => ({ day: d, count: c }));
            peakWeekShiftStats = currentWeekShifts;
        }
    });

    // Busiest day
    let busiestDay = { day: 'Monday', hours: 0 };
    Object.entries(hoursByDay).forEach(([day, hours]) => {
        if (hours > busiestDay.hours) busiestDay = { day, hours };
    });

    const uniqueSubjects = new Set(Object.keys(subjectMetrics));

    const topRooms = Object.entries(roomMetrics)
        .map(([room, periods]) => ({ room, periods }))
        .sort((a, b) => b.periods - a.periods)
        .slice(0, 10);

    const classDistribution = Object.entries(classMetrics)
        .map(([className, periods]) => ({ className, periods }))
        .sort((a, b) => b.periods - a.periods);

    const subjectDistribution = Object.entries(subjectMetrics)
        .map(([name, periods]) => ({ name, periods }))
        .sort((a, b) => b.periods - a.periods);

    const coTeachers = Array.from(coTeacherMap.entries()).map(([name, d]) => ({
        name,
        periods: d.periods,
        details: Array.from(d.details.values()),
    })).sort((a, b) => b.periods - a.periods);

    // --- Distinct Warnings ---
    const distinctWarnings: TranslationItem[] = [];
    
    const eveningCount = warnings.filter((w) => w === 'EVENING_CLASS').length;
    if (eveningCount > 0) {
        distinctWarnings.push({
            key: 'stats.warningsList.evening',
            params: { count: eveningCount }
        });
    }
    const weekendCount = warnings.filter((w) => w === 'WEEKEND_CLASS').length;
    if (weekendCount > 0) {
        distinctWarnings.push({
            key: 'stats.warningsList.weekend',
            params: { count: weekendCount }
        });
    }
    const singlePeriodCount = warnings.filter((w) => w === 'SINGLE_PERIOD').length;
    if (singlePeriodCount > 0) {
        distinctWarnings.push({
            key: 'stats.warningsList.singlePeriod',
            params: { count: singlePeriodCount }
        });
    }
    if (totalConflictsCount > 0) {
        distinctWarnings.push({
            key: 'stats.warningsList.conflicts',
            params: { count: Math.round(totalConflictsCount / 2) }
        });
    }

    // --- Conclusions ---
    const conclusions: TranslationItem[] = [];

    // Time distribution
    const firstHalfWeeks = data.weeks.length / 2;
    const firstHalfHours = Object.entries(hoursByWeek)
        .filter(([w]) => parseInt(w) <= firstHalfWeeks)
        .reduce((acc, [, h]) => acc + h, 0);

    if (firstHalfHours > totalHours * 0.6) {
        conclusions.push({ key: 'stats.conclusionsList.earlyFocused' });
    } else if (firstHalfHours < totalHours * 0.4) {
        conclusions.push({ key: 'stats.conclusionsList.lateFocused' });
    } else {
        conclusions.push({ key: 'stats.conclusionsList.balanced' });
    }

    // Type dominance
    if (typeDistribution[CourseType.TH] > typeDistribution[CourseType.LT]) {
        conclusions.push({
            key: 'stats.conclusionsList.practiceDominant',
            params: { percent: Math.round((typeDistribution[CourseType.TH] / totalHours) * 100) }
        });
    } else {
        conclusions.push({
            key: 'stats.conclusionsList.theoryDominant',
            params: { percent: Math.round((typeDistribution[CourseType.LT] / totalHours) * 100) }
        });
    }

    // Peak time
    const maxShift = Object.entries(shiftStats).sort((a, b) => b[1].hours - a[1].hours)[0][0];
    const busyDayIndex = DAYS_OF_WEEK.indexOf(busiestDay.day);

    conclusions.push({
        key: 'stats.conclusionsList.peakTime',
        params: {
            shift: `shifts.${maxShift}`, // Nested key reference
            day: `days.${busyDayIndex}` // Nested key reference
        }
    });

    // Efficiency
    if (singlePeriodCount > 0 || weekendCount > 0) {
        conclusions.push({ key: 'stats.conclusionsList.optimizeNeeded' });
    }

    return {
        totalWeeks: data.weeks.length,
        totalHours,
        totalSessions,
        totalCourses: uniqueSubjects.size,
        totalGroups: data.allCourses.length,
        totalRooms: Object.keys(roomMetrics).length,
        busiestDay,
        busiestWeek,
        hoursByDay,
        hoursByWeek,
        typeDistribution,
        shiftStats,
        topRooms,
        classDistribution,
        subjectDistribution,
        coTeachers,
        totalConflicts: Math.round(totalConflictsCount / 2),
        warnings: distinctWarnings,
        conclusions,
        peakWeekHeatmap,
        peakWeekShiftStats,
        heatmapData,
    };
};

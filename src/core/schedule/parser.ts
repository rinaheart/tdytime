/**
 * Schedule HTML Parser — TdyTime v2
 * Parses UMS-exported HTML timetable files into structured ScheduleData.
 * Logic preserved from v1 (battle-tested through 9 versions).
 */

import {
    ScheduleData,
    Metadata,
    WeekSchedule,
    CourseSession,
    CourseType,
    DaySchedule,
    AggregatedCourse,
} from './schedule.types';
import { COURSE_TYPE_TH_REGEX } from './schedule.utils';
import { UNKNOWN_TEACHER, CHUA_RO } from '../constants';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Parse a UMS HTML timetable string into structured schedule data.
 * @throws Error if the HTML doesn't contain valid timetable structure.
 */
export const parseScheduleHTML = (html: string): ScheduleData | null => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Validate essential structure
    const weekCells = doc.querySelectorAll('.hitec-td-tkbTuan');
    if (weekCells.length === 0) {
        throw new Error('upload.errors.parseWeekNotFound');
    }

    const table = doc.querySelector('table.table-bordered');
    if (!table) {
        throw new Error('upload.errors.parseTableNotFound');
    }

    // Extract metadata
    const teacher = doc.querySelector('.hitec-information h5')?.textContent?.trim() || UNKNOWN_TEACHER;
    const yearSemesterText = doc.querySelector('.hitec-year')?.textContent?.trim() || '';
    const semesterMatch = yearSemesterText.match(/Học kỳ:\s*(\d+)/i);
    const yearMatch = yearSemesterText.match(/năm học:\s*([\d-]+)/i);

    const metadata: Metadata = {
        teacher,
        semester: semesterMatch ? semesterMatch[1] : 'Unknown',
        academicYear: yearMatch ? yearMatch[1] : 'Unknown',
        extractedDate: new Date().toISOString(),
    };

    // Parse weeks
    const weeks: WeekSchedule[] = [];
    const tableRows = Array.from(doc.querySelectorAll('table.table-bordered tbody tr'));

    let currentWeek: WeekSchedule | null = null;
    let weekCounter = 0;

    for (let i = 0; i < tableRows.length; i++) {
        const row = tableRows[i];
        const weekRangeCell = row.querySelector('.hitec-td-tkbTuan');

        if (weekRangeCell) {
            weekCounter++;
            currentWeek = {
                weekNumber: weekCounter,
                dateRange: weekRangeCell.textContent?.trim() || '',
                days: {},
            };

            DAYS.forEach((day) => {
                currentWeek!.days[day] = { morning: [], afternoon: [], evening: [] };
            });

            const morningRow = tableRows[i + 1];
            const afternoonRow = tableRows[i + 2];
            const eveningRow = tableRows[i + 3];

            if (morningRow) processSlotRow(morningRow, 'morning', currentWeek);
            if (afternoonRow) processSlotRow(afternoonRow, 'afternoon', currentWeek);
            if (eveningRow) processSlotRow(eveningRow, 'evening', currentWeek);

            weeks.push(currentWeek);
            i += 3;
        }
    }

    if (weeks.length === 0) {
        throw new Error('upload.errors.noData');
    }

    return {
        metadata,
        weeks,
        allCourses: aggregateCourses(weeks),
    };
};

/** Process a single slot row (morning/afternoon/evening) and populate the week */
const processSlotRow = (
    row: Element,
    session: 'morning' | 'afternoon' | 'evening',
    week: WeekSchedule,
) => {
    const cells = Array.from(row.querySelectorAll('td'));
    cells.forEach((cell, dayIdx) => {
        if (dayIdx >= 7) return;
        const dayName = DAYS[dayIdx];
        const courseLinks = Array.from(cell.querySelectorAll('a'));

        courseLinks.forEach((link) => {
            const groupCode = link.querySelector('strong')?.textContent?.trim() || '';
            const popoverContent = link.getAttribute('data-content') || '';
            const fullTitle = link.getAttribute('title') || '';

            // Parse: CourseName - Nhóm X - ClassName
            const parts = fullTitle.split(' - ').map((p) => p.trim());
            let group = '';
            let className = '';
            let courseName = '';

            const groupIndex = parts.findIndex((p) => p.toLowerCase().includes('nhóm'));
            if (groupIndex !== -1) {
                courseName = parts.slice(0, groupIndex).join(' - ');
                group = parts[groupIndex];
                className = parts.slice(groupIndex + 1).join(' - ');
            } else {
                courseName = parts[0] || groupCode;
            }

            const roomMatch = popoverContent.match(/Phòng học:\s*([^<]+)/);
            const slotMatch = popoverContent.match(/Tiết:\s*(\d+)\s*-\s*(\d+)/);
            const teacherMatch = popoverContent.match(/Giáo viên:\s*([^<]*)/);

            const periodStart = slotMatch ? parseInt(slotMatch[1]) : 0;
            const periodEnd = slotMatch ? parseInt(slotMatch[2]) : 0;
            const periods = periodEnd - periodStart + 1;

            // SMART DEFAULTS: Auto-detect TH based on groupCode containing '-TH.'
            // OR courseName starting with 'TT ' (Thực tập)
            const isPractice = COURSE_TYPE_TH_REGEX.test(groupCode) || courseName.startsWith('TT ');
            const type = isPractice ? CourseType.TH : CourseType.LT;

            const timeSlot = `${periodStart}-${periodEnd}`;

            const sessionObj: CourseSession = {
                // Generate unique ID
                id: `${groupCode}-${dayName}-${timeSlot}`,
                courseCode: groupCode,
                courseName,
                group,
                className,
                timeSlot,
                periodCount: periods,
                room: roomMatch ? roomMatch[1].trim().replace(/^\.\s*/, '') : 'Unknown',
                teacher: teacherMatch ? teacherMatch[1].trim() : CHUA_RO,
                type,
                dayOfWeek: dayName,
                sessionTime: session,
            };

            week.days[dayName][session].push(sessionObj);
        });
    });
};

/** Aggregate courses across all weeks for summary stats */
const aggregateCourses = (weeks: WeekSchedule[]): AggregatedCourse[] => {
    const map = new Map<string, AggregatedCourse>();

    weeks.forEach((w) => {
        Object.values(w.days).forEach((day) => {
            const dayParts = day as DaySchedule;
            const allSessions = [...dayParts.morning, ...dayParts.afternoon, ...dayParts.evening];

            allSessions.forEach((s) => {
                const fullCode = s.courseCode;
                if (!map.has(fullCode)) {
                    map.set(fullCode, {
                        code: fullCode,
                        name: s.courseName,
                        totalPeriods: 0,
                        totalSessions: 0,
                        groups: [],
                        classes: [],
                        types: [],
                    });
                }
                const course = map.get(fullCode)!;
                course.totalPeriods += s.periodCount;
                course.totalSessions += 1;
                if (s.group && !course.groups.includes(s.group)) course.groups.push(s.group);
                if (s.className && !course.classes.includes(s.className)) course.classes.push(s.className);
                if (!course.types.includes(s.type)) course.types.push(s.type);
            });
        });
    });

    return Array.from(map.values());
};

/**
 * Backward Compatibility Middleware
 * Sanitizes and upgrades legacy parsed ScheduleData from localStorage/History.
 * Reapplies the deterministic '-TH.' course type logic to old arrays.
 */
export const sanitizeScheduleData = (data: ScheduleData): ScheduleData => {
    // 1. Deep clone to avoid mutating origin unexpectedly
    const clonedData = JSON.parse(JSON.stringify(data)) as ScheduleData;

    // 2. Traverse and reclassify all sessions
    clonedData.weeks.forEach((week) => {
        const daysToProcess: (keyof typeof week.days)[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        daysToProcess.forEach((dayName) => {
            const dayParts = week.days[dayName];
            if (!dayParts) return;

            const sessions = [...dayParts.morning, ...dayParts.afternoon, ...dayParts.evening];
            sessions.forEach(session => {
                // Re-apply the deterministic rule (including 'TT ' prefix check)
                const isPractice = COURSE_TYPE_TH_REGEX.test(session.courseCode) || session.courseName.startsWith('TT ');
                session.type = isPractice ? CourseType.TH : CourseType.LT;
                
                // Sanitize room name (remove leading dots)
                if (session.room) {
                    session.room = session.room.trim().replace(/^\.\s*/, '');
                }
            });
        });
    });

    // 3. Re-aggregate the summary array based on newly scrubbed sessions
    clonedData.allCourses = aggregateCourses(clonedData.weeks);

    return clonedData;
};

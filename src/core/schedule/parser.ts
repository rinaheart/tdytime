/**
 * Schedule HTML Parser — TdyTime v2
 * Parses UMS-exported HTML timetable files into structured ScheduleData.
 * Logic preserved from v1 (battle-tested through 9 versions).
 */

import { CourseType, type ScheduleData, type WeekSchedule, type AggregatedCourse } from './schedule.types';
import { COURSE_TYPE_TH_REGEX } from './schedule.utils';
import { CHUA_RO } from '../constants';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Module-scope precompiled Regular Expressions (zero allocation inside parsing loops)
const SEMESTER_REGEX = /Học kỳ:\s*(\d+)/i;
const YEAR_REGEX = /năm học:\s*([\d-]+)/i;
const ROOM_REGEX = /Phòng học:\s*([^<]+)/;
const SLOT_REGEX = /Tiết:\s*(\d+)\s*-\s*(\d+)/;
const TEACHER_REGEX = /Giáo viên:\s*([^<]*)/;
const LEADING_DOT_REGEX = /^\.\s*/;

/**
 * Parse a UMS HTML timetable string into structured schedule data.
 * @throws Error if the HTML doesn't contain valid timetable structure.
 */
export const parseScheduleHTML = (html: string): ScheduleData => {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (doc.querySelectorAll('.hitec-td-tkbTuan').length === 0) {
        throw new Error('upload.errors.parseWeekNotFound');
    }
    if (!doc.querySelector('table.table-bordered')) {
        throw new Error('upload.errors.parseTableNotFound');
    }

    const teacher = doc.querySelector('.hitec-information h5')?.textContent?.trim() || 'Unknown Teacher';
    const yearSemesterText = doc.querySelector('.hitec-year')?.textContent?.trim() || '';
    const semesterMatch = yearSemesterText.match(SEMESTER_REGEX);
    const yearMatch = yearSemesterText.match(YEAR_REGEX);

    const metadata = {
        teacher,
        semester: semesterMatch ? semesterMatch[1] : 'Unknown',
        academicYear: yearMatch ? yearMatch[1] : 'Unknown',
        extractedDate: new Date().toISOString(),
    };

    const weeks: WeekSchedule[] = [];
    const tableRows = Array.from(doc.querySelectorAll('table.table-bordered tbody tr'));
    let currentWeek: WeekSchedule | null = null;
    let weekCounter = 0;

    for (let i = 0; i < tableRows.length; i++) {
        const weekRangeCell = tableRows[i].querySelector('.hitec-td-tkbTuan');
        if (weekRangeCell) {
            weekCounter++;
            currentWeek = {
                weekNumber: weekCounter,
                dateRange: weekRangeCell.textContent?.trim() || '',
                days: {},
            };
            DAYS.forEach((day) => {
                currentWeek!.days[day] = {
                    morning: [],
                    afternoon: [],
                    evening: [],
                };
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
    Array.from(row.querySelectorAll('td')).forEach((cell, dayIdx) => {
        if (dayIdx >= 7) return;
        const dayName = DAYS[dayIdx];

        Array.from(cell.querySelectorAll('a')).forEach((link) => {
            const groupCode = link.querySelector('strong')?.textContent?.trim() || '';
            const popoverContent = link.getAttribute('data-content') || '';
            const parts = (link.getAttribute('title') || '').split(' - ').map((p) => p.trim());

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

            const roomMatch = popoverContent.match(ROOM_REGEX);
            const slotMatch = popoverContent.match(SLOT_REGEX);
            const teacherMatch = popoverContent.match(TEACHER_REGEX);

            const periodStart = slotMatch ? parseInt(slotMatch[1], 10) : 0;
            const periodEnd = slotMatch ? parseInt(slotMatch[2], 10) : 0;
            const periods = periodEnd - periodStart + 1;

            const type =
                COURSE_TYPE_TH_REGEX.test(groupCode) || courseName.startsWith('TT ')
                    ? CourseType.TH
                    : CourseType.LT;
            const timeSlot = `${periodStart}-${periodEnd}`;

            const sessionObj = {
                id: `${groupCode}-${dayName}-${timeSlot}`,
                courseCode: groupCode,
                courseName,
                group,
                className,
                timeSlot,
                periodCount: periods,
                room: roomMatch ? roomMatch[1].trim().replace(LEADING_DOT_REGEX, '') : 'Unknown',
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
        Object.values(w.days).forEach((dayParts) => {
            [...dayParts.morning, ...dayParts.afternoon, ...dayParts.evening].forEach((s) => {
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
    const clonedData: ScheduleData = JSON.parse(JSON.stringify(data));
    clonedData.weeks.forEach((week) => {
        DAYS.forEach((dayName) => {
            const dayParts = week.days[dayName];
            if (!dayParts) return;
            [...dayParts.morning, ...dayParts.afternoon, ...dayParts.evening].forEach((session) => {
                session.type =
                    COURSE_TYPE_TH_REGEX.test(session.courseCode) || session.courseName.startsWith('TT ')
                        ? CourseType.TH
                        : CourseType.LT;
                if (session.room) {
                    session.room = session.room.trim().replace(LEADING_DOT_REGEX, '');
                }
            });
        });
    });
    clonedData.allCourses = aggregateCourses(clonedData.weeks);
    return clonedData;
};

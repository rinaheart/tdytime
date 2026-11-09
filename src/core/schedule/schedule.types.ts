/**
 * Core Domain Types — TdyTime v2
 * All schedule-related data structures.
 */

export enum CourseType {
    LT = 'LT',
    TH = 'TH',
}

/** Translation helper for dynamic i18n */
export interface TranslationItem {
    key: string;
    params?: Record<string, unknown>;
}

/** A single teaching session within a week */
export interface CourseSession {
    /** Unique ID: `${courseCode}-${dayOfWeek}-${timeSlot}` */
    id: string;
    courseCode: string;
    courseName: string;
    group: string;
    className: string;
    /** Period range, e.g. "1-3" */
    timeSlot: string;
    periodCount: number;
    room: string;
    teacher: string;
    type: CourseType;
    dayOfWeek: string;
    sessionTime: 'morning' | 'afternoon' | 'evening';
    dateStr?: string;
    hasConflict?: boolean;
}

/** Sessions grouped by time of day */
export interface DaySchedule {
    morning: CourseSession[];
    afternoon: CourseSession[];
    evening: CourseSession[];
}

/** A single week with all days */
export interface WeekSchedule {
    weekNumber: number;
    /** Format: "DD/MM/YYYY - DD/MM/YYYY" */
    dateRange: string;
    days: Record<string, DaySchedule>;
}

/** Schedule file metadata */
export interface Metadata {
    teacher: string;
    semester: string;
    academicYear: string;
    extractedDate: string;
}

/** Complete parsed schedule */
export interface ScheduleData {
    metadata: Metadata;
    weeks: WeekSchedule[];
    allCourses: AggregatedCourse[];
    overrides?: Record<string, CourseType>;
    abbreviations?: Record<string, string>;
}

/** Course aggregate across all weeks */
export interface AggregatedCourse {
    code: string;
    name: string;
    totalPeriods: number;
    totalSessions: number;
    groups: string[];
    classes: string[];
    types: CourseType[];
}

/** Calculated metrics for the entire schedule */
export interface Metrics {
    totalWeeks: number;
    totalHours: number;
    totalSessions: number;
    totalCourses: number;
    totalGroups: number;
    totalRooms: number;
    busiestDay: { day: string; hours: number };
    busiestWeek: { week: number; hours: number; range: string };
    hoursByDay: Record<string, number>;
    hoursByWeek: Record<number, number>;
    typeDistribution: Record<CourseType, number>;
    shiftStats: {
        morning: { hours: number; sessions: number };
        afternoon: { hours: number; sessions: number };
        evening: { hours: number; sessions: number };
    };
    topRooms: { room: string; periods: number }[];
    classDistribution: { className: string; periods: number }[];
    subjectDistribution: { name: string; periods: number }[];
    coTeachers: {
        name: string;
        periods: number;
        details: { subject: string; class: string; group: string; periods: number }[];
    }[];
    totalConflicts: number;
    warnings: TranslationItem[];
    conclusions: TranslationItem[];
    peakWeekHeatmap: { day: string; count: number }[];
    peakWeekShiftStats: { morning: number; afternoon: number; evening: number };
    /** [weekIndex][dayIndex] → period count */
    heatmapData: number[][];
}

/** Alert thresholds for daily/weekly hours */
export interface Thresholds {
    daily: { warning: number; danger: number };
    weekly: { warning: number; danger: number };
}

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { parseScheduleHTML } from './parser';
import { CourseType } from './schedule.types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MOCKS_DIR = resolve(__dirname, '../../../tests/mocks');

const readMock = (fileName: string) => readFileSync(resolve(MOCKS_DIR, fileName), 'utf-8');

describe('parseScheduleHTML — scenario-1-base.html (single week, mixed LT/TH)', () => {
    let html: string;

    beforeAll(() => {
        html = readMock('scenario-1-base.html');
    });

    it('extracts metadata (teacher, semester, academic year)', () => {
        const data = parseScheduleHTML(html)!;
        expect(data.metadata.teacher).toBe('Demo A1');
        expect(data.metadata.semester).toBe('2');
        expect(data.metadata.academicYear).toBe('2025-2026');
    });

    it('parses exactly one week with the correct date range', () => {
        const data = parseScheduleHTML(html)!;
        expect(data.weeks).toHaveLength(1);
        expect(data.weeks[0].weekNumber).toBe(1);
        expect(data.weeks[0].dateRange).toBe('23/03/2026 - 29/03/2026');
    });

    it('parses two morning sessions on Monday (LT + TH in the same cell)', () => {
        const data = parseScheduleHTML(html)!;
        const monday = data.weeks[0].days['Monday'];
        expect(monday.morning).toHaveLength(2);

        const [lt, th] = monday.morning;
        expect(lt.courseCode).toBe('INT101-LT.');
        expect(lt.courseName).toBe('Nhập môn lập trình');
        expect(lt.group).toBe('Nhóm 1');
        expect(lt.className).toBe('CTK45');
        expect(lt.room).toBe('A1.1');
        expect(lt.timeSlot).toBe('1-3');
        expect(lt.periodCount).toBe(3);
        expect(lt.teacher).toBe('Demo A1');
        expect(lt.sessionTime).toBe('morning');

        expect(th.courseCode).toBe('INT101-TH.');
        expect(th.courseName).toBe('Thực hành lập trình');
        expect(th.room).toBe('A1.2');
        expect(th.timeSlot).toBe('4-5');
        expect(th.periodCount).toBe(2);
    });

    it('auto-detects course type from the "-TH." suffix in courseCode', () => {
        const data = parseScheduleHTML(html)!;
        const [lt, th] = data.weeks[0].days['Monday'].morning;
        expect(lt.type).toBe(CourseType.LT);
        expect(th.type).toBe(CourseType.TH);
    });

    it('parses the afternoon session on Wednesday', () => {
        const data = parseScheduleHTML(html)!;
        const wednesday = data.weeks[0].days['Wednesday'];
        expect(wednesday.afternoon).toHaveLength(1);

        const session = wednesday.afternoon[0];
        expect(session.courseCode).toBe('DB101-LT.');
        expect(session.courseName).toBe('Cơ sở dữ liệu');
        expect(session.group).toBe('Nhóm 2');
        expect(session.className).toBe('CTK44');
        expect(session.room).toBe('B2.1');
        expect(session.timeSlot).toBe('7-9');
        expect(session.periodCount).toBe(3);
        expect(session.type).toBe(CourseType.LT);
        expect(session.sessionTime).toBe('afternoon');
    });

    it('leaves days/sessions with no classes as empty arrays, not undefined', () => {
        const data = parseScheduleHTML(html)!;
        const week = data.weeks[0];
        expect(week.days['Tuesday'].morning).toEqual([]);
        expect(week.days['Monday'].evening).toEqual([]);
        expect(week.days['Sunday'].morning).toEqual([]);
    });

    it('generates a stable, unique id per session (courseCode-day-timeSlot)', () => {
        const data = parseScheduleHTML(html)!;
        const [lt, th] = data.weeks[0].days['Monday'].morning;
        expect(lt.id).toBe('INT101-LT.-Monday-1-3');
        expect(th.id).toBe('INT101-TH.-Monday-4-5');
    });

    it('aggregates courses across the week with correct totals', () => {
        const data = parseScheduleHTML(html)!;
        expect(data.allCourses).toHaveLength(3);

        const int101Lt = data.allCourses.find((c) => c.code === 'INT101-LT.')!;
        expect(int101Lt.totalSessions).toBe(1);
        expect(int101Lt.totalPeriods).toBe(3);
        expect(int101Lt.types).toEqual([CourseType.LT]);

        const int101Th = data.allCourses.find((c) => c.code === 'INT101-TH.')!;
        expect(int101Th.totalPeriods).toBe(2);
        expect(int101Th.types).toEqual([CourseType.TH]);

        const db101 = data.allCourses.find((c) => c.code === 'DB101-LT.')!;
        expect(db101.totalPeriods).toBe(3);
        expect(db101.groups).toEqual(['Nhóm 2']);
        expect(db101.classes).toEqual(['CTK44']);
    });
});

describe('parseScheduleHTML — scenario-2-empty.html (empty week + populated week)', () => {
    let html: string;

    beforeAll(() => {
        html = readMock('scenario-2-empty.html');
    });

    it('parses both weeks even when the first week has no sessions', () => {
        const data = parseScheduleHTML(html)!;
        expect(data.weeks).toHaveLength(2);
        expect(data.weeks[0].dateRange).toBe('23/03/2026 - 29/03/2026');
        expect(data.weeks[1].dateRange).toBe('30/03/2026 - 05/04/2026');
    });

    it('week 1 has zero sessions across all days and shifts', () => {
        const data = parseScheduleHTML(html)!;
        const week1 = data.weeks[0];
        const totalSessions = Object.values(week1.days).reduce(
            (sum, day) => sum + day.morning.length + day.afternoon.length + day.evening.length,
            0,
        );
        expect(totalSessions).toBe(0);
    });

    it('week 2 has exactly one Monday-morning session, correctly attributed', () => {
        const data = parseScheduleHTML(html)!;
        const week2 = data.weeks[1];
        expect(week2.days['Monday'].morning).toHaveLength(1);

        const session = week2.days['Monday'].morning[0];
        expect(session.courseCode).toBe('INT101-LT.');
        expect(session.teacher).toBe('Demo A2');
        expect(session.type).toBe(CourseType.LT);
    });

    it('does not throw when an entire week has no classes (does not hit the "no data" path)', () => {
        // Regression guard: an all-empty *week* must not be confused with the
        // "0 weeks found at all" case that throws 'upload.errors.noData'.
        expect(() => parseScheduleHTML(html)).not.toThrow();
    });
});

describe('parseScheduleHTML — error paths', () => {
    it('throws "upload.errors.parseWeekNotFound" when no .hitec-td-tkbTuan cell exists', () => {
        const html = `
            <div class="hitec-information"><h5>No Week</h5></div>
            <table class="table-bordered"><tbody><tr><td>empty</td></tr></tbody></table>
        `;
        expect(() => parseScheduleHTML(html)).toThrow('upload.errors.parseWeekNotFound');
    });

    it('throws "upload.errors.parseTableNotFound" when no table.table-bordered exists', () => {
        const html = `
            <div class="hitec-information"><h5>No Table</h5></div>
            <table class="hitec-td-tkbTuan"><tr><td class="hitec-td-tkbTuan">01/01/2026 - 07/01/2026</td></tr></table>
        `;
        expect(() => parseScheduleHTML(html)).toThrow('upload.errors.parseTableNotFound');
    });

    it('throws on completely empty/garbage HTML input', () => {
        expect(() => parseScheduleHTML('<html><body>not a schedule</body></html>')).toThrow(
            'upload.errors.parseWeekNotFound',
        );
    });
});

describe('parseScheduleHTML — 1_schedule_anon_full.html', () => {
    let html: string;

    beforeAll(() => {
        html = readMock('1_schedule_anon_full.html');
    });

    it('parses correctly without throwing', () => {
        const data = parseScheduleHTML(html);
        expect(data).not.toBeNull();
        expect(data?.weeks.length).toBeGreaterThan(0);
    });
});

describe('parseScheduleHTML — 5_schedule_test_ultra_minimal.html', () => {
    let html: string;

    beforeAll(() => {
        html = readMock('5_schedule_test_ultra_minimal.html');
    });

    it('parses correctly without throwing', () => {
        const data = parseScheduleHTML(html);
        expect(data).not.toBeNull();
    });
});

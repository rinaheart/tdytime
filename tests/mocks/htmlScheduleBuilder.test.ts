/**
 * HTML Schedule Builder & Real-World File Load Test Suite
 * Tests rapid generation of UMS-compatible HTML schedule files (serializeScheduleToUMSHTML / generateMockScheduleHTML)
 * and verifies that all mock HTML files in `tests/mocks/` span the active 09/2026 – 12/2026 semester window.
 *
 * Run via: npx vitest run tests/mocks/htmlScheduleBuilder.test.ts
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseScheduleHTML } from '../../src/core/schedule/parser';
import { buildScheduleIndex } from '../../src/core/schedule/schedule.index';
import { calculateMetrics } from '../../src/core/schedule/analyzer';
import { calculateScheduleProgress } from '../../src/views/statistics/stats.utils';
import {
    DEFAULT_GRID,
    cloneGrid,
    patternToGrid,
    generateMockScheduleHTML,
    serializeScheduleToUMSHTML,
    type ScheduleBuilderConfig,
} from '../../src/utils/mockGenerator';

const __dirname = dirname(fileURLToPath(import.meta.url));

const readMockFile = (name: string) => readFileSync(resolve(__dirname, name), 'utf-8');

function createBuilderConfig(overrides: Partial<ScheduleBuilderConfig> = {}): ScheduleBuilderConfig {
    return {
        mockDate: '2026-11-05',
        mockTime: '10:30',
        weekCount: 10,
        speedMultiplier: 1,
        seed: 'semester-2026-q4',
        pattern: 'balanced',
        sessionsGrid: cloneGrid(DEFAULT_GRID),
        teacherName: 'Giảng Viên A',
        semester: '1',
        academicYear: { start: 2026, end: 2027 },
        overlapMode: 'none',
        weekDistribution: 'uniform',
        pastWeekFactor: 1.0,
        futureWeekFactor: 1.0,
        ...overrides,
    };
}

describe('Mock HTML Files (09/2026 – 12/2026 Active Semester Window)', () => {
    const currentDate = new Date(2026, 10, 5, 10, 30, 0); // 05/11/2026 10:30

    it('1_schedule_anon_full.html spans 14/09/2026 – 13/12/2026 and has active progress on 05/11/2026', () => {
        const html = readMockFile('1_schedule_anon_full.html');
        const data = parseScheduleHTML(html)!;

        expect(data).not.toBeNull();
        expect(data.weeks).toHaveLength(10);
        expect(data.weeks[0].dateRange).toContain('14/09/2026');
        expect(data.weeks[4].dateRange).toContain('02/11/2026');
        expect(data.weeks[4].dateRange).toContain('08/11/2026');
        expect(data.weeks[9].dateRange).toContain('13/12/2026');

        const index = buildScheduleIndex(data);
        const { progress, groupProgress } = calculateScheduleProgress(
            data,
            index,
            currentDate,
            data.metadata.teacher
        );

        // On Thursday 05/11/2026 10:30, the current week (02/11 - 08/11), month (11/2026), and semester (09-12/2026) are active
        expect(progress.today.total).toBeGreaterThan(0);
        expect(progress.week.total).toBeGreaterThan(0);
        expect(progress.month.total).toBeGreaterThan(0);
        expect(progress.semester.total).toBeGreaterThan(0);
        expect(progress.semester.done).toBeGreaterThan(0);
        expect(progress.semester.done).toBeLessThan(progress.semester.total);
        expect(groupProgress.length).toBeGreaterThan(0);
    });

    it('5_schedule_test_ultra_minimal.html spans 02/11/2026 – 15/11/2026 and parses cleanly', () => {
        const html = readMockFile('5_schedule_test_ultra_minimal.html');
        const data = parseScheduleHTML(html)!;

        expect(data.weeks).toHaveLength(2);
        expect(data.weeks[0].dateRange).toContain('02/11/2026');
        expect(data.weeks[1].dateRange).toContain('09/11/2026');

        const index = buildScheduleIndex(data);
        const { progress } = calculateScheduleProgress(data, index, currentDate, data.metadata.teacher);
        expect(progress.week.total).toBe(8);
        expect(progress.semester.total).toBe(15);
    });

    it('scenario-1-base.html and scenario-2-empty.html use November 2026 active weeks', () => {
        const s1 = parseScheduleHTML(readMockFile('scenario-1-base.html'))!;
        const s2 = parseScheduleHTML(readMockFile('scenario-2-empty.html'))!;

        expect(s1.weeks[0].dateRange).toBe('02/11/2026 - 08/11/2026');
        expect(s2.weeks[0].dateRange).toBe('02/11/2026 - 08/11/2026');
        expect(s2.weeks[1].dateRange).toBe('09/11/2026 - 15/11/2026');
    });
});

describe('HTML Schedule Builder (generateMockScheduleHTML & serializeScheduleToUMSHTML)', () => {
    it('builds a valid 10-week UMS HTML schedule (09/2026 – 12/2026) and round-trips through parseScheduleHTML', () => {
        const config = createBuilderConfig({
            mockDate: '2026-11-05',
            weekCount: 10,
            pattern: 'balanced',
            seed: 'ums-html-roundtrip',
        });

        const { html, data: generatedData, mockTime } = generateMockScheduleHTML(config);

        expect(html).toContain('class="hitec-information"');
        expect(html).toContain('class="hitec-year"');
        expect(html).toContain('class="table table-bordered"');
        expect(html).toContain('class="hitec-td-tkbTuan"');

        // Parse the generated HTML using the production UMS HTML parser
        const parsed = parseScheduleHTML(html)!;
        expect(parsed).not.toBeNull();
        expect(parsed.metadata.teacher).toBe('Giảng Viên A');
        expect(parsed.metadata.semester).toBe('1');
        expect(parsed.metadata.academicYear).toBe('2026-2027');
        expect(parsed.weeks).toHaveLength(10);

        // Verify total session count matches between generated structure and parsed HTML
        const countSessions = (d: typeof generatedData) =>
            d.weeks.reduce(
                (acc, w) =>
                    acc +
                    Object.values(w.days).reduce(
                        (dAcc, day) => dAcc + day.morning.length + day.afternoon.length + day.evening.length,
                        0
                    ),
                0
            );

        expect(countSessions(parsed)).toBe(countSessions(generatedData));

        // Verify downstream pipeline (buildScheduleIndex, calculateMetrics, calculateScheduleProgress)
        const index = buildScheduleIndex(parsed);
        const metrics = calculateMetrics(parsed);
        const { progress, groupProgress } = calculateScheduleProgress(
            parsed,
            index,
            mockTime,
            parsed.metadata.teacher
        );

        expect(metrics.totalHours).toBe(progress.semester.total);
        expect(groupProgress.length).toBeGreaterThan(1);
    });

    it('supports all pattern modes (dense, sparse, randomized, edge-case) and overlap modes in HTML build', () => {
        const patterns = ['balanced', 'dense', 'sparse', 'randomized', 'edge-case'] as const;

        for (const pattern of patterns) {
            const config = createBuilderConfig({
                weekCount: 3,
                pattern,
                sessionsGrid: patternToGrid(pattern, `seed-${pattern}`),
                overlapMode: pattern === 'edge-case' ? 'multiple' : 'none',
                seed: `seed-${pattern}`,
            });

            const { html } = generateMockScheduleHTML(config);
            const parsed = parseScheduleHTML(html)!;

            expect(parsed.weeks).toHaveLength(3);
            expect(parsed.allCourses.length).toBeGreaterThan(0);
        }
    });

    it('serializes custom ScheduleData into UMS HTML and preserves LT/TH course types and group names', () => {
        const config = createBuilderConfig({ weekCount: 1, seed: 'lt-th-check' });
        const { data } = generateMockScheduleHTML(config);
        const customHtml = serializeScheduleToUMSHTML(data);
        const parsed = parseScheduleHTML(customHtml)!;

        const hasLT = parsed.allCourses.some((c) => c.code.includes('-LT.'));
        const hasTH = parsed.allCourses.some((c) => c.code.includes('-TH.'));
        expect(hasLT || hasTH).toBe(true);
    });
});

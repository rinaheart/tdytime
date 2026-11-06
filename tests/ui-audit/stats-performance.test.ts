/**
 * Comprehensive Data Integrity, Edge-Case Equivalence & Performance Audit — StatisticsView
 * Tests the production functions in `src/views/statistics/stats.utils.ts` and `src/core/schedule/schedule.index.ts`.
 * Run via: npx vitest run tests/ui-audit/stats-performance.test.ts
 */

import React from 'react';
import { describe, it, expect, beforeAll } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseScheduleHTML } from '../../src/core/schedule/parser';
import { buildScheduleIndex, type FlatSession } from '../../src/core/schedule/schedule.index';
import { calculateMetrics } from '../../src/core/schedule/analyzer';
import { CourseType, type ScheduleData, type CourseSession } from '../../src/core/schedule/schedule.types';
import {
    calculateProgressFromIndex,
    calculateProgressLegacy,
    calculateScheduleProgress,
} from '../../src/views/statistics/stats.utils';
import { useScheduleStore } from '../../src/core/stores/schedule.store';
import StatisticsView from '../../src/views/statistics/StatisticsView';
import '../../src/i18n/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MOCK_FILE = resolve(__dirname, '../mocks/1_schedule_anon_full.html');
const TOKENS_CSS_FILE = resolve(__dirname, '../../src/styles/tokens.css');
const GLOBAL_CSS_FILE = resolve(__dirname, '../../src/styles/global.css');

const createMockSchedule = (
    weeks: ScheduleData['weeks'],
    teacher = 'Nguyễn Văn A',
    overrides?: Record<string, CourseType>
): ScheduleData => ({
    metadata: {
        teacher,
        semester: '2',
        academicYear: '2025-2026',
        extractedDate: '2026-02-01T00:00:00.000Z',
    },
    weeks,
    allCourses: [],
    overrides,
});

const createSession = (overrides: Partial<CourseSession> & Record<string, unknown> = {}): CourseSession => ({
    id: 'mock-id',
    courseCode: 'INT101',
    courseName: 'Lập trình cơ bản',
    group: 'Nhóm 1',
    className: 'CNTT 18A',
    timeSlot: '1-3',
    periodCount: 3,
    room: 'A.201',
    teacher: 'Nguyễn Văn A',
    type: CourseType.LT,
    dayOfWeek: 'Monday',
    sessionTime: 'morning',
    ...overrides,
});

describe('StatisticsView — Data Integrity, Edge Cases & Legacy Equivalence', () => {
    let realData: ScheduleData;
    let realIndex: FlatSession[];

    beforeAll(() => {
        const html = readFileSync(MOCK_FILE, 'utf-8');
        realData = parseScheduleHTML(html)!;
        realIndex = buildScheduleIndex(realData);
    });

    it('1. Empty / Missing Data: handles null, undefined, empty weeks, and empty sessionsIndex safely', () => {
        const now = new Date(2026, 2, 18, 10, 0, 0);
        const emptyExpected = {
            progress: {
                today: { percent: 0, done: 0, total: 0 },
                week: { percent: 0, done: 0, total: 0 },
                month: { percent: 0, done: 0, total: 0 },
                semester: { percent: 0, done: 0, total: 0 },
            },
            groupProgress: [],
        };

        expect(calculateProgressFromIndex(null, null, now, '')).toEqual(emptyExpected);
        expect(calculateProgressLegacy(null, now, '')).toEqual(emptyExpected);
        expect(calculateScheduleProgress(undefined, undefined, now, '')).toEqual(emptyExpected);

        const emptyWeeksData = createMockSchedule([]);
        expect(calculateProgressFromIndex(emptyWeeksData, [], now, 'Nguyễn Văn A')).toEqual(emptyExpected);
        expect(calculateProgressLegacy(emptyWeeksData, now, 'Nguyễn Văn A')).toEqual(emptyExpected);
        expect(calculateScheduleProgress(emptyWeeksData, [], now, 'Nguyễn Văn A')).toEqual(emptyExpected);
    });

    it('2. Cancelled Sessions: ignores sessions marked isCancelled, cancelled, or status="cancelled"', () => {
        const activeSession = createSession({ courseCode: 'CS101', timeSlot: '1-3', periodCount: 3 });
        const cancelled1 = createSession({ courseCode: 'CS102', timeSlot: '4-5', periodCount: 2, isCancelled: true });
        const cancelled2 = createSession({ courseCode: 'CS103', timeSlot: '6-8', periodCount: 3, cancelled: true });
        const cancelled3 = createSession({ courseCode: 'CS104', timeSlot: '11-13', periodCount: 3, status: 'Cancelled' });

        const schedule = createMockSchedule([
            {
                weekNumber: 1,
                dateRange: '16/03/2026 - 22/03/2026',
                days: {
                    Monday: {
                        morning: [activeSession, cancelled1],
                        afternoon: [cancelled2],
                        evening: [cancelled3],
                    },
                },
            },
        ]);

        const index = buildScheduleIndex(schedule);
        const now = new Date(2026, 2, 16, 12, 0, 0); // Monday 16/03/2026 12:00 (after 1-3 ends at 09:35)

        const legacy = calculateProgressLegacy(schedule, now, 'Nguyễn Văn A');
        const optimized = calculateProgressFromIndex(schedule, index, now, 'Nguyễn Văn A');

        expect(index).toHaveLength(1);
        expect(optimized).toEqual(legacy);
        expect(optimized.progress.semester).toEqual({ percent: 100, done: 3, total: 3 });
        expect(optimized.groupProgress).toHaveLength(1);
    });

    it('3. Unfinished Session & 4. Boundary endTs === nowMs: exact millisecond precision around period end', () => {
        // LT Period 1-3 ends at 09:35:00.000
        const session = createSession({ timeSlot: '1-3', periodCount: 3, type: CourseType.LT });
        const schedule = createMockSchedule([
            {
                weekNumber: 1,
                dateRange: '16/03/2026 - 22/03/2026',
                days: {
                    Monday: { morning: [session], afternoon: [], evening: [] },
                },
            },
        ]);
        const index = buildScheduleIndex(schedule);
        expect(index).toHaveLength(1);

        const endTs = index[0].endTs;
        expect(endTs).toBe(new Date(2026, 2, 16, 9, 35, 0, 0).getTime());

        // Case A: 1ms before endTs (09:34:59.999) -> Unfinished (0%)
        const beforeEnd = new Date(endTs - 1);
        const optBefore = calculateProgressFromIndex(schedule, index, beforeEnd, 'Nguyễn Văn A');
        const legBefore = calculateProgressLegacy(schedule, beforeEnd, 'Nguyễn Văn A');
        expect(optBefore).toEqual(legBefore);
        expect(optBefore.progress.today).toEqual({ percent: 0, done: 0, total: 3 });

        // Case B: Exact boundary endTs === nowMs (09:35:00.000) -> Finished (100%)
        const exactEnd = new Date(endTs);
        const optExact = calculateProgressFromIndex(schedule, index, exactEnd, 'Nguyễn Văn A');
        const legExact = calculateProgressLegacy(schedule, exactEnd, 'Nguyễn Văn A');
        expect(optExact).toEqual(legExact);
        expect(optExact.progress.today).toEqual({ percent: 100, done: 3, total: 3 });

        // Case C: 1ms after endTs (09:35:00.001) -> Finished (100%)
        const afterEnd = new Date(endTs + 1);
        const optAfter = calculateProgressFromIndex(schedule, index, afterEnd, 'Nguyễn Văn A');
        const legAfter = calculateProgressLegacy(schedule, afterEnd, 'Nguyễn Văn A');
        expect(optAfter).toEqual(legAfter);
        expect(optAfter.progress.today).toEqual({ percent: 100, done: 3, total: 3 });
    });

    it('5. Duplicate Sessions: deduplicates exact duplicate records without dropping distinct sessions', () => {
        const s1 = createSession({ courseCode: 'CS101', group: 'Nhóm 1', timeSlot: '1-3', periodCount: 3 });
        const s1Duplicate = createSession({ courseCode: 'CS101', group: 'Nhóm 1', timeSlot: '1-3', periodCount: 3 });
        const s2DistinctSlot = createSession({ courseCode: 'CS101', group: 'Nhóm 1', timeSlot: '4-5', periodCount: 2 });
        const s3DistinctGroup = createSession({
            courseCode: 'CS101',
            group: 'Nhóm 2',
            timeSlot: '6-8',
            periodCount: 3,
            sessionTime: 'afternoon',
        });

        const schedule = createMockSchedule([
            {
                weekNumber: 1,
                dateRange: '16/03/2026 - 22/03/2026',
                days: {
                    Monday: {
                        morning: [s1, s1Duplicate, s2DistinctSlot],
                        afternoon: [s3DistinctGroup],
                        evening: [],
                    },
                },
            },
        ]);

        const index = buildScheduleIndex(schedule);
        const now = new Date(2026, 2, 16, 18, 0, 0);

        const legacy = calculateProgressLegacy(schedule, now, 'Nguyễn Văn A');
        const optimized = calculateProgressFromIndex(schedule, index, now, 'Nguyễn Văn A');

        // s1Duplicate is deduplicated; total periods = 3 (s1) + 2 (s2) + 3 (s3) = 8
        expect(index).toHaveLength(3);
        expect(optimized).toEqual(legacy);
        expect(optimized.progress.semester).toEqual({ percent: 100, done: 8, total: 8 });
        expect(optimized.groupProgress).toHaveLength(2);
        expect(optimized.groupProgress.find((g) => g.group === 'Nhóm 1')?.total).toBe(5);
        expect(optimized.groupProgress.find((g) => g.group === 'Nhóm 2')?.total).toBe(3);
    });

    it('6. Schedule & Course Group / Type Changes: updates progress when overrides change LT <-> TH or groups change', () => {
        // Period 1-3: LT ends at 09:35, TH ends at 10:00.
        // At 09:45 on Monday 16/03/2026: LT is finished, TH is NOT finished!
        const session = createSession({
            courseCode: 'BIO201',
            courseName: 'Sinh học phân tử',
            group: 'Nhóm 1',
            timeSlot: '1-3',
            periodCount: 3,
            type: CourseType.LT,
        });

        const baseSchedule = createMockSchedule([
            {
                weekNumber: 1,
                dateRange: '16/03/2026 - 22/03/2026',
                days: {
                    Monday: { morning: [session], afternoon: [], evening: [] },
                },
            },
        ]);

        const checkTime = new Date(2026, 2, 16, 9, 45, 0); // 09:45

        // As LT (default): finished at 09:35 -> 100% done at 09:45
        const ltIndex = buildScheduleIndex(baseSchedule);
        const ltOpt = calculateProgressFromIndex(baseSchedule, ltIndex, checkTime, 'Nguyễn Văn A');
        const ltLeg = calculateProgressLegacy(baseSchedule, checkTime, 'Nguyễn Văn A');
        expect(ltOpt).toEqual(ltLeg);
        expect(ltOpt.progress.today).toEqual({ percent: 100, done: 3, total: 3 });
        expect(ltOpt.groupProgress[0].type).toBe(CourseType.LT);

        // Override BIO201 to TH: ends at 10:00 -> 0% done at 09:45!
        const overriddenSchedule = createMockSchedule(baseSchedule.weeks, 'Nguyễn Văn A', {
            BIO201: CourseType.TH,
        });
        const thIndex = buildScheduleIndex(overriddenSchedule);
        const thOpt = calculateProgressFromIndex(overriddenSchedule, thIndex, checkTime, 'Nguyễn Văn A');
        const thLeg = calculateProgressLegacy(overriddenSchedule, checkTime, 'Nguyễn Văn A');
        const thMetrics = calculateMetrics(overriddenSchedule);

        expect(thOpt).toEqual(thLeg);
        expect(thOpt.progress.today).toEqual({ percent: 0, done: 0, total: 3 });
        expect(thOpt.groupProgress[0].type).toBe(CourseType.TH);
        expect(thMetrics.typeDistribution[CourseType.TH]).toBe(3);
        expect(thMetrics.typeDistribution[CourseType.LT]).toBe(0);
    });

    it('7. Missing or Invalid Data (hasValidEndTime): handles invalid/inverted/corrupted timeSlots at midday and 23:59:59.999 identically', () => {
        const validPast = createSession({ courseCode: 'C1', timeSlot: '1-3', periodCount: 3 });
        const invalidSlotPast = createSession({ courseCode: 'C2', timeSlot: '99-100', periodCount: 2 });
        const invalidSlotToday = createSession({ courseCode: 'C3', timeSlot: '1-99', periodCount: 4 });
        const invertedSlotToday = createSession({ courseCode: 'C3B', timeSlot: '5-2', periodCount: 2 });
        const trailingDashToday = createSession({ courseCode: 'C3C', timeSlot: '2-', periodCount: 2 });
        const nonNumericToday = createSession({ courseCode: 'C3D', timeSlot: '1-abc', periodCount: 2 });
        const emptySlotFuture = createSession({ courseCode: 'C4', timeSlot: '', periodCount: 2 });
        const zeroPeriod = createSession({ courseCode: 'C5', timeSlot: '1-3', periodCount: 0 });
        const negativePeriod = createSession({ courseCode: 'C6', timeSlot: '1-3', periodCount: -5 });
        const nanPeriod = createSession({ courseCode: 'C7', timeSlot: '1-3', periodCount: Number.NaN });

        const schedule = createMockSchedule([
            {
                weekNumber: 1,
                dateRange: 'bad-date-range',
                days: {
                    Monday: { morning: [validPast], afternoon: [], evening: [] },
                },
            },
            {
                weekNumber: 2,
                dateRange: '16/03/2026 - 22/03/2026',
                days: {
                    Monday: { morning: [validPast, invalidSlotPast, zeroPeriod, negativePeriod, nanPeriod], afternoon: [], evening: [] },
                    Tuesday: { morning: [invalidSlotToday, invertedSlotToday, trailingDashToday, nonNumericToday], afternoon: [], evening: [] },
                    Wednesday: { morning: [emptySlotFuture], afternoon: [], evening: [] },
                },
            },
        ]);

        const index = buildScheduleIndex(schedule);
        // Verify hasValidEndTime flags on Tuesday's malformed sessions
        const tuesdayIndexed = index.filter((s) => s.dateStr === '17/03/2026');
        expect(tuesdayIndexed).toHaveLength(4);
        tuesdayIndexed.forEach((s) => {
            expect(s.hasValidEndTime).toBe(false);
        });

        // Check on Tuesday 17/03/2026 at 12:00 AND at 23:59:59.999 (end of day boundary)
        for (const now of [new Date(2026, 2, 17, 12, 0, 0), new Date(2026, 2, 17, 23, 59, 59, 999)]) {
            const legacy = calculateProgressLegacy(schedule, now, 'Nguyễn Văn A');
            const optimized = calculateProgressFromIndex(schedule, index, now, 'Nguyễn Văn A');

            expect(optimized).toEqual(legacy);
            // Monday (3 + 2 = 5 done), Tuesday (4+2+2+2 = 10 total, 0 done due to invalid end times), Wednesday (2 total, 0 done)
            expect(optimized.progress.semester).toEqual({
                percent: Math.round((5 / 17) * 100),
                done: 5,
                total: 17,
            });
            expect(optimized.progress.today).toEqual({ percent: 0, done: 0, total: 10 });

            // Even if hasValidEndTime is omitted (undefined) on hydrated FlatSession objects, resolveSessionPeriodRange prevents false completion
            const strippedIndex = index.map((s) => ({ ...s, hasValidEndTime: undefined }));
            const optimizedFromStripped = calculateProgressFromIndex(schedule, strippedIndex, now, 'Nguyễn Văn A');
            expect(optimizedFromStripped).toEqual(legacy);
        }
    });

    it('8. Day, Week, Month, Leap Year & Timezone Transitions: matches Legacy across boundaries', () => {
        // Week crossing month boundary in a leap year: 28/02/2028 (Monday) - 05/03/2028 (Sunday)
        const monFeb28 = createSession({ courseCode: 'FEB28', timeSlot: '1-3', periodCount: 3, dayOfWeek: 'Monday' });
        const tueFeb29 = createSession({ courseCode: 'FEB29', timeSlot: '1-3', periodCount: 3, dayOfWeek: 'Tuesday' });
        const wedMar01 = createSession({ courseCode: 'MAR01', timeSlot: '1-3', periodCount: 4, dayOfWeek: 'Wednesday' });

        const schedule = createMockSchedule([
            {
                weekNumber: 1,
                dateRange: '28/02/2028 - 05/03/2028',
                days: {
                    Monday: { morning: [monFeb28], afternoon: [], evening: [] },
                    Tuesday: { morning: [tueFeb29], afternoon: [], evening: [] },
                    Wednesday: { morning: [wedMar01], afternoon: [], evening: [] },
                },
            },
        ]);

        const timezones = ['Asia/Ho_Chi_Minh', 'UTC', 'America/New_York', 'Asia/Tokyo'];
        const checkpoints = [
            new Date(2028, 1, 28, 8, 0, 0),  // 28/02/2028 08:00 (mid-session on Monday)
            new Date(2028, 1, 29, 12, 0, 0), // 29/02/2028 12:00 (Leap day! Feb total = 6, done = 6)
            new Date(2028, 2, 1, 8, 0, 0),   // 01/03/2028 08:00 (New month! Mar total = 4, done = 0; Week total = 10, done = 6)
            new Date(2028, 2, 5, 23, 59, 0), // 05/03/2028 23:59 (End of week)
            new Date(2028, 2, 6, 0, 0, 0),   // 06/03/2028 00:00 (Next week Monday -> week total = 0)
        ];

        for (const tz of timezones) {
            const index = buildScheduleIndex(schedule, { timezone: tz });
            for (const now of checkpoints) {
                const legacy = calculateProgressLegacy(schedule, now, 'Nguyễn Văn A');
                const optimized = calculateProgressFromIndex(schedule, index, now, 'Nguyễn Văn A');
                expect(optimized).toEqual(legacy);
            }
        }
    });

    it('9. Full Semester Multi-Timestamp Sweep & Period Sum Invariant on real dataset (50 timestamps)', () => {
        const teacher = realData.metadata.teacher;
        const metrics = calculateMetrics(realData);

        // Sweep 50 timestamps from before semester start (01/09/2026) to after semester end (31/12/2026)
        const startMs = new Date(2026, 8, 1, 0, 0, 0).getTime();
        const endMs = new Date(2026, 11, 31, 23, 59, 59).getTime();
        const step = Math.floor((endMs - startMs) / 50);

        for (let i = 0; i <= 50; i++) {
            const ts = new Date(startMs + i * step);
            const legacy = calculateProgressLegacy(realData, ts, teacher);
            const optimized = calculateProgressFromIndex(realData, realIndex, ts, teacher);

            expect(optimized).toEqual(legacy);

            // Invariant: semester total periods === metrics.totalHours === sum of all groupProgress.total
            const sumGroupTotal = optimized.groupProgress.reduce((acc, g) => acc + g.total, 0);
            const sumGroupDone = optimized.groupProgress.reduce((acc, g) => acc + g.done, 0);
            expect(optimized.progress.semester.total).toBe(metrics.totalHours);
            expect(sumGroupTotal).toBe(metrics.totalHours);
            expect(sumGroupDone).toBe(optimized.progress.semester.done);
        }
    });

    it(
        '10. Microbenchmark: Warm-up + 30 independent batches × 200 iterations (Median & P95 report)',
        () => {
            const midSemesterDate = new Date(2026, 10, 5, 10, 30, 0);
            const teacher = realData.metadata.teacher;
            const warmupIterations = 300;
            const batches = 30;
            const iterationsPerBatch = 200;

            // 1. Warm-up phase
            for (let i = 0; i < warmupIterations; i++) {
                calculateProgressLegacy(realData, midSemesterDate, teacher);
                calculateProgressFromIndex(realData, realIndex, midSemesterDate, teacher);
            }

            const legacyBatchTimes: number[] = [];
            const optBatchTimes: number[] = [];

            // 2. Measured independent batches (interleaved to eliminate thermal/GC drift)
            for (let b = 0; b < batches; b++) {
                const t0 = performance.now();
                for (let i = 0; i < iterationsPerBatch; i++) {
                    calculateProgressLegacy(realData, midSemesterDate, teacher);
                }
                legacyBatchTimes.push(performance.now() - t0);

                const t1 = performance.now();
                for (let i = 0; i < iterationsPerBatch; i++) {
                    calculateProgressFromIndex(realData, realIndex, midSemesterDate, teacher);
                }
                optBatchTimes.push(performance.now() - t1);
            }

            const quantile = (arr: number[], q: number) => {
                const sorted = [...arr].sort((a, b) => a - b);
                const pos = (sorted.length - 1) * q;
                const base = Math.floor(pos);
                const rest = pos - base;
                return sorted[base + 1] !== undefined
                    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
                    : sorted[base];
            };

            const legMedianBatch = quantile(legacyBatchTimes, 0.5);
            const legP95Batch = quantile(legacyBatchTimes, 0.95);
            const optMedianBatch = quantile(optBatchTimes, 0.5);
            const optP95Batch = quantile(optBatchTimes, 0.95);

            const legMedianUs = (legMedianBatch * 1000) / iterationsPerBatch;
            const legP95Us = (legP95Batch * 1000) / iterationsPerBatch;
            const optMedianUs = (optMedianBatch * 1000) / iterationsPerBatch;
            const optP95Us = (optP95Batch * 1000) / iterationsPerBatch;
            const medianSpeedup = legMedianBatch / optMedianBatch;

            console.log(
                JSON.stringify({
                    benchmark: 'CPU Calculation (30 batches x 200 iterations, post-warmup)',
                    legacy: {
                        medianBatchMs: Number(legMedianBatch.toFixed(2)),
                        p95BatchMs: Number(legP95Batch.toFixed(2)),
                        medianCallUs: Number(legMedianUs.toFixed(2)),
                        p95CallUs: Number(legP95Us.toFixed(2)),
                    },
                    optimized: {
                        medianBatchMs: Number(optMedianBatch.toFixed(2)),
                        p95BatchMs: Number(optP95Batch.toFixed(2)),
                        medianCallUs: Number(optMedianUs.toFixed(2)),
                        p95CallUs: Number(optP95Us.toFixed(2)),
                    },
                    medianSpeedup: Number(medianSpeedup.toFixed(2)),
                })
            );

            expect(optMedianBatch).toBeLessThan(legMedianBatch);
        },
        15000
    );

    it('11. P1/P2 Verification: Zero dangling ARIA IDREFs across lazy tabs/accordion, accessible names, and Design Tokens integrity', () => {
        useScheduleStore.setState({
            data: realData,
            metrics: calculateMetrics(realData),
            sessionsIndex: realIndex,
            abbreviations: {},
            isInitialized: true,
        });

        const { container } = render(
            React.createElement(MemoryRouter, null, React.createElement(StatisticsView))
        );

        const assertNoDanglingAriaIdRefs = (root: HTMLElement) => {
            const idRefAttrs = ['aria-controls', 'aria-labelledby', 'aria-describedby'] as const;
            for (const attr of idRefAttrs) {
                const elements = Array.from(root.querySelectorAll(`[${attr}]`));
                for (const el of elements) {
                    const rawVal = el.getAttribute(attr)?.trim();
                    expect(rawVal).toBeTruthy();
                    const ids = rawVal!.split(/\s+/);
                    for (const refId of ids) {
                        const target = root.querySelector(`[id="${refId}"]`);
                        expect(target, `Dangling ${attr}="${refId}" on <${el.tagName.toLowerCase()}>`).not.toBeNull();
                    }
                }
            }
        };

        const assertAccessibleControls = (root: HTMLElement) => {
            const buttons = Array.from(root.querySelectorAll('button, [role="tab"]'));
            expect(buttons.length).toBeGreaterThan(0);
            for (const btn of buttons) {
                const text = (btn.textContent || '').trim();
                const ariaLabel = (btn.getAttribute('aria-label') || '').trim();
                const ariaLabelledBy = (btn.getAttribute('aria-labelledby') || '').trim();
                expect(
                    Boolean(text || ariaLabel || ariaLabelledBy),
                    `Button/Tab missing accessible name: ${btn.outerHTML}`
                ).toBe(true);
            }
        };

        // 1. Default state: Overview tab active, GroupProgressCard collapsed
        assertNoDanglingAriaIdRefs(container);
        assertAccessibleControls(container);
        expect(container.querySelector('#stats-panel-overview')).not.toBeNull();
        expect(container.querySelector('#stats-panel-trends')).toBeNull();
        expect(container.querySelector('#stats-panel-details')).toBeNull();
        expect(container.querySelector('#group-progress-panel')).toBeNull();

        // 2. Expand GroupProgressCard -> verify aria-controls="group-progress-panel" resolves
        const groupHeaderBtn = container.querySelector('#group-progress-header') as HTMLButtonElement;
        expect(groupHeaderBtn).not.toBeNull();
        fireEvent.click(groupHeaderBtn);
        expect(container.querySelector('#group-progress-panel')).not.toBeNull();
        assertNoDanglingAriaIdRefs(container);

        // 3. Switch to Trends tab -> verify HeatmapChart is in Trends and no dangling IDREFs exist
        const trendsTab = container.querySelector('#stats-tab-trends') as HTMLButtonElement;
        fireEvent.click(trendsTab);
        expect(container.querySelector('#stats-panel-overview')).toBeNull();
        expect(container.querySelector('#stats-panel-trends')).not.toBeNull();
        assertNoDanglingAriaIdRefs(container);
        assertAccessibleControls(container);

        // 4. Switch to Details tab -> verify no dangling IDREFs exist
        const detailsTab = container.querySelector('#stats-tab-details') as HTMLButtonElement;
        fireEvent.click(detailsTab);
        expect(container.querySelector('#stats-panel-trends')).toBeNull();
        expect(container.querySelector('#stats-panel-details')).not.toBeNull();
        assertNoDanglingAriaIdRefs(container);
        assertAccessibleControls(container);

        // 5. Collapse GroupProgressCard again -> verify aria-controls is removed when unmounted
        fireEvent.click(groupHeaderBtn);
        expect(container.querySelector('#group-progress-panel')).toBeNull();
        assertNoDanglingAriaIdRefs(container);

        // 5b. Toggle StatsHeader collapse -> verify both ProgressCard AND GroupProgressCard remain visible, tabs/panels hidden
        const statsHeaderToggle = container.querySelector('button[aria-expanded="true"][class*="absolute top-3 right-3"]') as HTMLButtonElement;
        expect(statsHeaderToggle).not.toBeNull();
        fireEvent.click(statsHeaderToggle);
        // Header button is now collapsed
        expect(statsHeaderToggle.getAttribute('aria-expanded')).toBe('false');
        // GroupProgressCard header MUST still be visible
        expect(container.querySelector('#group-progress-header')).not.toBeNull();
        // Tabs and tabpanels are hidden when collapsed
        expect(container.querySelector('[role="tablist"]')).toBeNull();
        expect(container.querySelector('[role="tabpanel"]')).toBeNull();
        // Re-expand StatsHeader
        fireEvent.click(statsHeaderToggle);
        expect(statsHeaderToggle.getAttribute('aria-expanded')).toBe('true');
        expect(container.querySelector('[role="tablist"]')).not.toBeNull();

        // 6. Verify TdyTripZ border-radius tokens in src/styles/tokens.css & src/styles/global.css
        for (const cssPath of [TOKENS_CSS_FILE, GLOBAL_CSS_FILE]) {
            const cssContent = readFileSync(cssPath, 'utf-8');
            expect(cssContent).toContain('--radius-sm: 6px;');
            expect(cssContent).toContain('--radius-md: 8px;');
            expect(cssContent).toContain('--radius-lg: 8px;');
            expect(cssContent).toContain('--radius-xl: 8px;');
            expect(cssContent).toContain('--radius-2xl: 10px;');
            expect(cssContent).toContain('--radius-3xl: 12px;');
        }
    });
});

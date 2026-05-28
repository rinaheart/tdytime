import { describe, test, expect } from 'vitest';
import { getUpcomingExamCount } from './exam.utils';
import { ExamSession } from './exam.types';

describe('getUpcomingExamCount Performance Benchmark', () => {
    test('baseline vs optimization', () => {
        // Create 100,000 sessions, roughly half in the future within 7 days, half in the past
        const sessions: ExamSession[] = [];
        const now = Date.now();
        const baseSession: ExamSession = {
            id: 'test',
            courseCode: 'TEST101',
            courseName: 'Test',
            room: '101',
            format: 'Trắc nghiệm',
            dateStr: '01/01/2024',
            timeStr: '07:00',
            duration: 90,
            role: 'Cán bộ 1',
            startTime: now,
            endTime: now + 90 * 60 * 1000,
        };

        for (let i = 0; i < 100000; i++) {
            // Distribute startTimes around `now`
            const offsetDays = (i - 50000) * (14 / 100000); // from -7 days to +7 days
            sessions.push({
                ...baseSession,
                startTime: now + offsetDays * 24 * 60 * 60 * 1000
            });
        }

        // We use a mocked 'now' to ensure both methods evaluate exactly the same boundary condition
        // since Date.now() in getUpcomingExamCount will differ slightly from the static 'now' above.

        // --- Current Method (Baseline) ---
        const startBaseline = performance.now();
        let resultBaseline = 0;
        // Run multiple iterations to get stable numbers
        for (let j = 0; j < 100; j++) {
             // Use the function's internal Date.now() equivalent logic but we can't easily mock Date.now without side effects here,
             // so we accept the slight time difference could drop a single boundary item, but they should be functionally identical.
             const baselineNow = Date.now();
             const threshold = baselineNow + 7 * 24 * 60 * 60 * 1000;
             resultBaseline = sessions.filter(s => s.startTime >= baselineNow && s.startTime <= threshold).length;
        }
        const endBaseline = performance.now();
        const timeBaseline = endBaseline - startBaseline;

        // --- Optimized Method (For loop) ---
        const startOptimized = performance.now();
        let resultOptimized = 0;
        for (let j = 0; j < 100; j++) {
            resultOptimized = getUpcomingExamCount(sessions, 7);
        }
        const endOptimized = performance.now();
        const timeOptimized = endOptimized - startOptimized;

        console.log(`[getUpcomingExamCount Benchmark] 100,000 items, 100 iterations`);
        console.log(`Baseline (filter.length): ${timeBaseline.toFixed(2)}ms`);
        console.log(`Optimized (for loop): ${timeOptimized.toFixed(2)}ms`);
        console.log(`Improvement: ${((timeBaseline - timeOptimized) / timeBaseline * 100).toFixed(2)}% faster`);

        // Due to millisecond difference between evaluating Date.now(), results might differ by 1, which is expected
        expect(Math.abs(resultBaseline - resultOptimized)).toBeLessThanOrEqual(1);
        expect(timeOptimized).toBeLessThan(timeBaseline); // Verify optimization is actually faster
    });
});

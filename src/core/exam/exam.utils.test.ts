import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { getExamProximity } from './exam.utils';
import { ExamSession } from './exam.types';

describe('getExamProximity', () => {
    // We will freeze time at: 2024-05-15T12:00:00.000Z
    const mockNow = new Date('2024-05-15T12:00:00.000Z');
    const mockNowTimestamp = mockNow.getTime();

    // Helper to create a basic exam session
    const createSession = (startTime: number, durationMinutes: number = 90): ExamSession => ({
        id: `TEST_${startTime}`,
        courseCode: 'TEST',
        courseName: 'Test Course',
        room: '101',
        format: 'Trắc nghiệm',
        dateStr: new Date(startTime).toLocaleDateString('vi-VN'),
        timeStr: new Date(startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        duration: durationMinutes,
        role: 'Cán bộ coi thi',
        startTime,
        endTime: startTime + durationMinutes * 60 * 1000,
    });

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(mockNow);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('should return "none" for empty, null, or undefined sessions', () => {
        expect(getExamProximity([])).toBe('none');
        expect(getExamProximity(null as unknown as ExamSession[])).toBe('none');
        expect(getExamProximity(undefined as unknown as ExamSession[])).toBe('none');
    });

    test('should return "distant" when all exams are more than 7 days away', () => {
        const eightDaysLater = mockNowTimestamp + 8 * 24 * 60 * 60 * 1000;
        const tenDaysLater = mockNowTimestamp + 10 * 24 * 60 * 60 * 1000;

        const sessions = [
            createSession(eightDaysLater),
            createSession(tenDaysLater),
        ];

        expect(getExamProximity(sessions)).toBe('distant');
    });

    test('should return "upcoming" when at least one exam is within 7 days, but not today', () => {
        // Exam tomorrow at 12:00
        const tomorrow = mockNowTimestamp + 24 * 60 * 60 * 1000;
        const eightDaysLater = mockNowTimestamp + 8 * 24 * 60 * 60 * 1000;

        const sessions = [
            createSession(tomorrow),
            createSession(eightDaysLater), // mixed with distant
        ];

        expect(getExamProximity(sessions)).toBe('upcoming');
    });

    test('should return "today" when an exam is happening later today', () => {
        // Exam today at 15:00 (3 hours from mockNow)
        const laterToday = mockNowTimestamp + 3 * 60 * 60 * 1000;
        const tomorrow = mockNowTimestamp + 24 * 60 * 60 * 1000;

        const sessions = [
            createSession(laterToday),
            createSession(tomorrow), // mixed with upcoming
        ];

        expect(getExamProximity(sessions)).toBe('today');
    });

    test('should return "today" when an exam is happening earlier today (started and ended today)', () => {
        // Exam today at 08:00 (4 hours before mockNow)
        const earlierToday = mockNowTimestamp - 4 * 60 * 60 * 1000;
        const eightDaysLater = mockNowTimestamp + 8 * 24 * 60 * 60 * 1000;

        const sessions = [
            createSession(earlierToday),
            createSession(eightDaysLater), // mixed with distant
        ];

        expect(getExamProximity(sessions)).toBe('today');
    });

    test('should return "today" when an exam is currently ongoing', () => {
        // Exam started 30 mins ago, lasts 90 mins, so it's ongoing now
        const thirtyMinsAgo = mockNowTimestamp - 30 * 60 * 1000;

        const sessions = [
            createSession(thirtyMinsAgo),
        ];

        expect(getExamProximity(sessions)).toBe('today');
    });

    test('should prioritize "today" over "upcoming" and "distant"', () => {
        const laterToday = mockNowTimestamp + 2 * 60 * 60 * 1000;
        const tomorrow = mockNowTimestamp + 24 * 60 * 60 * 1000;
        const eightDaysLater = mockNowTimestamp + 8 * 24 * 60 * 60 * 1000;

        const sessions = [
            createSession(eightDaysLater),
            createSession(tomorrow),
            createSession(laterToday),
        ];

        // Should return today even though there are upcoming and distant exams
        expect(getExamProximity(sessions)).toBe('today');
    });

    test('should return "distant" for past exams (more than 1 day ago) if no future/today exams', () => {
        // Exam was 2 days ago
        const twoDaysAgo = mockNowTimestamp - 2 * 24 * 60 * 60 * 1000;

        const sessions = [
            createSession(twoDaysAgo),
        ];

        expect(getExamProximity(sessions)).toBe('distant');
    });
});

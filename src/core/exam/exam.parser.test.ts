import { describe, it, expect } from 'vitest';
import { getExamStatus } from './exam.parser';

describe('getExamStatus', () => {
    it('should return "upcoming" when now is before startTime', () => {
        const startTime = 1000;
        const endTime = 2000;
        const now = 500;
        expect(getExamStatus(startTime, endTime, now)).toBe('upcoming');
    });

    it('should return "past" when now is after endTime', () => {
        const startTime = 1000;
        const endTime = 2000;
        const now = 2500;
        expect(getExamStatus(startTime, endTime, now)).toBe('past');
    });

    it('should return "ongoing" when now is between startTime and endTime', () => {
        const startTime = 1000;
        const endTime = 2000;
        const now = 1500;
        expect(getExamStatus(startTime, endTime, now)).toBe('ongoing');
    });

    it('should return "ongoing" as an edge case when now is exactly startTime', () => {
        const startTime = 1000;
        const endTime = 2000;
        const now = 1000;
        expect(getExamStatus(startTime, endTime, now)).toBe('ongoing');
    });

    it('should return "ongoing" as an edge case when now is exactly endTime', () => {
        const startTime = 1000;
        const endTime = 2000;
        const now = 2000;
        expect(getExamStatus(startTime, endTime, now)).toBe('ongoing');
    });

    it('should use Date.now() as default for now parameter', () => {
        const now = Date.now();
        const startTime = now - 1000; // 1 second ago
        const endTime = now + 1000;   // 1 second in the future

        // As Date.now() might advance slightly between assignment and the function call,
        // we can just check if it returns 'ongoing' given the wide window.
        expect(getExamStatus(startTime, endTime)).toBe('ongoing');
    });
});

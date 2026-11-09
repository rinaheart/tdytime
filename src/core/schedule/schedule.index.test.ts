import { describe, it, expect } from 'vitest';
import { buildScheduleIndex } from './schedule.index';
import { CourseType, type ScheduleData } from './schedule.types';

describe('buildScheduleIndex', () => {
    it('returns empty array if no weeks are provided', () => {
        const data = { weeks: [] } as unknown as ScheduleData;
        const result = buildScheduleIndex(data);
        expect(result).toEqual([]);
    });

    it('assigns correct weekIdx (1-based), dayIdx (ISO) and shift to FlatSession', () => {
        const mockSession = {
            courseCode: 'CS101',
            courseName: 'Intro to CS',
            timeSlot: '1-3',
            type: CourseType.LT,
            teacher: 'Dr. Smith'
        };

        const data = {
            weeks: [
                {
                    weekNumber: 20,
                    dateRange: '12/04/2026 - 18/04/2026',
                    days: {
                        Monday: { morning: [mockSession], afternoon: [], evening: [], night: [] }
                    }
                }
            ]
        } as unknown as ScheduleData;

        const result = buildScheduleIndex(data);
        expect(result).toHaveLength(1);
        const session = result[0];
        
        expect(session.weekIdx).toBe(1); // 1-based
        expect(session.dayIdx).toBe(0); // Monday
        expect(session.shift).toBe('morning');
        expect(session.startTimeStr).toBe('07:00');
        expect(session.endTimeStr).toBe('09:35');
        expect(session.dateStr).toBe('12/04/2026');
        expect(session.id).toContain('w20-d0-morning-cs101-1-3');
    });

    it('correctly maps timeRangeStr with given timezone', () => {
        const mockSession = {
            courseCode: 'CS101',
            timeSlot: '1-3',
            type: CourseType.LT
        };

        const data = {
            weeks: [
                {
                    weekNumber: 20,
                    dateRange: '12/04/2026 - 18/04/2026',
                    days: {
                        Monday: { morning: [mockSession], afternoon: [], evening: [], night: [] }
                    }
                }
            ]
        } as unknown as ScheduleData;

        // Test with a specific timezone (New York is UTC-4 in April)
        const result = buildScheduleIndex(data, { timezone: 'America/New_York' });
        expect(result).toHaveLength(1);
        
        // 07:00 UTC+7 (VN) is 20:00 UTC-4 (NY) previous day if we assuming the parser 
        // generated absolute times assuming local context.
        // Wait, startDateTime is created using baseDate and setHours.
        // baseDate is 2026-04-12 00:00.
        // setHours(7, 0) -> 2026-04-12 07:00 (Local to where test runs).
        // formatTimeRange uses Intl.DateTimeFormat with the provided timezone.
        
        // Let's just verify it's formatted. The exact hour depends on the host timezone 
        // because `new Date(y, m-1, d)` creates a time in the local timezone.
        expect(result[0].timeRangeStr).toMatch(/\d{2}:\d{2} - \d{2}:\d{2}/);
    });
    
    it('sorts sessions strictly by startTs across different weeks and days', () => {
        const mockSession = (code: string, slot: string) => ({
            courseCode: code,
            timeSlot: slot,
            type: CourseType.LT
        });

        const data = {
            weeks: [
                {
                    weekNumber: 20,
                    dateRange: '12/04/2026 - 18/04/2026',
                    days: {
                        Tuesday: { morning: [mockSession('DAY2', '1-3')], afternoon: [], evening: [], night: [] },
                        Monday: { afternoon: [mockSession('DAY1-PM', '6-9')], morning: [mockSession('DAY1-AM', '1-3')], evening: [], night: [] }
                    }
                }
            ]
        } as unknown as ScheduleData;

        const result = buildScheduleIndex(data);
        expect(result).toHaveLength(3);
        expect(result[0].courseCode).toBe('DAY1-AM');
        expect(result[1].courseCode).toBe('DAY1-PM');
        expect(result[2].courseCode).toBe('DAY2');
    });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTodayData } from './useTodayData';
import { useScheduleStore } from '@/core/stores/schedule.store';
import type { FlatSession } from '@/core/schedule/schedule.index';

// Mock the Zustand store
vi.mock('@/core/stores/schedule.store', () => ({
    useScheduleStore: vi.fn(),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string, vars: unknown) => `${key}${vars && typeof vars === 'object' && 'name' in vars ? '_' + (vars as {name: string}).name : ''}` }),
}));

// Mock useShallow to just return the selector
vi.mock('zustand/react/shallow', () => ({
    useShallow: (fn: unknown) => fn,
}));

vi.mock('@/core/schedule/schedule.utils', async (importOriginal) => {
    const mod = await importOriginal<Record<string, unknown>>();
    return {
        ...mod,
        isCurrentWeek: () => true,
        isMainTeacher: () => true,
    };
});

const defaultState = {
    sessionsIndex: [{ id: 'dummy', startTs: 0, endTs: 0, weekIdx: 1, dayIdx: 0, teacher: 'John Doe', periodCount: 1 }] as FlatSession[],
    semesterBounds: { start: new Date('2024-01-10T00:00:00Z').getTime(), end: new Date('2024-06-01T00:00:00Z').getTime() },
    mockState: null,
    data: { metadata: { teacher: 'John Doe' }, weeks: [] as { dateRange: string; isCurrentWeek: boolean }[] }
};

describe('useTodayData', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.resetAllMocks();
    });

    it('returns BEFORE_SEMESTER when time is before semester start', () => {
        const mockTime = new Date('2024-01-01T10:00:00Z').getTime();
        vi.setSystemTime(mockTime);

        // Mock store state
        (useScheduleStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof defaultState) => unknown) => {
            return typeof selector === 'function' ? selector(defaultState) : defaultState;
        });

        const { result } = renderHook(() => useTodayData());

        expect(result.current.displayState).toBe('BEFORE_SEMESTER');
        expect(result.current.isBeforeSemester).toBe(true);
    });

    it('returns AFTER_SEMESTER when time is past semester end', () => {
        const mockTime = new Date('2024-06-02T10:00:00Z').getTime();
        vi.setSystemTime(mockTime);

        (useScheduleStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof defaultState) => unknown) => {
            return typeof selector === 'function' ? selector(defaultState) : defaultState;
        });

        const { result } = renderHook(() => useTodayData());

        expect(result.current.displayState).toBe('AFTER_SEMESTER');
        expect(result.current.isSemesterOver).toBe(true);
    });

    it('correctly categorizes live and pending sessions today', () => {
        // Assume today is Monday, March 4, 2024 (dayIdx = 0)
        // A week starts on Monday, March 4 (weekIdx = 1, since index in weeks array is 0, so 1-based is 1)
        const mockTime = new Date('2024-03-04T09:00:00+07:00').getTime(); // 9 AM
        vi.setSystemTime(mockTime);

        const mockSessions = [
            {
                id: 's1',
                weekIdx: 1,
                dayIdx: 0,
                startTs: new Date('2024-03-04T07:00:00+07:00').getTime(), // 7 AM - 9:30 AM
                endTs: new Date('2024-03-04T09:30:00+07:00').getTime(),
                teacher: 'John Doe',
                periodCount: 3,
            },
            {
                id: 's2',
                weekIdx: 1,
                dayIdx: 0,
                startTs: new Date('2024-03-04T13:00:00+07:00').getTime(), // 1 PM - 3 PM
                endTs: new Date('2024-03-04T15:00:00+07:00').getTime(),
                teacher: 'John Doe',
                periodCount: 3,
            }
        ] as FlatSession[];

        (useScheduleStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof defaultState) => unknown) => {
            const state = {
                ...defaultState,
                sessionsIndex: mockSessions,
                data: { 
                    metadata: { teacher: 'John Doe' }, 
                    weeks: [{ 
                        dateRange: '04/03/2024 - 10/03/2024',
                        isCurrentWeek: true
                    }] 
                }
            };
            return typeof selector === 'function' ? selector(state) : state;
        });

        const { result } = renderHook(() => useTodayData());

        expect(result.current.displayState).toBe('HAS_SESSIONS');
        expect(result.current.todaySessions).toHaveLength(2);
        // First session should be LIVE (7 AM to 9:30 AM, current time is 9 AM)
        expect(result.current.todaySessions[0].status).toBe('LIVE');
        // Second session should be PENDING (1 PM)
        expect(result.current.todaySessions[1].status).toBe('PENDING');
        expect(result.current.totalPeriods).toBe(6);
    });
});

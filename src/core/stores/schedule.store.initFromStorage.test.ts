import { describe, it, expect, beforeEach } from 'vitest';
import { useScheduleStore } from './schedule.store';

/**
 * Regression tests for B1 — unsafe JSON.parse on 'global_abbreviations'.
 * Before the fix, a malformed value for this key threw synchronously inside
 * initFromStorage() (called from a useEffect with no ErrorBoundary in the
 * tree), crashing the app on startup ("white screen of death").
 */
describe('schedule.store — initFromStorage — global_abbreviations safety', () => {
    beforeEach(() => {
        localStorage.clear();
        // Reset relevant store slice between tests.
        useScheduleStore.setState({
            abbreviations: {},
            isInitialized: false,
            historyList: [],
        });
    });

    it('initializes with empty abbreviations when key is absent', () => {
        expect(() => useScheduleStore.getState().initFromStorage()).not.toThrow();

        const state = useScheduleStore.getState();
        expect(state.isInitialized).toBe(true);
        expect(state.abbreviations).toEqual({});
    });

    it('initializes with parsed abbreviations when JSON is valid', () => {
        localStorage.setItem('global_abbreviations', JSON.stringify({ 'Giải phẫu học': 'GPH' }));

        expect(() => useScheduleStore.getState().initFromStorage()).not.toThrow();

        const state = useScheduleStore.getState();
        expect(state.isInitialized).toBe(true);
        expect(state.abbreviations).toEqual({ 'Giải phẫu học': 'GPH' });
    });

    it('does not crash and falls back to {} when JSON is malformed', () => {
        localStorage.setItem('global_abbreviations', '{not valid json');

        expect(() => useScheduleStore.getState().initFromStorage()).not.toThrow();

        const state = useScheduleStore.getState();
        expect(state.isInitialized).toBe(true);
        expect(state.abbreviations).toEqual({});
    });

    it('still initializes correctly even if last_schedule_data is also malformed', () => {
        localStorage.setItem('global_abbreviations', '{not valid json');
        localStorage.setItem('last_schedule_data', '{also not valid');

        expect(() => useScheduleStore.getState().initFromStorage()).not.toThrow();

        const state = useScheduleStore.getState();
        expect(state.isInitialized).toBe(true);
        expect(state.abbreviations).toEqual({});
        expect(state.data).toBeNull();
    });
});

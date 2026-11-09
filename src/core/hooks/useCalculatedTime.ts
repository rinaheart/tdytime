import { useState, useEffect, useCallback } from 'react';
import { useScheduleStore } from '../stores/schedule.store';

/**
 * useCalculatedTime — Hook to get current time (mock-aware)
 * Synchronized with global mockState from schedule store.
 * Automatically pauses the polling interval when the tab is hidden in the background.
 */
export const useCalculatedTime = (tickInterval = 30000): Date => {
    const mockState = useScheduleStore((s) => s.mockState);
    const isMockEnabled = useScheduleStore((s) => s.isMockEnabled);

    const getCalculatedTime = useCallback(() => {
        if (isMockEnabled && mockState) {
            const elapsedReal = Date.now() - mockState.startTimeLocal;
            return new Date(mockState.startTimeMock + elapsedReal * mockState.multiplier);
        }
        return new Date();
    }, [isMockEnabled, mockState]);

    const [now, setNow] = useState<Date>(() => getCalculatedTime());

    useEffect(() => {
        const effectiveInterval =
            mockState && mockState.multiplier > 1
                ? Math.max(1000, tickInterval / mockState.multiplier)
                : tickInterval;

        let interval: ReturnType<typeof setInterval> | null = null;

        const startTimer = () => {
            if (interval !== null) clearInterval(interval);
            interval = setInterval(() => {
                setNow(getCalculatedTime());
            }, effectiveInterval);
        };

        const stopTimer = () => {
            if (interval !== null) {
                clearInterval(interval);
                interval = null;
            }
        };

        if (typeof document === 'undefined' || document.visibilityState === 'visible') {
            startTimer();
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                setNow(getCalculatedTime());
                startTimer();
            } else {
                stopTimer();
            }
        };

        const handleFocus = () => {
            if (typeof document === 'undefined' || document.visibilityState === 'visible') {
                setNow(getCalculatedTime());
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            stopTimer();
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [getCalculatedTime, mockState, tickInterval]);

    return now;
};
export default useCalculatedTime;

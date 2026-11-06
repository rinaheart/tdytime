import { useState, useEffect, useCallback } from 'react';
import { useScheduleStore } from '@/core/stores/schedule.store';

/**
 * useCalculatedTime — Hook to get current time (mock-aware)
 * Synchronized with global mockState from schedule store.
 */
export const useCalculatedTime = (tickInterval = 30000) => {
    const mockState = useScheduleStore(s => s.mockState);
    const isMockEnabled = useScheduleStore(s => s.isMockEnabled);

    const getCalculatedTime = useCallback(() => {
        if (isMockEnabled && mockState) {
            const elapsedReal = Date.now() - mockState.startTimeLocal;
            return new Date(mockState.startTimeMock + elapsedReal * mockState.multiplier);
        }
        return new Date();
    }, [isMockEnabled, mockState]);

    const [now, setNow] = useState(getCalculatedTime());

    useEffect(() => {
        // Adjust interval based on multiplier if mocking
        const effectiveInterval = mockState && mockState.multiplier > 1 
            ? Math.max(1000, tickInterval / mockState.multiplier)
            : tickInterval;

        const interval = setInterval(() => {
            setNow(getCalculatedTime());
        }, effectiveInterval);

        return () => clearInterval(interval);
    }, [getCalculatedTime, mockState, tickInterval]);

    // Handle focus/visibility to sync immediately
    useEffect(() => {
        const handleSync = () => {
            if (document.visibilityState === 'visible') {
                setNow(getCalculatedTime());
            }
        };
        window.addEventListener('focus', handleSync);
        document.addEventListener('visibilitychange', handleSync);
        return () => {
            window.removeEventListener('focus', handleSync);
            document.removeEventListener('visibilitychange', handleSync);
        };
    }, [getCalculatedTime]);

    return now;
};

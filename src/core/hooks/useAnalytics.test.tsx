import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnalytics } from './useAnalytics';
import { useAnalyticsStore } from '@/core/stores/analytics.store';

describe('useAnalytics & useAnalyticsStore (Offline-First Telemetry)', () => {
    beforeEach(() => {
        localStorage.clear();
        useAnalyticsStore.getState().clearAnalytics();
        useAnalyticsStore.getState().setEndpoint(null);
        vi.restoreAllMocks();
    });

    it('1. Tracks user interaction and navigation events into the central atomic store', () => {
        const { result } = renderHook(() => useAnalytics());

        act(() => {
            result.current.trackNavigation('/today');
            result.current.trackNavigation('/week');
            result.current.trackNavigation('/today');
            result.current.trackInteraction('switch_language', { to: 'en' });
        });

        const state = useAnalyticsStore.getState();
        expect(state.routeViews['/today']).toBe(2);
        expect(state.routeViews['/week']).toBe(1);
        expect(state.interactionCount).toBe(1);
        expect(state.events.length).toBe(4);
        expect(state.events[3].name).toBe('switch_language');
        expect(state.events[3].metadata).toEqual({ to: 'en' });
    });

    it('2. Records Web Vitals performance metrics (FCP, LCP, CLS, TBT) with accurate rounding', () => {
        const { result } = renderHook(() => useAnalytics());

        act(() => {
            result.current.trackPerformance('FCP', 892.4);
            result.current.trackPerformance('LCP', 915.8);
            result.current.trackPerformance('TBT', 48.2);
            result.current.trackPerformance('CLS', 0.00189);
        });

        const perf = useAnalyticsStore.getState().performance;
        expect(perf.fcp).toBe(892);
        expect(perf.lcp).toBe(916);
        expect(perf.tbt).toBe(48);
        expect(perf.cls).toBe(0.0019);
    });

    it('3. Flushes queued events to a configured endpoint via navigator.sendBeacon when online', async () => {
        const sendBeaconMock = vi.fn().mockReturnValue(true);
        Object.defineProperty(navigator, 'sendBeacon', {
            value: sendBeaconMock,
            configurable: true,
            writable: true,
        });

        const { result } = renderHook(() =>
            useAnalytics({ endpoint: 'https://telemetry.example.com/collect' })
        );

        await act(async () => {
            result.current.trackInteraction('sync_schedule');
        });

        expect(sendBeaconMock).toHaveBeenCalledTimes(1);
        expect(sendBeaconMock.mock.calls[0][0]).toBe('https://telemetry.example.com/collect');
        expect(useAnalyticsStore.getState().pendingQueue.length).toBe(0);
    });

    it('4. Enforces Rule 1 (Atomic Selectors) via createAtomicStore wrapper', () => {
        const bareCall = useAnalyticsStore as unknown as () => unknown;
        expect(() => bareCall()).toThrow(/\[Architecture Guardrail\] Bare useStore\(\) calls are forbidden/);
    });
});


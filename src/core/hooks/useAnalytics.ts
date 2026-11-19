/**
 * useAnalytics — Lightweight Offline-First Performance & Interaction Hook
 *
 * - Observes Web Vitals (FCP, LCP, CLS) and Long Tasks (TBT) via non-blocking PerformanceObserver.
 * - Tracks user interactions and route navigation into `useAnalyticsStore`.
 * - Queues events while offline and flushes automatically via `navigator.sendBeacon` when online.
 */

import { useCallback, useEffect } from 'react';
import { useAnalyticsStore } from '@/core/stores/analytics.store';

export interface UseAnalyticsOptions {
    /** Automatically observe Web Vitals (FCP, LCP, CLS, TBT) via PerformanceObserver */
    autoTrackPerformance?: boolean;
    /** Automatically flush queued events when the browser transitions to online */
    autoFlushOnReconnect?: boolean;
    /** Optional remote endpoint override for beacon flushing */
    endpoint?: string | null;
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
    const {
        autoTrackPerformance = false,
        autoFlushOnReconnect = true,
        endpoint,
    } = options;

    const recordEvent = useAnalyticsStore((s) => s.recordEvent);
    const recordPerformanceMetric = useAnalyticsStore((s) => s.recordPerformanceMetric);
    const flushQueue = useAnalyticsStore((s) => s.flushQueue);
    const setEndpoint = useAnalyticsStore((s) => s.setEndpoint);

    useEffect(() => {
        if (endpoint !== undefined) {
            setEndpoint(endpoint);
        }
    }, [endpoint, setEndpoint]);

    // Auto-flush queued events when network connectivity returns
    useEffect(() => {
        if (!autoFlushOnReconnect || typeof window === 'undefined') return;
        const handleOnline = () => {
            void flushQueue();
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [autoFlushOnReconnect, flushQueue]);

    // Observe Web Vitals (FCP, LCP, CLS) & Long Tasks (TBT) passively
    useEffect(() => {
        if (!autoTrackPerformance || typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
            return;
        }

        const observers: PerformanceObserver[] = [];
        const supportedTypes = PerformanceObserver.supportedEntryTypes || [];

        // 1. First Contentful Paint (FCP)
        if (supportedTypes.includes('paint')) {
            try {
                const paintObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.name === 'first-contentful-paint') {
                            recordPerformanceMetric('FCP', entry.startTime);
                            paintObserver.disconnect();
                        }
                    }
                });
                paintObserver.observe({ type: 'paint', buffered: true });
                observers.push(paintObserver);
            } catch {
                // Ignore unsupported observer options
            }
        }

        // 2. Largest Contentful Paint (LCP)
        if (supportedTypes.includes('largest-contentful-paint')) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    if (lastEntry) {
                        recordPerformanceMetric('LCP', lastEntry.startTime);
                    }
                });
                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
                observers.push(lcpObserver);
            } catch {
                // Ignore unsupported observer options
            }
        }

        // 3. Cumulative Layout Shift (CLS)
        if (supportedTypes.includes('layout-shift')) {
            try {
                let clsTotal = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
                        if (!entry.hadRecentInput && typeof entry.value === 'number') {
                            clsTotal += entry.value;
                            recordPerformanceMetric('CLS', clsTotal);
                        }
                    }
                });
                clsObserver.observe({ type: 'layout-shift', buffered: true });
                observers.push(clsObserver);
            } catch {
                // Ignore unsupported observer options
            }
        }

        // 4. Total Blocking Time (TBT) from Long Tasks (> 50ms)
        if (supportedTypes.includes('longtask')) {
            try {
                let tbtTotal = 0;
                const longTaskObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        const blockingTime = entry.duration - 50;
                        if (blockingTime > 0) {
                            tbtTotal += blockingTime;
                            recordPerformanceMetric('TBT', tbtTotal);
                        }
                    }
                });
                longTaskObserver.observe({ type: 'longtask', buffered: true });
                observers.push(longTaskObserver);
            } catch {
                // Ignore unsupported observer options
            }
        }

        return () => {
            observers.forEach((obs) => obs.disconnect());
        };
    }, [autoTrackPerformance, recordPerformanceMetric]);

    const trackInteraction = useCallback(
        (name: string, metadata?: Record<string, unknown>) => {
            return recordEvent('interaction', name, { metadata });
        },
        [recordEvent]
    );

    const trackNavigation = useCallback(
        (path: string, metadata?: Record<string, unknown>) => {
            return recordEvent('navigation', path, { metadata });
        },
        [recordEvent]
    );

    const trackPerformance = useCallback(
        (name: 'FCP' | 'LCP' | 'CLS' | 'TBT' | string, value: number, metadata?: Record<string, unknown>) => {
            recordPerformanceMetric(name, value, metadata);
        },
        [recordPerformanceMetric]
    );

    return {
        trackInteraction,
        trackNavigation,
        trackPerformance,
        flushQueue,
    };
}

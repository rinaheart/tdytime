/**
 * Analytics Store — TdyTime v2
 * Offline-First central telemetry store for Web Vitals performance metrics
 * and user interaction events with non-blocking sendBeacon endpoint flushing.
 */

import { create } from 'zustand';
import { createAtomicStore } from './createAtomicStore';
import { ANALYTICS_CONFIG, STORAGE_KEYS } from '../config/constants';

export type AnalyticsEventType = 'performance' | 'interaction' | 'navigation';

export interface AnalyticsEvent {
    id: string;
    type: AnalyticsEventType;
    name: string;
    value?: number;
    metadata?: Record<string, unknown>;
    timestamp: number;
    offline: boolean;
}

export interface PerformanceSnapshot {
    fcp?: number;
    lcp?: number;
    cls?: number;
    tbt?: number;
}

export interface AnalyticsState {
    events: AnalyticsEvent[];
    pendingQueue: AnalyticsEvent[];
    performance: PerformanceSnapshot;
    routeViews: Record<string, number>;
    interactionCount: number;
    endpoint: string | null;

    setEndpoint: (endpoint: string | null) => void;
    recordEvent: (
        type: AnalyticsEventType,
        name: string,
        payload?: { value?: number; metadata?: Record<string, unknown> }
    ) => AnalyticsEvent;
    recordPerformanceMetric: (
        name: 'FCP' | 'LCP' | 'CLS' | 'TBT' | string,
        value: number,
        metadata?: Record<string, unknown>
    ) => void;
    flushQueue: () => Promise<boolean>;
    clearAnalytics: () => void;
}

const STORAGE_KEY = STORAGE_KEYS.analytics;
const MAX_EVENTS = ANALYTICS_CONFIG.maxEvents;

function isDeviceOffline(): boolean {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
        return !navigator.onLine;
    }
    return false;
}

function getDefaultEndpoint(): string | null {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return env?.VITE_ANALYTICS_ENDPOINT || null;
}

function persistSnapshotToStorage(state: Pick<AnalyticsState, 'performance' | 'routeViews' | 'interactionCount' | 'pendingQueue'>): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                performance: state.performance,
                routeViews: state.routeViews,
                interactionCount: state.interactionCount,
                pendingQueue: state.pendingQueue.slice(-MAX_EVENTS),
            })
        );
    } catch {
        // Ignore quota or private-browsing storage errors
    }
}

async function sendPayloadToEndpoint(endpoint: string, events: AnalyticsEvent[]): Promise<boolean> {
    if (!endpoint || events.length === 0) return false;
    const body = JSON.stringify({
        app: ANALYTICS_CONFIG.appId,
        sentAt: Date.now(),
        events,
    });

    try {
        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
            const blob = new Blob([body], { type: 'application/json' });
            const queued = navigator.sendBeacon(endpoint, blob);
            if (queued) return true;
        }
        if (typeof fetch === 'function') {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
                keepalive: true,
            });
            return res.ok;
        }
    } catch {
        // Network unreachable; events remain queued for next online flush
    }
    return false;
}

const useRawAnalyticsStore = create<AnalyticsState>((set, get) => ({
    events: [],
    pendingQueue: [],
    performance: {},
    routeViews: {},
    interactionCount: 0,
    endpoint: null,

    setEndpoint: (endpoint) => {
        set({ endpoint });
    },

    recordEvent: (type, name, payload) => {
        const offline = isDeviceOffline();
        const event: AnalyticsEvent = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            type,
            name,
            value: payload?.value,
            metadata: payload?.metadata,
            timestamp: Date.now(),
            offline,
        };

        set((state) => {
            const nextEvents = [...state.events, event].slice(-MAX_EVENTS);
            const nextQueue = [...state.pendingQueue, event].slice(-MAX_EVENTS);
            const nextRouteViews =
                type === 'navigation'
                    ? { ...state.routeViews, [name]: (state.routeViews[name] || 0) + 1 }
                    : state.routeViews;
            const nextInteractionCount =
                type === 'interaction' ? state.interactionCount + 1 : state.interactionCount;

            const nextSlice = {
                events: nextEvents,
                pendingQueue: nextQueue,
                routeViews: nextRouteViews,
                interactionCount: nextInteractionCount,
            };

            persistSnapshotToStorage({
                performance: state.performance,
                routeViews: nextRouteViews,
                interactionCount: nextInteractionCount,
                pendingQueue: nextQueue,
            });

            return nextSlice;
        });

        const activeEndpoint = get().endpoint ?? getDefaultEndpoint();
        if (activeEndpoint && !offline) {
            void get().flushQueue();
        }

        return event;
    },

    recordPerformanceMetric: (name, value, metadata) => {
        const normalized = name.toUpperCase();
        const roundedValue = normalized === 'CLS' ? Number(value.toFixed(4)) : Math.round(value);

        set((state) => {
            const nextPerf: PerformanceSnapshot = { ...state.performance };
            if (normalized === 'FCP') nextPerf.fcp = roundedValue;
            else if (normalized === 'LCP') nextPerf.lcp = roundedValue;
            else if (normalized === 'CLS') nextPerf.cls = roundedValue;
            else if (normalized === 'TBT') nextPerf.tbt = roundedValue;

            return { performance: nextPerf };
        });

        get().recordEvent('performance', normalized, {
            value: roundedValue,
            metadata,
        });
    },

    flushQueue: async () => {
        if (isDeviceOffline()) return false;
        const { pendingQueue, endpoint, performance, routeViews, interactionCount } = get();
        const targetEndpoint = endpoint ?? getDefaultEndpoint();
        if (!targetEndpoint || pendingQueue.length === 0) return false;

        const batch = [...pendingQueue];
        const ok = await sendPayloadToEndpoint(targetEndpoint, batch);
        if (ok) {
            set((state) => {
                const sentIds = new Set(batch.map((e) => e.id));
                const remaining = state.pendingQueue.filter((e) => !sentIds.has(e.id));
                persistSnapshotToStorage({
                    performance,
                    routeViews,
                    interactionCount,
                    pendingQueue: remaining,
                });
                return { pendingQueue: remaining };
            });
        }
        return ok;
    },

    clearAnalytics: () => {
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                window.localStorage.removeItem(STORAGE_KEY);
            } catch {
                // Ignore storage errors
            }
        }
        set({
            events: [],
            pendingQueue: [],
            performance: {},
            routeViews: {},
            interactionCount: 0,
        });
    },
}));

export const useAnalyticsStore = createAtomicStore(useRawAnalyticsStore);


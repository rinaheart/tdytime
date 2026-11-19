import React from 'react';
import { useAnalytics } from '@/core/hooks/useAnalytics';

/**
 * Monitoring Wrapper — Lazy-loaded post-hydration telemetry & Web Vitals observer.
 * Zero impact on initial FCP/TBT.
 */
interface MonitoringProps {
    children?: React.ReactNode;
}

export default function Monitoring({ children }: MonitoringProps) {
    useAnalytics({ autoTrackPerformance: true, autoFlushOnReconnect: true });
    return <>{children}</>;
}


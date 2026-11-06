import React from 'react';

/**
 * Monitoring Wrapper — Stripped platform-specific Vercel monitoring for AI Studio compatibility
 */
interface MonitoringProps {
    children: React.ReactNode;
}

export default function Monitoring({ children }: MonitoringProps) {
    return <>{children}</>;
}

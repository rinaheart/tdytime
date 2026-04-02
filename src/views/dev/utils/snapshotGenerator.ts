/**
 * Debug Snapshot Generator — DevTools Console
 * Focused on high-value diagnostic data for TdyTime.
 */

import { APP_VERSION } from '@/core/constants';

export interface DebugSnapshot {
    _meta: {
        generated: string;
        version: string;
        env: string;
        url: string;
    };
    context: {
        userAgent: string;
        viewport: string;
        language: string;
    };
    state: {
        schedule: {
            hasData: boolean;
            weekCount: number;
            totalSessions: number;
            currentWeekIndex: number;
            isMocking: boolean;
            mockMultiplier: number;
            teacher: string;
            semester: string;
            academicYear: string;
        };
        ui: {
            darkMode: boolean;
            accentTheme: string;
            sidebarCollapsed: boolean;
        };
    };
    storage: Record<string, string>;
}

export function generateDebugSnapshot(
    scheduleState: any,
    uiState: any,
): DebugSnapshot {
    const data = scheduleState.data;
    const metadata = data?.metadata;
    
    // Count sessions safely
    let sessionCount = 0;
    if (data?.weeks) {
        data.weeks.forEach((w: any) => {
            Object.values(w.days).forEach((d: any) => {
                sessionCount += (d.morning?.length || 0) + (d.afternoon?.length || 0) + (d.evening?.length || 0);
            });
        });
    }

    const snapshot: DebugSnapshot = {
        _meta: {
            generated: new Date().toISOString(),
            version: APP_VERSION,
            env: import.meta.env.MODE,
            url: window.location.href,
        },
        context: {
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            language: localStorage.getItem('i18nextLng') || 'unknown',
        },
        state: {
            schedule: {
                hasData: !!data,
                weekCount: data?.weeks?.length || 0,
                totalSessions: sessionCount,
                currentWeekIndex: scheduleState.currentWeekIndex,
                isMocking: !!scheduleState.mockState,
                mockMultiplier: scheduleState.mockState?.multiplier || 1,
                teacher: metadata?.teacher || 'N/A',
                semester: metadata?.semester || 'N/A',
                academicYear: metadata?.academicYear || 'N/A',
            },
            ui: {
                darkMode: uiState.darkMode,
                accentTheme: uiState.accentTheme,
                sidebarCollapsed: uiState.sidebarCollapsed,
            }
        },
        storage: {
            'color-theme': localStorage.getItem('color-theme') || '',
            'accent-theme': localStorage.getItem('accent-theme') || '',
            'devtools_enabled': localStorage.getItem('devtools_enabled') || '',
            'has_last_data': localStorage.getItem('last_schedule_data') ? 'YES (truncated)' : 'NO'
        }
    };

    return Object.freeze(snapshot);
}

export function downloadSnapshot(snapshot: DebugSnapshot): void {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = url;
    a.download = `tdytime-debug-${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

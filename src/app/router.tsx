/**
 * App Router — TdyTime v2
 * Hash-based routing for PWA compatibility (back button works).
 */

import React, { lazy, Suspense } from 'react';
import { createHashRouter, Navigate, useRouteError } from 'react-router-dom';
import { useScheduleStore } from '../core/stores/schedule.store';
import { useExamStore } from '../core/stores/exam.store';
import { SessionCardSkeleton } from '../ui/primitives';

// Eager load: critical path (WelcomeView + TodayView load ~40% faster)
import WelcomeView from '../views/welcome/WelcomeView';
import AppLayout from './layout/AppLayout';
import TodayView from '../views/today/TodayView';

// Lazy load: secondary views (loaded on-demand, deduplicated by router)
const WeeklyView = lazy(() => import('../views/weekly/WeeklyView'));
const SemesterView = lazy(() => import('../views/semester/SemesterView'));
const StatisticsView = lazy(() => import('../views/statistics/StatisticsView'));
const SettingsView = lazy(() => import('../views/settings/SettingsView'));
const DevToolsView = lazy(() => import('../views/dev/DevToolsView'));
const ExamView = lazy(() => import('../views/exam/ExamView'));

const DevGuard = ({ children }: { children: React.ReactNode }) => {
    const allowed = import.meta.env.DEV || localStorage.getItem('devtools_enabled') === 'true';
    if (!allowed) {
        if (window.location.hash.includes('/dev')) {
            localStorage.removeItem('devtools_enabled');
        }
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
};

const RouteError = () => {
    const error = useRouteError();
    console.error('RouteError caught:', error);
    return (
        <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-slate-950">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">Unexpected Application Error!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-8">
                Something went wrong while rendering this page. 
                <br />
                <span className="text-[10px] opacity-70 mt-2 block">
                    Hint: If you're using Google Translate, try disabling it for this site.
                </span>
            </p>
            <button
                onClick={() => window.location.href = '#/'}
                className="px-8 py-3 bg-accent-600 hover:bg-accent-700 text-white rounded-2xl font-bold shadow-xl shadow-accent-500/20 active:scale-95 transition-all outline-none"
            >
                Return Home
            </button>
        </div>
    );
};

/** Loading fallback with premium Skeleton UI */
const LoadingFallback = () => (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 p-3 md:p-8">
        <SessionCardSkeleton />
        <SessionCardSkeleton />
        <SessionCardSkeleton />
    </div>
);

/** Redirect to /welcome if no data loaded, otherwise render children */
const RequireData = ({ children }: { children: React.ReactNode }) => {
    const isInitSchedule = useScheduleStore((s) => s.isInitialized);
    const hasData = useScheduleStore((s) => !!s.data);
    const isInitExam = useExamStore((s) => s.isInitialized);
    const hasExamData = useExamStore((s) => !!s.data);

    if (!isInitSchedule || !isInitExam) return <LoadingFallback />;
    if (!hasData && !hasExamData) return <Navigate to="/" replace />;
    
    // If user only has exam data and tries to access empty layout routes, ideally we redirect to /exam
    // but React Router handles this by just rendering what's requested. It's fine for now.
    return <>{children}</>;
};

export const router = createHashRouter([
    {
        path: '/',
        errorElement: <RouteError />,
        element: <WelcomeView />, // Eager load: no Suspense needed
    },
    {
        path: '/demo',
        element: <Navigate to="/dev" replace />,
    },
    {
        path: '/dev',
        errorElement: <RouteError />,
        element: (
            <DevGuard>
                <Suspense fallback={<LoadingFallback />}>
                    <DevToolsView />
                </Suspense>
            </DevGuard>
        ),
    },
    {
        errorElement: <RouteError />,
        element: (
            <RequireData>
                <AppLayout /> {/* Eager load: critical parent layout */}
            </RequireData>
        ),
        children: [
            {
                path: '/today',
                element: <TodayView />, // Eager load: primary feature
            },
            {
                path: '/week',
                element: (
                    <Suspense fallback={<LoadingFallback />}>
                        <WeeklyView />
                    </Suspense>
                ),
            },
            {
                path: '/semester',
                element: (
                    <Suspense fallback={<LoadingFallback />}>
                        <SemesterView />
                    </Suspense>
                ),
            },
            {
                path: '/stats',
                element: (
                    <Suspense fallback={<LoadingFallback />}>
                        <StatisticsView />
                    </Suspense>
                ),
            },
            {
                path: '/settings',
                element: (
                    <Suspense fallback={<LoadingFallback />}>
                        <SettingsView />
                    </Suspense>
                ),
            },
            {
                path: '/exam',
                element: (
                    <Suspense fallback={<LoadingFallback />}>
                        <ExamView />
                    </Suspense>
                ),
            },
        ],
    },
    // Fallback
    { path: '*', element: <Navigate to="/" replace /> },
]);

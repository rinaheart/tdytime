/**
 * App Root — TdyTime v2
 * Mounts router and initializes stores.
 */

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useScheduleStore } from '@/core/stores/schedule.store';
import { yieldToMain } from '@/core/utils/scheduler';

const LazyPWAUpdateHandler = lazy(() =>
    import('./PWAUpdateHandler').then((m) => ({ default: m.PWAUpdateHandler }))
);

const App: React.FC = () => {
    const initFromStorage = useScheduleStore((s) => s.initFromStorage);
    const [mountPWA, setMountPWA] = useState(false);

    // Initialize data from localStorage/IndexedDB after yielding initial paint to main thread
    useEffect(() => {
        let cancelled = false;
        void yieldToMain().then(() => {
            if (!cancelled) {
                void initFromStorage();
            }
        });
        return () => {
            cancelled = true;
        };
    }, [initFromStorage]);

    // Defer mounting PWAUpdateHandler until after initial interactive quiet window or first user interaction
    useEffect(() => {
        let cancelled = false;
        const activate = () => {
            if (!cancelled) setMountPWA(true);
        };
        const timer = window.setTimeout(activate, 5500);
        window.addEventListener('pointerdown', activate, { once: true, passive: true });
        window.addEventListener('keydown', activate, { once: true, passive: true });
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            window.removeEventListener('pointerdown', activate);
            window.removeEventListener('keydown', activate);
        };
    }, []);

    // Keyboard shortcut for DevTools (Development only)
    useEffect(() => {
        if (!import.meta.env.DEV) return;

        const handler = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                localStorage.setItem('devtools_enabled', 'true');
                window.location.hash = '#/dev';
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    return (
        <>
            {mountPWA && (
                <Suspense fallback={null}>
                    <LazyPWAUpdateHandler />
                </Suspense>
            )}
            <RouterProvider router={router} />
        </>
    );
};

export default App;

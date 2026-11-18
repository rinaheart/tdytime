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

/**
 * App Root — TdyTime v2
 * Mounts router and initializes stores.
 */

import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useScheduleStore } from '@/core/stores';

import { PWAUpdateHandler } from './PWAUpdateHandler';

import { SpeedInsights } from '@vercel/speed-insights/react';

const App: React.FC = () => {
    const initFromStorage = useScheduleStore((s) => s.initFromStorage);

    // Initialize data from localStorage on mount
    useEffect(() => {
        initFromStorage();
    }, [initFromStorage]);

    // Keyboard shortcut for DevTools
    useEffect(() => {
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
            <PWAUpdateHandler />
            <RouterProvider router={router} />
            <SpeedInsights />
        </>
    );
};

export default App;

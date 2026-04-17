/**
 * Entry Point — TdyTime v2
 * Waits for i18n initialization before rendering to prevent raw key flicker.
 */

import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import Monitoring from './app/Monitoring';

// Initialize i18n before rendering (includes critical translations merge)
import { i18nReady } from './i18n/config';

// Global styles
import './styles/global.css';

import App from './app/App';

// 🎯 Wait for i18n critical keys (usually <50ms since already inlined)
i18nReady.then(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            <Suspense fallback={<div className="min-h-screen bg-white dark:bg-slate-950" />}>
                <Monitoring>
                    <App />
                </Monitoring>
            </Suspense>
        </React.StrictMode>,
    );
});

// Fallback: render anyway after 500ms if i18n stuck
setTimeout(() => {
    const rootElement = document.getElementById('root');
    if (rootElement && !rootElement.hasChildNodes()) {
        console.warn('i18n init timeout, rendering with available translations');
        ReactDOM.createRoot(rootElement).render(
            <React.StrictMode>
                <Suspense fallback={<div className="min-h-screen bg-white dark:bg-slate-950" />}>
                    <Monitoring>
                        <App />
                    </Monitoring>
                </Suspense>
            </React.StrictMode>,
        );
    }
}, 500);

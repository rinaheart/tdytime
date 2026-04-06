/**
 * Entry Point — TdyTime v2
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Initialize i18n before rendering
import './i18n/config';

// Global styles
import './styles/global.css';

import App from './app/App';
import { Suspense } from 'react';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Suspense fallback={<div className="min-h-screen bg-white dark:bg-slate-950" />}>
            <App />
            <SpeedInsights />
        </Suspense>
    </React.StrictMode>,
);

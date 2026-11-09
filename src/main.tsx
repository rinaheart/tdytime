/**
 * Entry Point — TdyTime v2
 */

import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import Monitoring from './app/Monitoring';

// Initialize i18n before rendering
import './i18n/config';

// Global styles
import './styles/global.css';

import App from './app/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Suspense fallback={<div className="min-h-screen bg-white dark:bg-slate-950" />}>
            <Monitoring>
                <App />
            </Monitoring>
        </Suspense>
    </React.StrictMode>,
);

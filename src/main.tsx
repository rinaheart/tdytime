/**
 * Entry Point — TdyTime v2
 * Cooperative main-thread bootstrap with time-slicing and React 18/19 startTransition.
 */

// Global styles
import './styles/global.css';
import { yieldToMain } from './core/utils/scheduler';

async function bootstrap() {
    // Slice 1: Initialize React DOM client CJS factory
    const ReactDOMModule = await import('react-dom/client');
    await yieldToMain();

    // Slice 2: Initialize core shell i18n
    await import('./i18n/config');
    await yieldToMain();

    // Slice 3: Load App shell and Monitoring wrapper
    const [{ default: React, Suspense, startTransition }, { default: Monitoring }, { default: App }] =
        await Promise.all([
            import('react'),
            import('./app/Monitoring'),
            import('./app/App'),
        ]);
    await yieldToMain();

    // Slice 4: Mount root inside startTransition for 5ms concurrent fiber slicing
    const container = document.getElementById('root')!;
    const root = ReactDOMModule.default.createRoot(container);
    startTransition(() => {
        root.render(
            <React.StrictMode>
                <Suspense fallback={<div className="min-h-screen bg-white dark:bg-slate-950" />}>
                    <Monitoring>
                        <App />
                    </Monitoring>
                </Suspense>
            </React.StrictMode>,
        );
    });
}

void bootstrap();

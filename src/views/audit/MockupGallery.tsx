import { lazy, Suspense } from 'react';

const Option1A11y = lazy(() => import('../../../.uiux-audit/mockups/finding-1-upload-a11y/Option1').catch(() => ({ default: () => null })) as any);
const Option2A11y = lazy(() => import('../../../.uiux-audit/mockups/finding-1-upload-a11y/Option2').catch(() => ({ default: () => null })) as any);
const Option3A11y = lazy(() => import('../../../.uiux-audit/mockups/finding-1-upload-a11y/Option3').catch(() => ({ default: () => null })) as any);

const Option1Touch = lazy(() => import('../../../.uiux-audit/mockups/finding-2-touch-targets/Option1').catch(() => ({ default: () => null })) as any);
const Option2Touch = lazy(() => import('../../../.uiux-audit/mockups/finding-2-touch-targets/Option2').catch(() => ({ default: () => null })) as any);

const Option1Load = lazy(() => import('../../../.uiux-audit/mockups/finding-3-cognitive-load/Option1').catch(() => ({ default: () => null })) as any);
const Option2Load = lazy(() => import('../../../.uiux-audit/mockups/finding-3-cognitive-load/Option2').catch(() => ({ default: () => null })) as any);
const Option3Load = lazy(() => import('../../../.uiux-audit/mockups/finding-3-cognitive-load/Option3').catch(() => ({ default: () => null })) as any);

export default function MockupGallery() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">UI/UX Audit Mockups</h1>
            
            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Finding 1: Upload A11y</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border p-4 rounded-xl"><h3 className="mb-2 font-bold">Option 1</h3><Suspense fallback="Loading..."><Option1A11y /></Suspense></div>
                    <div className="border p-4 rounded-xl"><h3 className="mb-2 font-bold">Option 2</h3><Suspense fallback="Loading..."><Option2A11y /></Suspense></div>
                    <div className="border p-4 rounded-xl"><h3 className="mb-2 font-bold">Option 3</h3><Suspense fallback="Loading..."><Option3A11y /></Suspense></div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Finding 2: Touch Targets</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border p-4 rounded-xl flex items-center justify-center gap-4"><h3 className="mb-2 font-bold">Option 1</h3><Suspense fallback="Loading..."><Option1Touch /></Suspense></div>
                    <div className="border p-4 rounded-xl flex items-center justify-center gap-4"><h3 className="mb-2 font-bold">Option 2</h3><Suspense fallback="Loading..."><Option2Touch /></Suspense></div>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Finding 3: Cognitive Load</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border p-4 rounded-xl"><h3 className="mb-2 font-bold">Option 1</h3><Suspense fallback="Loading..."><Option1Load /></Suspense></div>
                    <div className="border p-4 rounded-xl"><h3 className="mb-2 font-bold">Option 2</h3><Suspense fallback="Loading..."><Option2Load /></Suspense></div>
                    <div className="border p-4 rounded-xl"><h3 className="mb-2 font-bold">Option 3</h3><Suspense fallback="Loading..."><Option3Load /></Suspense></div>
                </div>
            </section>
        </div>
    )
}

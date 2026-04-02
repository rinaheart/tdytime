import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Database, Copy, Check, RefreshCw } from 'lucide-react';
import { useScheduleStore, useUIStore } from '@/core/stores';
import CollapsibleSection from '../components/CollapsibleSection';

function safeStringify(obj: unknown): string {
    const cache = new Set();
    return JSON.stringify(obj, (_key, value) => {
        if (typeof value === 'function') return '[Function]';
        if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) return '[Circular]';
            cache.add(value);
        }
        return value;
    }, 2);
}

export const StateInspector: React.FC = () => {
    const [refreshKey, setRefreshKey] = useState(0);
    const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

    const scheduleState = useMemo(() => useScheduleStore.getState(), [refreshKey]);
    const uiState = useMemo(() => useUIStore.getState(), [refreshKey]);

    useEffect(() => {
        const unsub1 = useScheduleStore.subscribe(() => refresh());
        const unsub2 = useUIStore.subscribe(() => refresh());
        return () => {
            if (typeof unsub1 === 'function') unsub1();
            if (typeof unsub2 === 'function') unsub2();
        };
    }, [refresh]);

    const [activeJson, setActiveJson] = useState<'schedule' | 'ui' | null>(null);
    const [copied, setCopied] = useState<'schedule' | 'ui' | null>(null);

    const handleCopy = (type: 'schedule' | 'ui', data: unknown) => {
        navigator.clipboard.writeText(safeStringify(data));
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const StatusValue = ({ val }: { val: boolean | null | undefined }) => {
        if (val === true) return <span className="text-green-600 font-bold">true</span>;
        if (val === false) return <span className="text-red-500 font-bold">false</span>;
        return <span className="text-slate-400 italic">null</span>;
    };

    return (
        <CollapsibleSection id="state-inspector" title="Trạng thái (State Inspector)" icon={<Database size={16} />}>
            <div className="space-y-3">
                {/* Schedule Store */}
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-none p-3">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">
                        <div className="font-bold text-sm text-slate-700 dark:text-slate-200">
                            useScheduleStore
                            <span className="ml-2 text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-none text-slate-600 dark:text-slate-300">
                                {scheduleState.data ? 'Có dữ liệu' : 'Trống'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={refresh} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-none transition-none cursor-pointer" title="Refresh state manually">
                                <RefreshCw size={14} />
                            </button>
                            <button onClick={() => setActiveJson(activeJson === 'schedule' ? null : 'schedule')} className="text-[10px] font-bold px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none hover:border-amber-500 text-slate-600 dark:text-slate-300 transition-none cursor-pointer">
                                {activeJson === 'schedule' ? 'CLOSE JSON' : 'VIEW JSON'}
                            </button>
                            <button onClick={() => handleCopy('schedule', scheduleState)} className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none text-slate-500 hover:text-amber-500 transition-none cursor-pointer" title="Copy JSON state">
                                {copied === 'schedule' ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 text-xs gap-y-2 gap-x-4 mb-2">
                        <div className="flex justify-between">
                            <span className="text-slate-500">isInitialized:</span>
                            <StatusValue val={scheduleState.isInitialized} />
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">isProcessing:</span>
                            <StatusValue val={scheduleState.isProcessing} />
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">curWeekIdx:</span>
                            <span className="font-mono">{scheduleState.currentWeekIndex}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">mockState:</span>
                            <StatusValue val={scheduleState.mockState ? true : null} />
                        </div>
                    </div>

                    {activeJson === 'schedule' && (
                        <div className="mt-2 text-[10px] font-mono bg-slate-900 text-green-400 p-3 rounded-none max-h-[400px] overflow-y-auto border border-slate-800">
                            <pre>{safeStringify(scheduleState)}</pre>
                        </div>
                    )}
                </div>

                {/* UI Store */}
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-none p-3">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">
                        <div className="font-bold text-sm text-slate-700 dark:text-slate-200">useUIStore</div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setActiveJson(activeJson === 'ui' ? null : 'ui')} className="text-[10px] font-bold px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none hover:border-amber-500 text-slate-600 dark:text-slate-300 transition-none cursor-pointer">
                                {activeJson === 'ui' ? 'CLOSE JSON' : 'VIEW JSON'}
                            </button>
                            <button onClick={() => handleCopy('ui', uiState)} className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-none text-slate-500 hover:text-amber-500 transition-none cursor-pointer" title="Copy JSON state">
                                {copied === 'ui' ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 text-xs gap-y-2 gap-x-4 mb-2">
                        <div className="flex justify-between">
                            <span className="text-slate-500">darkMode:</span>
                            <StatusValue val={uiState.darkMode} />
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">sidebarCollapsed:</span>
                            <StatusValue val={uiState.sidebarCollapsed} />
                        </div>
                        <div className="flex justify-between col-span-2">
                            <span className="text-slate-500">accentTheme:</span>
                            <span className="font-mono text-slate-600 dark:text-slate-300">{uiState.accentTheme}</span>
                        </div>
                    </div>

                    {activeJson === 'ui' && (
                        <div className="mt-2 text-[10px] font-mono bg-slate-900 text-green-400 p-3 rounded-none max-h-[400px] overflow-y-auto border border-slate-800">
                            <pre>{safeStringify(uiState)}</pre>
                        </div>
                    )}
                </div>
            </div>
        </CollapsibleSection>
    );
};

export default StateInspector;

/**
 * StatsHeader — Unified KPI header with teacher info and key metrics.
 * Compact, single-row design consistent with app's minimal language.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Hash, Calendar, FastForward, AlertTriangle } from 'lucide-react';
import { useScheduleStore } from '@/core/stores';
import { formatSemester } from '@/core/schedule';

interface StatsHeaderProps {
    isCollapsed?: boolean;
    onToggle?: () => void;
}

const StatsHeader: React.FC<StatsHeaderProps> = ({ isCollapsed = false, onToggle }) => {
    const { t } = useTranslation();
    const data = useScheduleStore((s) => s.data);
    const metrics = useScheduleStore((s) => s.metrics);

    if (!data || !metrics) return null;
    const { metadata } = data;

    const kpis = [
        { value: metrics.totalHours, label: t('common.periods'), icon: Hash },
        { value: metrics.totalSessions, label: t('common.sessions'), icon: Calendar },
        { value: metrics.totalWeeks, label: t('common.weeks'), icon: FastForward },
        ...(metrics.totalConflicts > 0
            ? [{ value: metrics.totalConflicts, label: t('common.conflicts', { defaultValue: 'Conflicts' }), isAlert: true, icon: AlertTriangle }]
            : []),
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-6 relative">
                {/* Teacher info — left side */}
                <div className="lg:col-span-2 flex items-center gap-3 p-4 md:p-5 min-w-0 pr-16 lg:pr-5 relative">
                    <div className="w-10 h-10 rounded-full bg-accent-600 flex items-center justify-center shrink-0 text-white text-sm font-black font-sans shadow-sm shadow-accent-600/20 uppercase">
                        {metadata.teacher.trim().split(' ').pop()?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-base sm:text-lg lg:text-xl font-black font-sans text-slate-800 dark:text-slate-100 uppercase tracking-normal line-clamp-2 leading-snug">
                            {metadata.teacher}
                        </h1>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 font-num mt-1 truncate">
                            {formatSemester(metadata.semester)} • {metadata.academicYear}
                        </p>
                    </div>

                    {/* Expand/Collapse Toggle — Strictly 44x44px minimum touch target */}
                    <button
                        type="button"
                        onClick={onToggle}
                        aria-expanded={!isCollapsed}
                        aria-label={isCollapsed ? t('common.expandAll') : t('common.collapseAll')}
                        className={`absolute top-3 right-3 w-11 h-11 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500
                            ${!isCollapsed ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rotate-180' : 'bg-accent-50 dark:bg-accent-900/40 text-accent-600 dark:text-accent-400'}`}
                    >
                        <ChevronDown size={18} />
                    </button>
                </div>

                {/* KPI strip — right side */}
                <div className={`lg:col-span-1 flex items-stretch transition-all duration-300 overflow-hidden 
                    lg:max-h-none lg:opacity-100 lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800
                    ${!isCollapsed ? 'max-h-40 opacity-100 border-t' : 'max-h-0 opacity-0 border-t-0'}
                `}>
                    {kpis.map((kpi, i) => (
                        <div
                            key={i}
                            className={`flex flex-col items-center justify-center px-2 py-3 flex-1 min-w-0
                                ${i > 0 ? 'border-l border-slate-100 dark:border-slate-800' : ''}
                                ${'isAlert' in kpi ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
                            `}
                        >
                            <span className={`text-xl md:text-2xl font-black leading-none font-num tabular-nums
                                ${'isAlert' in kpi
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-accent-700 dark:text-accent-400'
                                }`}
                            >
                                {kpi.value}
                            </span>
                            <span className={`text-xs font-bold uppercase tracking-wider mt-1.5 truncate max-w-full
                                ${'isAlert' in kpi
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                {kpi.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default React.memo(StatsHeader);

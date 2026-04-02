/**
 * StatsHeader — Unified KPI header with teacher info and key metrics.
 * Compact, single-row design consistent with app's premium minimal language.
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
            {/* 
                Internal Grid: Uses the same gap-6 (lg:gap-6) as the dashboard below.
                This ensures the 'border-l' of the KPI section aligns perfectly 
                with the left border of the 1/3 cards in the rows below.
            */}
            <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-6 relative">

                {/* Teacher info — left side (Occupies 2/3 and aligns with ProgressCard) */}
                <div className="lg:col-span-2 flex items-center gap-3 p-4 md:p-5 min-w-0 pr-12 lg:pr-5 relative">
                    <div className="w-10 h-10 rounded-full bg-accent-600 flex items-center justify-center shrink-0 text-white text-sm font-black font-sans shadow-sm shadow-accent-600/20 uppercase">
                        {metadata.teacher.trim().split(' ').pop()?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg lg:text-xl font-black font-sans text-slate-800 dark:text-slate-100 uppercase tracking-normal line-clamp-2 white-space-normal leading-relaxed">
                            {metadata.teacher}
                        </h2>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 font-num mt-1 truncate">
                            {formatSemester(metadata.semester)} • {metadata.academicYear}
                        </p>
                    </div>

                    {/* Expand/Collapse Toggle (Always visible for Privacy/Sharing) */}
                    <button
                        onClick={onToggle}
                        className={`absolute top-4 right-4 p-1.5 rounded-full transition-all duration-300 flex items-center justify-center
                            ${!isCollapsed ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 rotate-180' : 'bg-accent-50 dark:bg-accent-900/40 text-accent-600'}`}
                    >
                        <ChevronDown size={18} />
                    </button>
                </div>

                {/* KPI strip — right side (Occupies 1/3 and aligns with InsightCards) */}
                <div className={`lg:col-span-1 flex items-stretch transition-all duration-300 overflow-hidden 
                    lg:max-h-none lg:opacity-100 lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800
                    ${!isCollapsed ? 'max-h-40 opacity-100 border-t' : 'max-h-0 opacity-0 border-t-0'}
                `}>
                    {kpis.map((kpi, i) => (
                        <div
                            key={i}
                            className={`flex flex-col items-center justify-center px-2 py-3 flex-1
                                ${i > 0 ? 'border-l border-slate-100 dark:border-slate-800' : ''}
                                ${'isAlert' in kpi ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
                            `}
                        >
                            <span className={`text-xl md:text-2xl font-black leading-none font-num
                                ${'isAlert' in kpi
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-accent-700 dark:text-accent-400'
                                }`}
                            >
                                {kpi.value}
                            </span>
                            <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-1.5
                                ${'isAlert' in kpi
                                    ? 'text-red-500 dark:text-red-400'
                                    : 'text-slate-400 dark:text-slate-500'
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

/**
 * WeekNavigation — Week prev/next/current controls + header.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Zap, Columns, LayoutTemplate, Search } from 'lucide-react';
import { useScheduleStore } from '@/core/stores';
import { isCurrentWeek, getCurrentWeekRange } from '@/core/schedule/schedule.utils';

interface WeekNavigationProps {
    viewMode: 'horizontal' | 'vertical';
    onToggleViewMode: () => void;
    isFilterOpen: boolean;
    onToggleFilter: () => void;
    hasActiveFilters: boolean;
}

const WeekNavigation: React.FC<WeekNavigationProps> = ({ viewMode, onToggleViewMode, isFilterOpen, onToggleFilter, hasActiveFilters }) => {
    const { t } = useTranslation();
    const data = useScheduleStore((s) => s.data);
    const currentWeekIndex = useScheduleStore((s) => s.currentWeekIndex);
    const setCurrentWeekIndex = useScheduleStore((s) => s.setCurrentWeekIndex);
    const jumpToCurrentWeek = useScheduleStore((s) => s.jumpToCurrentWeek);

    const now = useMemo(() => new Date(), []);
    const weeks = data?.weeks || [];
    const week = currentWeekIndex === -1 ? undefined : weeks[currentWeekIndex];
    const isFirst = currentWeekIndex <= 0;
    const isLast = currentWeekIndex >= weeks.length - 1;

    const isCurrent = currentWeekIndex === -1 || (week ? isCurrentWeek(week.dateRange, now) : false);

    const weekLabel = useMemo(() => {
        if (currentWeekIndex === -1) return t('common.current');
        return t('weekly.week', { number: currentWeekIndex + 1 });
    }, [currentWeekIndex, t]);

    const weekDateRange = useMemo(() => {
        if (week) return week.dateRange;
        return getCurrentWeekRange(now);
    }, [week, now]);

    const formatDateRange = (range: string) => {
        const dates = range.match(/\d{2}\/\d{2}\/\d{4}/g);
        if (dates && dates.length >= 2) return `${dates[0]} → ${dates[1]}`;
        return range;
    };

    if (!week && currentWeekIndex !== -1) return null;

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pt-1">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">
                        {weekLabel}
                    </h3>
                    {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 text-[8px] font-black uppercase tracking-widest animate-pulse">
                            {t('weekly.currentWeek')}
                        </span>
                    )}
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 font-num">{formatDateRange(weekDateRange)}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end w-full md:w-auto md:self-auto">
                <button
                    onClick={() => data && jumpToCurrentWeek(data)}
                    className={`flex items-center gap-2 h-11 px-4 rounded-xl text-xs font-bold transition-all shadow-sm ${isCurrent
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default'
                        : 'bg-accent-600 dark:bg-accent-500 text-white hover:bg-accent-700 active:scale-95 shadow-accent-500/20'
                        }`}
                >
                    <Zap size={16} className="fill-current" />
                    <span className="hidden sm:inline">{t('common.current')}</span>
                </button>

                <button
                    onClick={onToggleViewMode}
                    className="flex items-center gap-2 h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-accent-50 dark:hover:bg-accent-950/40 active:scale-95 transition-all shadow-sm"
                >
                    {viewMode === 'vertical' ? <Columns size={16} className="text-accent-500" /> : <LayoutTemplate size={16} className="text-accent-500" />}
                    <span className="hidden sm:inline">{viewMode === 'vertical' ? t('common.verticalList') : t('common.horizontalList')}</span>
                </button>

                <button
                    onClick={onToggleFilter}
                    className={`flex items-center gap-2 h-11 px-4 border rounded-xl text-xs font-bold transition-all shadow-sm relative ${isFilterOpen ? 'bg-accent-600 border-accent-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}
                >
                    <Search size={16} className={isFilterOpen ? 'text-white' : 'text-accent-500'} />
                    <span className="hidden sm:inline">{t('common.filter')}</span>
                    {hasActiveFilters && !isFilterOpen && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent-500 border-2 border-white dark:border-slate-900 rounded-full" />
                    )}
                </button>

                <div className="flex bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-11">
                    <button 
                        onClick={() => setCurrentWeekIndex((i) => (i === -1 ? 0 : Math.max(0, i - 1)))} 
                        disabled={isFirst && currentWeekIndex !== -1} 
                        aria-label="Previous Week" 
                        className="px-4 h-full hover:bg-accent-50 dark:hover:bg-accent-950/40 text-accent-600 dark:text-accent-400 disabled:opacity-30 disabled:text-slate-400 border-r border-slate-200 dark:border-slate-800 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button 
                        onClick={() => setCurrentWeekIndex((i) => (i === -1 ? weeks.length - 1 : Math.min(weeks.length - 1, i + 1)))} 
                        disabled={isLast} 
                        aria-label="Next Week" 
                        className="px-4 h-full hover:bg-accent-50 dark:hover:bg-accent-950/40 text-accent-600 dark:text-accent-400 disabled:opacity-30 disabled:text-slate-400 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(WeekNavigation);

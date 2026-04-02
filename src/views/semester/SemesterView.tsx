/**
 * SemesterView — Full semester timeline with accordion weeks.
 * Two modes: vertical (timeline cards) and horizontal (table per week).
 * Reads from Zustand store. Zero props.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap, LayoutTemplate, Columns, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useScheduleStore } from '@/core/stores';
import { FilterBar } from '@/ui';
// DAYS_OF_WEEK used in WeekAccordion

import { isCurrentWeek as checkIsCurrentWeek, getCurrentWeekRange, getFilteredWeek } from '@/core/schedule/schedule.utils';
import { useScheduleFilter } from '@/core/hooks/useScheduleFilter';
import WeekAccordion from './WeekAccordion';

const SemesterView: React.FC = () => {
    const { t } = useTranslation();
    const data = useScheduleStore((s) => s.data);
    const overrides = useScheduleStore((s) => s.overrides);
    const abbreviations = useScheduleStore((s) => s.abbreviations);

    const weeks = data?.weeks || [];
    const teacherName = data?.metadata?.teacher || '';
    const location = useLocation();

    const {
        filters, setFilters,
        isFilterOpen, toggleFilter,
        filterFn, hasActiveFilters,
        uniqueData, isAfterSemester, isBeforeSemester, now
    } = useScheduleFilter(weeks, teacherName);

    const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('horizontal');
    const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({});
    const [toast, setToast] = useState<string | null>(null);

    // Cross-view navigation auto-expand via location state
    useEffect(() => {
        if (location.state && typeof location.state.autoExpandWeek === 'number') {
            const wIdx = location.state.autoExpandWeek;
            setExpandedWeeks(prev => ({ ...prev, [wIdx]: true }));
            setTimeout(() => {
                document.getElementById(`week-card-${wIdx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => { if (window.innerWidth < 768) setViewMode('vertical'); }, []);



    // Centralize filtering for all weeks to leverage React.memo properly
    const filteredWeeksData = useMemo(() => {
        return weeks.map(week => getFilteredWeek(week, filterFn));
    }, [weeks, filterFn]);    const scrollToCurrentWeek = () => {
        if (isBeforeSemester) {
            setExpandedWeeks((prev) => ({ ...prev, [0]: true }));
            setTimeout(() => document.getElementById(`week-card-0`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
            return;
        }

        if (isAfterSemester) {
            setToast(t('semester.toast.ended'));
            setTimeout(() => setToast(null), 3000);
            return;
        }

        const currentWIdx = weeks.findIndex((w) => checkIsCurrentWeek(w.dateRange, now));

        if (currentWIdx !== -1) {
            if (filteredWeeksData[currentWIdx].hasSessions) {
                setExpandedWeeks((prev) => ({ ...prev, [currentWIdx]: true }));
                setTimeout(() => document.getElementById(`week-card-${currentWIdx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
            } else {
                setToast(t('semester.toast.noSchedule', { range: weeks[currentWIdx].dateRange }));
                setTimeout(() => setToast(null), 3500);
            }
        } else {
            // Current date is within semester bounds but not in any explicit week (gap)
            const weekRange = getCurrentWeekRange(now);
            setToast(t('semester.toast.noSchedule', { range: weekRange }));
            setTimeout(() => setToast(null), 3500);
        }
    };

    const toggleWeek = (wIdx: number) => setExpandedWeeks((prev) => ({ ...prev, [wIdx]: !prev[wIdx] }));

    const isAllExpanded = useMemo(() => {
        if (weeks.length === 0) return false;
        return weeks.every((_, i) => expandedWeeks[i] ?? (checkIsCurrentWeek(weeks[i].dateRange, now) && filteredWeeksData[i].hasSessions));
    }, [weeks, expandedWeeks, now, filteredWeeksData]);

    const toggleAllWeeks = () => {
        const shouldExpand = !isAllExpanded;
        const newState: Record<number, boolean> = {};
        weeks.forEach((_, i) => { newState[i] = shouldExpand; });
        setExpandedWeeks(newState);
    };

    if (weeks.length === 0) return <div className="p-8 text-center text-slate-400">{t('stats.today.noDataTitle')}</div>;

    return (
        <div className="pb-6 animate-in fade-in duration-300 relative -mt-3 md:-mt-8">
            {/* Sticky Header Container */}
            <div className="sticky top-0 md:top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md -mx-4 px-4 pt-3 pb-4 space-y-4 mb-6 border-b border-slate-100 dark:border-slate-800 transition-colors font-sans">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase leading-none mb-1">
                        {t('nav.semester')} {data?.metadata?.semester}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-num uppercase tracking-widest">{data?.metadata?.academicYear}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end w-full md:w-auto md:self-auto">
                    <button onClick={scrollToCurrentWeek} className="flex items-center gap-2 h-11 px-4 bg-accent-600 dark:bg-accent-500 text-white rounded-xl text-xs font-bold transition-all hover:bg-accent-700 dark:hover:bg-accent-600 shadow-sm shadow-accent-500/20 active:scale-95">
                        <Zap size={16} className="fill-current" />
                        <span className="hidden sm:inline">{t('common.current')}</span>
                    </button>
                    <button onClick={() => setViewMode((v) => (v === 'vertical' ? 'horizontal' : 'vertical'))} className="flex items-center gap-2 h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-accent-50 dark:hover:bg-accent-950/40 active:scale-95 transition-all shadow-sm">
                        {viewMode === 'vertical' ? <Columns size={16} className="text-accent-500" /> : <LayoutTemplate size={16} className="text-accent-500" />}
                        <span className="hidden sm:inline">{viewMode === 'vertical' ? t('common.verticalList') : t('common.horizontalList')}</span>
                    </button>
                    <button onClick={toggleFilter} className={`flex items-center gap-2 h-11 px-4 border rounded-xl text-xs font-bold transition-all shadow-sm relative ${isFilterOpen ? 'bg-accent-600 border-accent-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-accent-50 dark:hover:bg-accent-950/40'}`}>
                        <Search size={16} className={isFilterOpen ? 'text-white' : 'text-accent-500'} />
                        <span className="hidden sm:inline">{t('common.filter')}</span>
                        {hasActiveFilters && !isFilterOpen && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent-500 border-2 border-white dark:border-slate-900 rounded-full" />}
                    </button>
                    <button onClick={toggleAllWeeks} className="flex items-center gap-2 h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm">
                        {isAllExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        <span className="hidden sm:inline">{isAllExpanded ? t('common.collapseAll') : t('common.expandAll')}</span>
                    </button>
                </div>
            </div>

            {/* Filter */}
            {isFilterOpen && (
                <div className="mb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <FilterBar filters={filters} onChange={setFilters} uniqueRooms={uniqueData.rooms} uniqueTeachers={uniqueData.teachers} uniqueClasses={uniqueData.classes} />
                </div>
            )}
            </div>

            {/* Weeks */}
            <div className={viewMode === 'vertical' ? 'relative space-y-8 before:absolute before:left-[19px] md:before:left-[23px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 before:z-0' : 'space-y-8'}>
                {weeks.map((week, wIdx) => {
                    const filteredData = filteredWeeksData[wIdx];
                    if (!filteredData.hasSessions && hasActiveFilters) return null;

                    const isCurrent = checkIsCurrentWeek(week.dateRange, now);
                    const isDefaultExpanded = isAfterSemester ? false : (isCurrent ? filteredData.hasSessions : (isBeforeSemester && wIdx === 0));
                    const isExpanded = expandedWeeks[wIdx] ?? isDefaultExpanded;

                    return (
                        <WeekAccordion
                            key={wIdx}
                            week={filteredData.filteredWeek}
                            weekIdx={wIdx}
                            isExpanded={isExpanded}
                            onToggle={() => toggleWeek(wIdx)}
                            showTeacher={!filters.teacher}
                            viewMode={viewMode}
                            now={now}
                            abbreviations={abbreviations!}
                        />
                    );
                })}
            </div>

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 dark:border-slate-200">
                        <Zap size={16} className="text-yellow-400 fill-current" />
                        <span className="text-sm font-bold">{toast}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(SemesterView);

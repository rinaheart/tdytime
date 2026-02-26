/**
 * SemesterView — Full semester timeline with accordion weeks.
 * Two modes: vertical (timeline cards) and horizontal (table per week).
 * Reads from Zustand store. Zero props.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap, LayoutTemplate, Columns, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useScheduleStore } from '@/core/stores';
import { FilterBar } from '@/ui';
// DAYS_OF_WEEK used in WeekAccordion
import type { DaySchedule, WeekSchedule } from '@/core/schedule/schedule.types';
import { isCurrentWeek as checkIsCurrentWeek, createSessionFilter, parseDateFromRange, getCurrentWeekRange } from '@/core/schedule/schedule.utils';
import type { FilterState } from '@/core/schedule/schedule.utils';
import WeekAccordion from './WeekAccordion';

const SemesterView: React.FC = () => {
    const { t } = useTranslation();
    const data = useScheduleStore((s) => s.data);

    const weeks = data?.weeks || [];
    const teacherName = data?.metadata?.teacher || '';
    const location = useLocation();

    const [filters, setFilters] = useState<FilterState>({ search: '', className: '', room: '', teacher: teacherName, sessionTime: '' });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
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

    const now = useMemo(() => new Date(), []);
    const filterFn = useMemo(() => createSessionFilter(filters), [filters]);

    const hasActiveFilters = useMemo(
        () => filters.search !== '' || filters.className !== '' || filters.room !== '' || (filters.teacher !== '' && filters.teacher !== teacherName),
        [filters, teacherName]
    );

    const uniqueData = useMemo(() => {
        const rooms = new Set<string>();
        const teachers = new Set<string>();
        const classes = new Set<string>();
        weeks.forEach((w) => {
            Object.values(w.days).forEach((d) => {
                const day = d as DaySchedule;
                [...day.morning, ...day.afternoon, ...day.evening].forEach((s) => {
                    rooms.add(s.room);
                    teachers.add(s.teacher);
                    if (s.className) classes.add(s.className);
                });
            });
        });
        return { rooms: Array.from(rooms).sort(), teachers: Array.from(teachers).sort(), classes: Array.from(classes).sort() };
    }, [weeks]);

    const weekHasSessions = useCallback((week: WeekSchedule) => {
        return Object.values(week.days).some((d) => {
            const day = d as DaySchedule;
            return [...day.morning, ...day.afternoon, ...day.evening].some(filterFn);
        });
    }, [filterFn]);

    const isBeforeSemester = useMemo(() => {
        if (weeks.length === 0) return false;
        const start = parseDateFromRange(weeks[0].dateRange, 'start');
        if (!start) return false;
        const check = new Date(now); check.setHours(0, 0, 0, 0);
        return check < start;
    }, [weeks, now]);

    const isAfterSemester = useMemo(() => {
        if (weeks.length === 0) return false;
        const end = parseDateFromRange(weeks[weeks.length - 1].dateRange, 'end');
        if (!end) return false;
        const check = new Date(now); check.setHours(0, 0, 0, 0);
        return check > end;
    }, [weeks, now]);

    const scrollToCurrentWeek = () => {
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
            if (weekHasSessions(weeks[currentWIdx])) {
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
        return weeks.every((_, i) => expandedWeeks[i] ?? (checkIsCurrentWeek(weeks[i].dateRange, now) && weekHasSessions(weeks[i])));
    }, [weeks, expandedWeeks, now, weekHasSessions]);

    const toggleAllWeeks = () => {
        const shouldExpand = !isAllExpanded;
        const newState: Record<number, boolean> = {};
        weeks.forEach((_, i) => { newState[i] = shouldExpand; });
        setExpandedWeeks(newState);
    };

    if (weeks.length === 0) return <div className="p-8 text-center text-slate-400">{t('stats.today.noDataTitle')}</div>;

    return (
        <div className="pt-1 pb-6 animate-in fade-in duration-300 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase leading-none mb-1">
                        {t('nav.semester')} {data?.metadata?.semester}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-num uppercase tracking-widest">{data?.metadata?.academicYear}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
                    <button onClick={scrollToCurrentWeek} className="flex items-center gap-2 h-11 px-4 bg-blue-600 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95">
                        <Zap size={16} className="fill-current" />
                        <span className="hidden sm:inline">{t('common.current')}</span>
                    </button>
                    <button onClick={() => setViewMode((v) => (v === 'vertical' ? 'horizontal' : 'vertical'))} className="flex items-center gap-2 h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 active:scale-95 transition-all shadow-sm">
                        {viewMode === 'vertical' ? <LayoutTemplate size={16} className="text-blue-500" /> : <Columns size={16} className="text-blue-500" />}
                        <span className="hidden sm:inline">{viewMode === 'vertical' ? t('common.horizontalList') : t('common.verticalList')}</span>
                    </button>
                    <button onClick={() => setIsFilterOpen((v) => !v)} className={`flex items-center gap-2 h-11 px-4 border rounded-lg text-xs font-bold transition-all shadow-sm relative ${isFilterOpen ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}>
                        <Search size={16} className={isFilterOpen ? 'text-white' : 'text-indigo-500'} />
                        <span className="hidden sm:inline">{t('common.filter')}</span>
                        {hasActiveFilters && !isFilterOpen && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 border-2 border-white dark:border-slate-900 rounded-full" />}
                    </button>
                    <button onClick={toggleAllWeeks} className="flex items-center gap-2 h-11 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 active:scale-95 transition-all shadow-sm">
                        {isAllExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        <span className="hidden sm:inline">{isAllExpanded ? t('common.collapseAll') : t('common.expandAll')}</span>
                    </button>
                </div>
            </div>

            {/* Filter */}
            {isFilterOpen && (
                <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <FilterBar filters={filters} onChange={setFilters} uniqueRooms={uniqueData.rooms} uniqueTeachers={uniqueData.teachers} uniqueClasses={uniqueData.classes} />
                </div>
            )}

            {/* Weeks */}
            <div className={viewMode === 'vertical' ? 'relative space-y-8 before:absolute before:left-[19px] md:before:left-[23px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 before:z-0' : 'space-y-8'}>
                {weeks.map((week, wIdx) => {
                    const hasData = Object.values(week.days).some((d) => {
                        const day = d as DaySchedule;
                        return [...day.morning, ...day.afternoon, ...day.evening].some(filterFn);
                    });
                    if (!hasData && (filters.search || filters.className || filters.room || filters.teacher)) return null;

                    const isCurrent = checkIsCurrentWeek(week.dateRange, now);
                    const hasSessions = weekHasSessions(week);
                    const isDefaultExpanded = isAfterSemester ? false : (isCurrent ? hasSessions : (isBeforeSemester && wIdx === 0));
                    const isExpanded = expandedWeeks[wIdx] ?? isDefaultExpanded;

                    return (
                        <WeekAccordion
                            key={wIdx}
                            week={week}
                            weekIdx={wIdx}
                            isExpanded={isExpanded}
                            onToggle={() => toggleWeek(wIdx)}
                            filterFn={filterFn}
                            showTeacher={!filters.teacher}
                            viewMode={viewMode}
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

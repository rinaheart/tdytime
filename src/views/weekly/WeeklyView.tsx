/**
 * WeeklyView — Full week schedule with horizontal table + vertical card modes.
 * Reads from Zustand store. Decomposed from old 418-line mono-view.
 */
/**
 * WeeklyView — Full week schedule with horizontal table + vertical card modes.
 * Reads from Zustand store. Decomposed from old 418-line mono-view.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useScheduleStore } from '@/core/stores';
import { FilterBar, EmptyState } from '@/ui';
import type { DaySchedule, WeekSchedule } from '@/core/schedule/schedule.types';
import { 
    getFilteredWeek, 
    isCurrentWeek,
    getCurrentWeekRange
} from '@/core/schedule/schedule.utils';
import { useScheduleFilter } from '@/core/hooks/useScheduleFilter';
import WeekNavigation from './WeekNavigation';
import WeekTableLayout from '../shared/WeekTableLayout';
import WeekCardLayout from '../shared/WeekCardLayout';

const WeeklyView: React.FC = () => {
    const { t } = useTranslation();
    const data = useScheduleStore((s) => s.data);
    const currentWeekIndex = useScheduleStore((s) => s.currentWeekIndex);
    const overrides = useScheduleStore((s) => s.overrides);
    const abbreviations = useScheduleStore((s) => s.abbreviations);

    const weeks = data?.weeks || [];
    const week: WeekSchedule | undefined = weeks[currentWeekIndex];

    const {
        filters, setFilters,
        isFilterOpen, toggleFilter,
        filterFn, hasActiveFilters,
        uniqueData, isAfterSemester, now
    } = useScheduleFilter(weeks, data?.metadata?.teacher || '');

    const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('horizontal');

    useEffect(() => { if (window.innerWidth < 768) setViewMode('vertical'); }, []);

    const isWeekEmpty = useMemo(() => {
        if (!week || currentWeekIndex === -1) return true;
        const teacherName = data?.metadata?.teacher || '';
        const main = teacherName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ths\.|ts\.|pgs\.|gs\.|gv\./g, '').trim();
        const checkTeacher = (tName: string) => {
            if (!tName || tName === 'Chưa rõ' || tName === 'Unknown') return true;
            const target = tName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ths\.|ts\.|pgs\.|gs\.|gv\./g, '').trim();
            return target.includes(main) || main.includes(target);
        };
        return !Object.values(week.days).some(d => {
            const day = d as DaySchedule;
            return [...day.morning, ...day.afternoon, ...day.evening].some(s => checkTeacher(s.teacher));
        });
    }, [week, data?.metadata?.teacher]);

    const weekRange = useMemo(() => {
        if (week) return week.dateRange;
        return getCurrentWeekRange(now);
    }, [week, now]);

    // Use getFilteredWeek to generate a week clone containing only visible sessions
    const { filteredWeek, hasSessions } = useMemo(() => {
        if (!week) return { filteredWeek: null, hasSessions: false, isChanged: false };
        return getFilteredWeek(week, filterFn);
    }, [week, filterFn]);

    const isCurrent = useMemo(() => {
        if (!week) return false;
        return isCurrentWeek(week.dateRange, now);
    }, [week, now]);

    // isWeekEmpty logic is about 'teacher metadata mismatch' early exit, but we also can consider hasSessions
    // actually, let's keep original isWeekEmpty logic for showing "no sessions this week" versus "no sessions match filter".
    // Wait, the new logic for `filteredWeek.hasSessions` means if it's false, and there are active filters = "No results found for filter".
    // If there's NO active filter and it's false = "No classes this week".

    if (!week && currentWeekIndex !== -1) return <div className="p-8 text-center text-slate-400">{t('weekly.noData')}</div>;

    return (
        <div className="pb-6 max-w-full animate-in fade-in duration-300 relative">
            <WeekNavigation
                viewMode={viewMode}
                onToggleViewMode={() => setViewMode((v) => (v === 'vertical' ? 'horizontal' : 'vertical'))}
                isFilterOpen={isFilterOpen}
                onToggleFilter={toggleFilter}
                hasActiveFilters={hasActiveFilters}
            />

            {isFilterOpen && (
                <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <FilterBar filters={filters} onChange={setFilters} uniqueRooms={uniqueData.rooms} uniqueTeachers={uniqueData.teachers} uniqueClasses={uniqueData.classes} />
                </div>
            )}

            {isAfterSemester ? (
                <EmptyState type="AFTER_SEMESTER" variant="weekly" />
            ) : isWeekEmpty ? (
                <EmptyState type="NO_SESSIONS" isWeekEmpty={true} currentWeekRange={weekRange} variant="weekly" />
            ) : !hasSessions && hasActiveFilters ? (
                /* Active filters returned zero sessions for this week */
                <EmptyState type="NO_SESSIONS" isWeekEmpty={true} currentWeekRange={weekRange} variant="weekly" />
            ) : (
                <div className={`transition-all duration-300 ${viewMode === 'vertical' ? 'max-w-4xl mx-auto' : 'max-w-full'}`}>
                    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isCurrent 
                        ? 'border-accent-500 dark:border-accent-400 ring-2 ring-accent-500/20 shadow-lg shadow-accent-500/5' 
                        : 'border-slate-200/60 dark:border-slate-800/60 shadow-sm'}`}>
                        
                        {viewMode === 'horizontal' ? (
                            /* ─── HORIZONTAL TABLE MODE ─────────────────────── */
                            <WeekTableLayout 
                                week={filteredWeek!} 
                                now={now} 
                                overrides={overrides!} 
                                abbreviations={abbreviations!} 
                                showTeacher={!filters.teacher} 
                                isCurrent={isCurrent}
                                fullBleed={true} // Add this prop to remove inner border
                            />
                        ) : (
                            /* ─── VERTICAL CARD MODE ───────────────────────── */
                            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50">
                                <WeekCardLayout 
                                    week={filteredWeek!} 
                                    now={now} 
                                    overrides={overrides!} 
                                    abbreviations={abbreviations!} 
                                    showTeacher={!filters.teacher} 
                                    isCurrent={isCurrent}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(WeeklyView);

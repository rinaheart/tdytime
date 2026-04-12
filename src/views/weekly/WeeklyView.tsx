import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useScheduleStore } from '@/core/stores/schedule.store';
import { FilterBar, EmptyState } from '@/ui';
import { isCurrentWeek } from '@/core/schedule/schedule.utils';
import { useScheduleFilter } from '@/core/hooks/useScheduleFilter';
import { useWeeklyData } from './useWeeklyData';
import WeekNavigation from './WeekNavigation';
import WeekTableLayout from '../shared/WeekTableLayout';
import WeekCardLayout from '../shared/WeekCardLayout';
import type { FlatSession } from '@/core/schedule/schedule.index';

const WeeklyView: React.FC = () => {
    const { t } = useTranslation();
    const currentWeekIndex = useScheduleStore((s) => s.currentWeekIndex);
    const abbreviations = useScheduleStore((s) => s.abbreviations);
    const teacherName = useScheduleStore((s) => s.data?.metadata?.teacher || '');
    
    const {
        filters, setFilters,
        isFilterOpen, toggleFilter,
        filterFn, hasActiveFilters,
        uniqueData, isAfterSemester, now
    } = useScheduleFilter(undefined, teacherName);

    const maxWeekIdx = useScheduleStore((s) => s.maxWeekIdx);

    // Optimized Data Logic for Weekly View
    // targetWeekIdx is currentWeekIndex + 1 (1-based)
    // We cast filterFn to accept FlatSession since createSessionFilter is compatible with CourseSession base
    const { grouped, hasSessions, weekRange } = useWeeklyData(
        currentWeekIndex + 1, 
        filterFn as (s: FlatSession) => boolean
    );

    const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('horizontal');

    useEffect(() => { if (window.innerWidth < 768) setViewMode('vertical'); }, []);

    const isCurrent = useMemo(() => {
        if (!weekRange) return false;
        return isCurrentWeek(weekRange, now);
    }, [weekRange, now]);

    // Check if the week itself has any teaching sessions for this teacher (not filter dependent)
    // This is used for the NO_SESSIONS vs EmptyState distinction
    const { total: totalUnfiltered } = useWeeklyData(currentWeekIndex + 1);
    const isWeekEmpty = totalUnfiltered === 0;

    if (currentWeekIndex === -1 && !hasSessions) {
        return <div className="p-8 text-center text-slate-400">{t('weekly.noData')}</div>;
    }

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
                    <FilterBar 
                        filters={filters} 
                        onChange={setFilters} 
                        uniqueRooms={uniqueData.rooms} 
                        uniqueTeachers={uniqueData.teachers} 
                        uniqueClasses={uniqueData.classes} 
                    />
                </div>
            )}

            {isAfterSemester && (currentWeekIndex + 1 > maxWeekIdx) ? (
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
                                grouped={grouped}
                                weekRange={weekRange}
                                now={now} 
                                abbreviations={abbreviations!} 
                                showTeacher={!filters.teacher} 
                                isCurrent={isCurrent}
                                fullBleed={true}
                            />
                        ) : (
                            /* ─── VERTICAL CARD MODE ───────────────────────── */
                            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50">
                                <WeekCardLayout 
                                    grouped={grouped}
                                    weekRange={weekRange}
                                    now={now} 
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

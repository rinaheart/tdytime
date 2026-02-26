/**
 * WeeklyView — Full week schedule with horizontal table + vertical card modes.
 * Reads from Zustand store. Decomposed from old 418-line mono-view.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { useScheduleStore } from '@/core/stores';
import { SessionCard, FilterBar, EmptyState } from '@/ui';
import { DAYS_OF_WEEK } from '@/core/constants';
import type { CourseSession, DaySchedule, WeekSchedule } from '@/core/schedule/schedule.types';
import { getDayDateString, isCurrentWeek, createSessionFilter, parseDateFromRange, getCurrentWeekRange } from '@/core/schedule/schedule.utils';
import type { FilterState } from '@/core/schedule/schedule.utils';
import WeekNavigation from './WeekNavigation';

const WeeklyView: React.FC = () => {
    const { t } = useTranslation();
    const data = useScheduleStore((s) => s.data);
    const currentWeekIndex = useScheduleStore((s) => s.currentWeekIndex);
    const overrides = useScheduleStore((s) => s.overrides);
    const abbreviations = useScheduleStore((s) => s.abbreviations);

    const weeks = data?.weeks || [];
    const week: WeekSchedule | undefined = weeks[currentWeekIndex];

    const [filters, setFilters] = useState<FilterState>({
        search: '', className: '', room: '', teacher: data?.metadata?.teacher || '', sessionTime: '',
    });
    const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('horizontal');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => { if (window.innerWidth < 768) setViewMode('vertical'); }, []);

    const now = useMemo(() => new Date(), []);
    const isCurrentWeekDisplayed = week ? isCurrentWeek(week.dateRange, now) : false;

    const filterFn = useMemo(() => createSessionFilter(filters), [filters]);

    const hasActiveFilters = useMemo(
        () => filters.search !== '' || filters.className !== '' || filters.room !== '' || (filters.teacher !== '' && filters.teacher !== data?.metadata?.teacher),
        [filters, data?.metadata?.teacher]
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

    // Check if the semester is completely over
    const isAfterSemester = useMemo(() => {
        if (weeks.length === 0) return false;
        const endDate = parseDateFromRange(weeks[weeks.length - 1].dateRange, 'end');
        if (!endDate) return false;
        const today = new Date(now); today.setHours(0, 0, 0, 0);
        return today > endDate;
    }, [weeks, now]);

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

    const isDayToday = (dayIdx: number) => {
        if (!week || !isCurrentWeekDisplayed || currentWeekIndex === -1) return false;
        const dayDate = getDayDateString(week.dateRange, dayIdx);
        const today = new Date();
        const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
        return dayDate === todayStr;
    };

    const weekRange = useMemo(() => {
        if (week) return week.dateRange;
        return getCurrentWeekRange(now);
    }, [week, now]);

    const renderSessionCell = (sessions: CourseSession[], _dayIdx: number, isVertical = false) => {
        const filtered = sessions.filter(filterFn);
        if (filtered.length === 0) return isVertical ? <div className="text-[10px] text-slate-300 dark:text-slate-700 italic">{t('weekly.noClasses')}</div> : null;
        return (
            <div className={`flex flex-col gap-1.5 h-full ${isVertical ? 'w-full' : ''}`}>
                {filtered.map((session, sidx) => (
                    <SessionCard key={`${session.courseCode}-${session.timeSlot}-${sidx}`} session={session} variant="weekly" overrides={overrides} abbreviations={abbreviations} showTeacher={!filters.teacher} />
                ))}
            </div>
        );
    };

    if (!week && currentWeekIndex !== -1) return <div className="p-8 text-center text-slate-400">{t('weekly.noData')}</div>;

    return (
        <div className="pb-6 max-w-full animate-in fade-in duration-300 relative">
            <WeekNavigation
                viewMode={viewMode}
                onToggleViewMode={() => setViewMode((v) => (v === 'vertical' ? 'horizontal' : 'vertical'))}
                isFilterOpen={isFilterOpen}
                onToggleFilter={() => setIsFilterOpen((v) => !v)}
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
            ) : viewMode === 'horizontal' ? (
                /* ─── HORIZONTAL TABLE MODE ─────────────────────── */
                <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none md:hidden animate-pulse">
                        <div className="bg-blue-600/20 text-blue-600 p-2 rounded-full backdrop-blur-sm"><ChevronRight size={20} /></div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto w-full custom-scrollbar touch-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                            <div className="min-w-[1024px]">
                                <table className="w-full border-collapse border-hidden">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                            <th className="w-14 p-4 border border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/50 dark:bg-slate-800/80 sticky left-0 z-20 backdrop-blur-md" />
                                            {DAYS_OF_WEEK.map((day, idx) => {
                                                const isToday = isDayToday(idx);
                                                return (
                                                    <th key={day} className={`min-w-[140px] p-3 border border-slate-100 dark:border-slate-800 text-center transition-all ${isToday ? 'bg-blue-600 dark:bg-blue-600 z-10 relative ring-2 ring-blue-400 dark:ring-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]' : ''}`}>
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            {isToday && <span className="text-[8px] font-black text-white/80 uppercase tracking-widest mb-0.5">{t('weekly.today')}</span>}
                                                            <p className={`text-[11px] font-black uppercase tracking-widest ${isToday ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>{t(`days.${idx}`)}</p>
                                                            <p className={`text-xs font-num font-bold ${isToday ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>{getDayDateString(week.dateRange, idx)}</p>
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {([
                                            { key: 'morning', label: 'S', fullLabel: t('weekly.morning') },
                                            { key: 'afternoon', label: 'C', fullLabel: t('weekly.afternoon') },
                                            { key: 'evening', label: 'T', fullLabel: t('weekly.evening') },
                                        ] as const).map((shift) => (
                                            <tr key={shift.key} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                                                <td className="p-4 border border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-800/80 align-middle sticky left-0 z-20 backdrop-blur-md shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-blue-500/20">{shift.label}</span>
                                                </td>
                                                {DAYS_OF_WEEK.map((day, dayIdx) => {
                                                    const isToday = isDayToday(dayIdx);
                                                    return (
                                                        <td key={`${day}-${shift.key}`} className={`p-2 border border-slate-100 dark:border-slate-800 align-top min-h-[160px] transition-colors ${isToday ? 'bg-blue-50/40 dark:bg-blue-900/10 border-x-blue-200/50 dark:border-x-blue-800/50' : ''}`}>
                                                            <div className="h-full">{week.days[day] && renderSessionCell(week.days[day][shift.key as keyof DaySchedule], dayIdx)}</div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ─── VERTICAL CARD MODE ───────────────────────── */
                <div className="grid grid-cols-1 gap-6">
                    {DAYS_OF_WEEK.map((day, idx) => {
                        const dayData = week.days[day];
                        if (!dayData) return null;
                        const sessions = [...dayData.morning, ...dayData.afternoon, ...dayData.evening];
                        if (sessions.length === 0) return null;
                        const hasAny = sessions.some(filterFn);
                        const isToday = isDayToday(idx);
                        if (!hasAny && (filters.search || filters.className || filters.room || filters.teacher)) return null;

                        return (
                            <div key={day} className={`bg-white dark:bg-slate-900 rounded-xl border ${isToday ? 'border-blue-400 dark:border-blue-500 ring-4 ring-blue-100/50 dark:ring-blue-900/20' : 'border-slate-200/60 dark:border-slate-800/60'} shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md relative group`}>
                                <div className={`md:w-32 ${isToday ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800/30'} p-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 transition-colors`}>
                                    {isToday && <span className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-80">{t('weekly.today')}</span>}
                                    <p className={`text-xs font-black uppercase tracking-widest ${isToday ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}>{t(`days.${idx}`)}</p>
                                    <p className={`text-sm font-black mt-1 font-num ${isToday ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>{getDayDateString(week.dateRange, idx)}</p>
                                </div>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
                                    {(['morning', 'afternoon', 'evening'] as const).map((shift) => (
                                        <div key={shift} className={`p-3 ${isToday ? 'bg-blue-50/10 dark:bg-blue-900/5' : ''}`}>
                                            <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2 flex items-center justify-between">
                                                {t(`weekly.${shift}`)}
                                                <span className="font-num opacity-60">{shift === 'morning' ? '07:00' : shift === 'afternoon' ? '13:30' : '17:10'}</span>
                                            </div>
                                            {renderSessionCell(dayData[shift], idx, true)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default React.memo(WeeklyView);

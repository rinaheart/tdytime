/**
 * WeekAccordion — Collapsible week section for SemesterView.
 * Used in both vertical (timeline) and horizontal (table) modes.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { useScheduleStore } from '@/core/stores';
import { SessionCard } from '@/ui';
import { DAYS_OF_WEEK } from '@/core/constants';
import type { WeekSchedule, DaySchedule, CourseSession } from '@/core/schedule/schedule.types';
import { getDayDateString, isCurrentWeek as checkIsCurrentWeek, isPastWeek as checkIsPastWeek, isDayToday } from '@/core/schedule/schedule.utils';

interface WeekAccordionProps {
    week: WeekSchedule;
    weekIdx: number;
    isExpanded: boolean;
    onToggle: () => void;
    filterFn: (s: CourseSession) => boolean;
    showTeacher: boolean;
    viewMode: 'horizontal' | 'vertical';
}

const formatDateRange = (range: string) => {
    const dates = range.match(/\d{2}\/\d{2}\/\d{4}/g);
    if (dates && dates.length >= 2) return `${dates[0]} → ${dates[1]}`;
    return range;
};

const WeekAccordion: React.FC<WeekAccordionProps> = ({ week, weekIdx, isExpanded, onToggle, filterFn, showTeacher, viewMode }) => {
    const { t } = useTranslation();
    const overrides = useScheduleStore((s) => s.overrides);
    const abbreviations = useScheduleStore((s) => s.abbreviations);

    const now = React.useMemo(() => new Date(), []);
    const isCurrent = checkIsCurrentWeek(week.dateRange, now);
    const isPast = checkIsPastWeek(week.dateRange, now);

    if (viewMode === 'vertical') {
        return (
            <div
                id={`week-card-${weekIdx}`}
                className={`relative z-10 bg-white dark:bg-slate-900 rounded-2xl border ${isCurrent ? 'border-accent-500 dark:border-accent-500 ring-2 ring-accent-500/20 shadow-sm' : 'border-slate-200/60 dark:border-slate-800/60 shadow-sm'} overflow-hidden transition-all duration-300`}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '100px 500px' }}
            >
                {/* Timeline dot */}
                <div className={`absolute left-4 md:left-[20px] top-6 w-2 h-2 rounded-full z-20 ${isCurrent ? 'bg-accent-500 ring-4 ring-accent-100 dark:ring-accent-900/40' : isPast ? 'bg-slate-300 dark:bg-slate-700' : 'bg-slate-200 dark:bg-slate-800'}`} />

                {/* Header */}
                <button onClick={onToggle} className={`w-full flex items-center justify-between p-3 md:p-4 text-left transition-colors ${isExpanded ? 'bg-slate-50/50 dark:bg-slate-800/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/20'}`}>
                    <div className="flex items-center gap-4 pl-6 md:pl-8">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black text-lg md:text-xl shadow-sm tracking-tighter shrink-0 ${isCurrent ? 'bg-accent-600 text-white shadow-accent-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                            {week.weekNumber}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h4 className={`text-base md:text-lg font-black uppercase tracking-tight leading-none ${isCurrent ? 'text-accent-600 dark:text-accent-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                    {t('weekly.week', { number: week.weekNumber })}
                                </h4>
                                {isCurrent && <span className="px-1.5 py-0.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 text-[8px] font-black uppercase tracking-widest animate-pulse">{t('common.current')}</span>}
                            </div>
                            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-num font-bold tracking-tight">{formatDateRange(week.dateRange)}</p>
                        </div>
                    </div>
                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={20} className="text-slate-300 dark:text-slate-600" />
                    </div>
                </button>

                {/* Expanded content — day columns */}
                {isExpanded && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-3 md:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 md:gap-6 relative z-10 border-t border-slate-100 dark:border-slate-800/60 pl-8 md:pl-12">
                            {DAYS_OF_WEEK.map((dayName, dIdx) => {
                                const day = week.days[dayName];
                                const hasAnySessions = [...day.morning, ...day.afternoon, ...day.evening].some(filterFn);
                                if (!hasAnySessions) return null;
                                const isToday = isCurrent && isDayToday(week.dateRange, dIdx, now);
                                return (
                                    <div key={dayName} className={`min-h-[100px] flex flex-col group border-l-2 md:border-l-0 border-slate-100 dark:border-slate-800 md:border-transparent md:hover:border-slate-100 md:dark:hover:border-slate-800 pl-3 md:pl-2 transition-all p-2 rounded-xl ${isToday ? 'bg-accent-50/40 dark:bg-accent-900/10 border-l border-l-accent-400 dark:border-l-accent-500' : ''}`}>
                                        <div className="mb-3 pb-1.5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center sm:flex-col sm:items-center">
                                            <div className="flex flex-col items-start sm:items-center gap-0.5">
                                                {isToday && <span className="text-[8px] font-black text-accent-600 dark:text-accent-400 uppercase tracking-widest">{t('weekly.today')}</span>}
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-accent-600 dark:text-accent-400' : 'text-slate-400 dark:text-slate-500'}`}>{t(`days.${dIdx}`)}</span>
                                            </div>
                                            <span className={`text-[10px] md:text-[11px] font-black tracking-tighter ${isToday ? 'text-accent-700 dark:text-accent-300' : 'text-slate-500 dark:text-slate-400'}`}>{getDayDateString(week.dateRange, dIdx)}</span>
                                        </div>
                                        <div className="space-y-3 flex-1">
                                            {(['morning', 'afternoon', 'evening'] as const).map((shift) => {
                                                const sessions = day[shift].filter(filterFn);
                                                if (sessions.length === 0) return null;
                                                return (
                                                    <div key={shift} className="flex flex-col gap-1.5">
                                                        <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase flex items-center justify-between">
                                                            {t(`weekly.${shift}`)}
                                                            <span className="font-num opacity-60">{shift === 'morning' ? '07:00' : shift === 'afternoon' ? '13:30' : '17:10'}</span>
                                                        </div>
                                                        {sessions.map((s, sidx) => (
                                                            <SessionCard key={`${s.courseCode}-${s.timeSlot}-${sidx}`} session={s} variant="weekly" overrides={overrides} abbreviations={abbreviations} showTeacher={showTeacher} />
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── HORIZONTAL TABLE MODE ───
    return (
        <div id={`week-card-${weekIdx}`} className="relative" style={{ contentVisibility: 'auto', containIntrinsicSize: '1024px 500px' }}>
            <button onClick={onToggle} className="w-full flex items-center justify-between mb-4 pl-2 text-left group/header">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-all ${isCurrent ? 'bg-accent-600 text-white shadow-lg shadow-accent-500/30 ring-2 ring-accent-100 dark:ring-accent-900/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover/header:bg-slate-200 dark:group-hover/header:bg-slate-700'}`}>
                        {week.weekNumber}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-black uppercase tracking-tight ${isCurrent ? 'text-accent-600 dark:text-accent-400' : 'text-slate-800 dark:text-slate-100 group-hover/header:text-accent-600'}`}>
                                {t('weekly.week', { number: week.weekNumber })}
                            </h4>
                            {isCurrent && <span className="px-1.5 py-0.5 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 text-[8px] font-black uppercase tracking-[0.15em] animate-pulse">{t('common.current')}</span>}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-num font-bold">{formatDateRange(week.dateRange)}</p>
                    </div>
                </div>
                <div className={`mr-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown size={18} className="text-slate-300 dark:text-slate-600" />
                </div>
            </button>

            {isExpanded && (
                <div className={`relative z-10 bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 overflow-hidden animate-in fade-in zoom-in-95 ${isCurrent ? 'border-accent-500 dark:border-accent-500 ring-2 ring-accent-500/20 shadow-sm' : 'border-slate-200/60 dark:border-slate-800/60 shadow-sm'}`}>
                    <div className="overflow-x-auto w-full custom-scrollbar touch-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <div className="min-w-[1024px]">
                            <table className="w-full border-collapse border-hidden">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                        <th className="w-14 p-4 border-b border-r border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900 sticky left-0 z-20" />
                                        {DAYS_OF_WEEK.map((dayName, dIdx) => {
                                            const isToday = isCurrent && isDayToday(week.dateRange, dIdx, now);
                                            return (
                                                <th key={dayName} className={`min-w-[140px] p-3 border border-slate-100 dark:border-slate-800 text-center transition-all ${isToday ? 'bg-accent-600 dark:bg-accent-600 z-10 relative ring-2 ring-accent-400 dark:ring-accent-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]' : ''}`}>
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        {isToday && <span className="text-[8px] font-black text-white/80 uppercase tracking-widest mb-0.5">{t('weekly.today')}</span>}
                                                        <p className={`text-[11px] font-black uppercase tracking-widest ${isToday ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>{t(`days.${dIdx}`)}</p>
                                                        <p className={`text-xs font-num font-bold ${isToday ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>{getDayDateString(week.dateRange, dIdx)}</p>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {([
                                        { key: 'morning', label: 'S', colorClass: 'bg-accent-400 shadow-accent-400/20' },
                                        { key: 'afternoon', label: 'C', colorClass: 'bg-accent-600 shadow-accent-600/20' },
                                        { key: 'evening', label: 'T', colorClass: 'bg-accent-800 dark:bg-accent-700 shadow-accent-800/20' },
                                    ] as const).map((shift) => (
                                        <tr key={shift.key} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                                            <td className="p-4 border-b border-r border-slate-100 dark:border-slate-800 text-center flex items-center justify-center bg-white dark:bg-slate-900 align-middle sticky left-0 z-20 shadow-[2px_0_8px_rgba(0,0,0,0.03)] h-[160px]">
                                                <span className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-black mx-auto shadow-lg ${shift.colorClass}`}>{shift.label}</span>
                                            </td>
                                            {DAYS_OF_WEEK.map((dayName, dIdx) => {
                                                const dayData = week.days[dayName];
                                                const sessions = dayData[shift.key as keyof DaySchedule].filter(filterFn);
                                                const isToday = isCurrent && isDayToday(week.dateRange, dIdx, now);
                                                return (
                                                    <td key={`${week.dateRange}-${dayName}-${shift.key}`} className={`p-2 border border-slate-100 dark:border-slate-800 align-top min-h-[160px] transition-colors ${isToday ? 'bg-accent-50/40 dark:bg-accent-900/10 border-x-accent-200/50 dark:border-x-accent-800/50' : ''}`}>
                                                        <div className="flex flex-col gap-1.5 h-full">
                                                            {sessions.map((s, sidx) => (
                                                                <SessionCard key={`${s.courseCode}-${s.timeSlot}-${sidx}`} session={s} variant="weekly" overrides={overrides} abbreviations={abbreviations} showTeacher={showTeacher} />
                                                            ))}
                                                        </div>
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
            )}
        </div>
    );
};

export default React.memo(WeekAccordion);

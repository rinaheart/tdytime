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
import { getDayDateString, isCurrentWeek as checkIsCurrentWeek, isPastWeek as checkIsPastWeek } from '@/core/schedule/schedule.utils';

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
                className={`relative z-10 bg-white dark:bg-slate-950/40 rounded-xl border ${isCurrent ? 'border-blue-400 dark:border-blue-500 ring-4 ring-blue-100/50 dark:ring-blue-900/20 shadow-lg shadow-blue-500/10' : 'border-slate-200/60 dark:border-slate-800/60 shadow-sm'} overflow-hidden transition-all duration-300`}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '100px 500px' }}
            >
                {/* Timeline dot */}
                <div className={`absolute left-4 md:left-[20px] top-6 w-2 h-2 rounded-full z-20 ${isCurrent ? 'bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/40' : isPast ? 'bg-slate-300 dark:bg-slate-700' : 'bg-slate-200 dark:bg-slate-800'}`} />

                {/* Header */}
                <button onClick={onToggle} className={`w-full flex items-center justify-between p-3 md:p-4 text-left transition-colors ${isExpanded ? 'bg-slate-50/50 dark:bg-slate-800/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/20'}`}>
                    <div className="flex items-center gap-4 pl-6 md:pl-8">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center font-black text-lg md:text-xl shadow-sm tracking-tighter shrink-0 ${isCurrent ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                            {week.weekNumber}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h4 className={`text-base md:text-lg font-black uppercase tracking-tight leading-none ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                    {t('weekly.week', { number: week.weekNumber })}
                                </h4>
                                {isCurrent && <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase tracking-widest animate-pulse">{t('common.current')}</span>}
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
                                const sessions = [...day.morning, ...day.afternoon, ...day.evening].filter(filterFn);
                                if (sessions.length === 0) return null;
                                return (
                                    <div key={dayName} className="min-h-[100px] flex flex-col group border-l-2 border-slate-100 dark:border-slate-800 md:border-transparent md:hover:border-slate-100 md:dark:hover:border-slate-800 pl-3 md:pl-2 transition-all">
                                        <div className="mb-3 pb-1.5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center sm:flex-col sm:items-center">
                                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{t(`days.${dIdx}`)}</span>
                                            <span className="text-[10px] md:text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-tighter">{getDayDateString(week.dateRange, dIdx)}</span>
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            {sessions.map((s, sidx) => (
                                                <SessionCard key={`${s.courseCode}-${s.timeSlot}-${sidx}`} session={s} variant="weekly" overrides={overrides} abbreviations={abbreviations} showTeacher={showTeacher} />
                                            ))}
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
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-all ${isCurrent ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-100 dark:ring-blue-900/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover/header:bg-slate-200 dark:group-hover/header:bg-slate-700'}`}>
                        {week.weekNumber}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-black uppercase tracking-tight ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100 group-hover/header:text-blue-600'}`}>
                                {t('weekly.week', { number: week.weekNumber })}
                            </h4>
                            {isCurrent && <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase tracking-[0.15em] animate-pulse">{t('common.current')}</span>}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-num font-bold">{formatDateRange(week.dateRange)}</p>
                    </div>
                </div>
                <div className={`mr-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown size={18} className="text-slate-300 dark:text-slate-600" />
                </div>
            </button>

            {isExpanded && (
                <div className={`bg-white dark:bg-slate-900 rounded-xl border transition-all duration-500 overflow-hidden animate-in fade-in zoom-in-95 ${isCurrent ? 'border-blue-400 dark:border-blue-500 ring-4 ring-blue-100/50 dark:ring-blue-900/20 shadow-xl shadow-blue-500/10' : 'border-slate-200 dark:border-slate-800 shadow-xl'}`}>
                    <div className="overflow-x-auto w-full custom-scrollbar touch-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <div className="min-w-[1024px]">
                            <table className="w-full border-collapse border-hidden">
                                <thead>
                                    <tr className={`transition-colors ${isCurrent ? 'bg-blue-50/30 dark:bg-blue-950/20' : 'bg-slate-50/50 dark:bg-slate-800/50'}`}>
                                        <th className={`w-14 p-4 border border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest sticky left-0 z-20 backdrop-blur-md ${isCurrent ? 'text-blue-600 bg-blue-100/40 dark:bg-blue-900/40' : 'text-slate-400 bg-slate-100/50 dark:bg-slate-800/80'}`} />
                                        {DAYS_OF_WEEK.map((dayName, dIdx) => (
                                            <th key={dayName} className={`min-w-[140px] p-4 border border-slate-100 dark:border-slate-800 text-center ${isCurrent ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''}`}>
                                                <p className={`text-[11px] font-black uppercase tracking-widest ${isCurrent ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'}`}>{t(`days.${dIdx}`)}</p>
                                                <p className={`text-xs font-num font-bold ${isCurrent ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>{getDayDateString(week.dateRange, dIdx)}</p>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {(['morning', 'afternoon', 'evening'] as const).map((shift) => {
                                        const label = shift === 'morning' ? 'S' : shift === 'afternoon' ? 'C' : 'T';
                                        return (
                                            <tr key={shift} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                                                <td className={`p-4 border border-slate-100 dark:border-slate-800 text-center align-middle sticky left-0 z-20 backdrop-blur-md shadow-[2px_0_5px_rgba(0,0,0,0.02)] ${isCurrent ? 'bg-blue-100/40 dark:bg-blue-900/40' : 'bg-slate-50/50 dark:bg-slate-800/80'}`}>
                                                    <span className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-black mx-auto shadow-lg ${isCurrent ? 'bg-blue-700 shadow-blue-500/30' : 'bg-blue-600 shadow-blue-500/20'}`}>{label}</span>
                                                </td>
                                                {DAYS_OF_WEEK.map((dayName) => {
                                                    const dayData = week.days[dayName];
                                                    const sessions = dayData[shift as keyof DaySchedule].filter(filterFn);
                                                    return (
                                                        <td key={`${dayName}-${shift}`} className={`p-3 border border-slate-100 dark:border-slate-800 align-top min-h-[160px] ${isCurrent ? 'bg-blue-50/10 dark:bg-blue-900/5' : ''}`}>
                                                            <div className="space-y-2 h-full">
                                                                {sessions.map((s, sidx) => (
                                                                    <SessionCard key={`${s.courseCode}-${s.timeSlot}-${sidx}`} session={s} variant="weekly" overrides={overrides} abbreviations={abbreviations} showTeacher={showTeacher} />
                                                                ))}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
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

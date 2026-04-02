import React from 'react';
import { useTranslation } from 'react-i18next';
import SessionCard from '@/views/shared/SessionCard';
import { DAYS_OF_WEEK } from '@/core/constants';
import type { WeekSchedule, DaySchedule, CourseType, CourseSession } from '@/core/schedule/schedule.types';
import { getDayDateString, isDayToday as checkIsDayToday } from '@/core/schedule/schedule.utils';

export interface WeekTableLayoutProps {
    week: WeekSchedule;
    now: Date;
    abbreviations?: Record<string, string>;
    showTeacher?: boolean;
    isCurrent?: boolean;
    fullBleed?: boolean;
}

const WeekTableLayout: React.FC<WeekTableLayoutProps> = ({ 
    week, now, abbreviations, showTeacher, isCurrent = true, fullBleed = false 
}) => {
    const { t } = useTranslation();

    const isDayToday = (dayIdx: number) => checkIsDayToday(week.dateRange, dayIdx, now);

    // Filter Sunday sessions to check if empty
    const hasSundaySessions = (Object.values(week.days['Sunday'] || {}) as any[][]).some(
        (sessions) => sessions.length > 0
    );

    // Helper: Width calculation for columns (Mon-Sun)
    const getColStyle = (idx: number) => {
        const isSunday = idx === 6;
        const sunWidth = hasSundaySessions ? '14.28%' : '80px';
        const othersWidth = hasSundaySessions ? '14.28%' : 'calc((100% - 128px) / 6)';
        
        return {
            width: isSunday ? sunWidth : othersWidth,
            minWidth: isSunday && !hasSundaySessions ? '80px' : '130px'
        };
    };

    return (
        <div className={`bg-white dark:bg-slate-900 overflow-hidden transition-all duration-300 ${fullBleed 
            ? 'border-0 ring-0 shadow-none rounded-none' 
            : `rounded-2xl border ${isCurrent 
                ? 'border-accent-500 dark:border-accent-400 ring-2 ring-accent-500/20 shadow-lg shadow-accent-500/5' 
                : 'border-slate-200/60 dark:border-slate-800/60 shadow-sm'}`}`}>
            <div className="overflow-x-auto w-full custom-scrollbar touch-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="min-w-[1000px]">
                    <table className="w-full border-collapse border-hidden table-fixed">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="w-12 p-2 border-b border-r border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900 sticky left-0 z-20" />
                                {DAYS_OF_WEEK.map((day, idx) => {
                                    const isToday = isDayToday(idx);
                                    const colStyle = getColStyle(idx);

                                    return (
                                        <th 
                                            key={`${week.dateRange}-${day}`} 
                                            style={colStyle}
                                            className={`p-3 border border-slate-100 dark:border-slate-800 text-center transition-all ${isToday ? 'bg-accent-600 dark:bg-accent-600 z-10 relative ring-2 ring-accent-400 dark:ring-accent-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]' : ''}`}
                                        >
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
                                { key: 'morning', label: 'S', fullLabel: t('weekly.morning'), from: 'var(--semantic-morning-from)', to: 'var(--semantic-morning-to)' },
                                { key: 'afternoon', label: 'C', fullLabel: t('weekly.afternoon'), from: 'var(--semantic-afternoon-from)', to: 'var(--semantic-afternoon-to)' },
                                { key: 'evening', label: 'T', fullLabel: t('weekly.evening'), from: 'var(--semantic-evening-from)', to: 'var(--semantic-evening-to)' },
                            ] as const).map((shift) => (
                                <tr key={shift.key} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                                    <td className="w-12 p-2 border-b border-r border-slate-100 dark:border-slate-800 text-center bg-white dark:bg-slate-900 align-middle sticky left-0 z-20 shadow-[2px_0_8px_rgba(0,0,0,0.03)]">
                                        <span 
                                            className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-black shadow-lg mx-auto"
                                            style={{ background: `linear-gradient(to bottom right, ${shift.from}, ${shift.to})` }}
                                        >
                                            {shift.label}
                                        </span>
                                    </td>
                                    {DAYS_OF_WEEK.map((day, dayIdx) => {
                                        const isToday = isDayToday(dayIdx);
                                        const shiftSessions = week.days[day as keyof typeof week.days]?.[shift.key as keyof DaySchedule] || [];
                                        const colStyle = getColStyle(dayIdx);
                                        
                                        return (
                                            <td 
                                                key={`${week.dateRange}-${day}-${shift.key}`} 
                                                style={colStyle}
                                                className={`p-2 border border-slate-100 dark:border-slate-800 align-top min-h-[160px] min-w-0 w-0 relative overflow-hidden transition-colors ${isToday ? 'bg-accent-50/40 dark:bg-accent-900/10 border-x-accent-200/50 dark:border-x-accent-800/50 relative z-10' : ''}`}
                                            >
                                                <div className="h-full flex flex-col gap-1.5 w-full min-w-0">
                                                    {shiftSessions.map((session: CourseSession, sidx: number) => (
                                                        <div key={`${session.courseCode}-${session.timeSlot}-${sidx}`} className="flex-1 flex min-w-0">
                                                            <SessionCard session={session} variant="weekly" abbreviations={abbreviations} showTeacher={showTeacher} className="flex-1" />
                                                        </div>
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
    );
};

export default React.memo(WeekTableLayout);

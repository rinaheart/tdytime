import React from 'react';
import { useTranslation } from 'react-i18next';
import SessionCard from '@/views/shared/SessionCard';
import { DAYS_OF_WEEK } from '@/core/constants';
import { getDayDateString, isDayToday as checkIsDayToday } from '@/core/schedule/schedule.utils';
import type { FlatSession } from '@/core/schedule/schedule.index';
import type { WeekTableLayoutProps } from './WeekTableLayout';

const WeekCardLayout: React.FC<WeekTableLayoutProps> = ({ grouped, weekRange, now, abbreviations, showTeacher }) => {
    const { t } = useTranslation();

    const isDayToday = (dayIdx: number) => {
        if (!weekRange) return false;
        return checkIsDayToday(weekRange, dayIdx, now);
    };

    return (
        <div className="grid grid-cols-1 gap-6">
            {DAYS_OF_WEEK.map((day, idx) => {
                const dayGroup = grouped[idx];
                if (!dayGroup) return null;
                
                const sessions = [...dayGroup.morning, ...dayGroup.afternoon, ...dayGroup.evening, ...dayGroup.night];
                if (sessions.length === 0) return null;
                
                const isToday = isDayToday(idx);

                return (
                    <div key={`${weekRange}-${day}`} className={`bg-white dark:bg-slate-900 rounded-2xl border ${isToday ? 'border-accent-400 dark:border-accent-500 ring-4 ring-accent-100/50 dark:ring-accent-900/20' : 'border-slate-200/60 dark:border-slate-800/60'} shadow-sm flex flex-col md:flex-row transition-all hover:shadow-md relative group`}>
                        <div className={`md:w-32 shrink-0 ${isToday ? 'bg-accent-600 text-white' : 'bg-slate-50 dark:bg-slate-800/30'} p-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 transition-colors rounded-t-2xl md:rounded-t-none md:rounded-l-2xl`}>
                            {isToday && <span className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-80">{t('weekly.today')}</span>}
                            <p className={`text-xs font-black uppercase tracking-widest ${isToday ? 'text-white' : 'text-accent-600 dark:text-accent-400'}`}>{t(`days.${idx}`)}</p>
                            <p className={`text-sm font-black mt-1 font-num ${isToday ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>{weekRange ? getDayDateString(weekRange, idx) : '—'}</p>
                        </div>
                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
                            {(['morning', 'afternoon', 'evening'] as const).map((shift) => {
                                const shiftSessions = dayGroup[shift] || [];
                                
                                return (
                                <div key={shift} className={`p-3 min-w-0 ${isToday ? 'bg-accent-50/10 dark:bg-accent-900/5' : ''}`}>
                                    <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <span 
                                                className="w-1.5 h-1.5 rounded-full" 
                                                style={{ background: `linear-gradient(to right, var(--semantic-${shift}-from), var(--semantic-${shift}-to))` }}
                                            />
                                            {t(`weekly.${shift}`)}
                                        </div>
                                        <span className="font-num opacity-60">{shift === 'morning' ? '07:00' : shift === 'afternoon' ? '13:30' : '17:10'}</span>
                                    </div>
                                    {shiftSessions.length === 0 ? (
                                        <div className="text-[10px] text-slate-300 dark:text-slate-700 italic">{t('weekly.noClasses')}</div>
                                    ) : (
                                        <div className="flex flex-col gap-1.5 w-full">
                                            {shiftSessions.map((session: FlatSession) => (
                                                <div key={session.id}>
                                                    <SessionCard session={session} variant="weekly" abbreviations={abbreviations} showTeacher={showTeacher} className="w-full" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )})}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default React.memo(WeekCardLayout);

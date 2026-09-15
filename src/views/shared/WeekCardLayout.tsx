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

    // The shared dense override for SessionCard
    // - Removes min-h-[2.4em] from the title (h3)
    // - Reduces mb-1.5 on title to mb-1
    // - Removes mt-auto from the footer
    const denseCardOverride = "[&_h3]:!min-h-0 [&_h3]:!mb-0.5 [&>div:last-child]:!mt-1 !mb-0 !rounded-none !border-0 !shadow-none hover:bg-slate-100/50 dark:hover:bg-slate-800";

    return (
        <div id="weekly-schedule-table" className="flex flex-col gap-5 p-4 bg-slate-50/50 dark:bg-slate-950">
            {DAYS_OF_WEEK.map((day, idx) => {
                const dayGroup = grouped[idx];
                if (!dayGroup) return null;
                const sessions = [...dayGroup.morning, ...dayGroup.afternoon, ...dayGroup.evening, ...dayGroup.night];
                if (sessions.length === 0) return null;
                
                const isToday = isDayToday(idx);

                return (
                    <div key={`${weekRange}-${day}`} className={`rounded-2xl overflow-hidden shadow-sm border ${isToday ? 'border-accent-200 dark:border-accent-800 ring-1 ring-accent-500/10' : 'border-slate-200/80 dark:border-slate-800'}`}>
                        {/* Header Banner */}
                        <div className={`px-3.5 py-2 flex items-center justify-between ${isToday ? 'bg-accent-100/50 dark:bg-accent-900/40' : 'bg-slate-100 dark:bg-slate-900'}`}>
                            <div className="flex items-baseline gap-2">
                                <h3 className={`text-sm font-black uppercase tracking-wider ${isToday ? 'text-accent-700 dark:text-accent-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {t(`days.${idx}`)}
                                </h3>
                                <span className={`text-xs font-medium font-num ${isToday ? 'text-accent-600 dark:text-accent-500' : 'text-slate-500'}`}>
                                    {weekRange ? getDayDateString(weekRange, idx) : ''}
                                </span>
                            </div>
                            {isToday && <div className="text-[10px] font-black text-white bg-accent-600 px-2 py-0.5 rounded-full uppercase">Today</div>}
                        </div>
                        {/* Sessions List - Compact Padding & Divide & Zebra */}
                        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
                            {sessions.map((session: FlatSession, sIdx: number) => (
                                <div key={session.id} className={sIdx % 2 !== 0 ? 'bg-slate-50 dark:bg-slate-900/60' : 'bg-white dark:bg-slate-950'}>
                                    <SessionCard 
                                        session={session} variant="weekly" abbreviations={abbreviations} showTeacher={showTeacher} 
                                        className={`${denseCardOverride} !px-3.5 !py-2.5 !bg-transparent`} 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default React.memo(WeekCardLayout);

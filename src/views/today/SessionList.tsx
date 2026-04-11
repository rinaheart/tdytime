/**
 * SessionList — Today's session cards with status grouping.
 * Active sessions (LIVE/PENDING) shown as full cards,
 * completed sessions consolidated into a compact list.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import SessionCard from '@/views/shared/SessionCard';
import { useScheduleStore } from '@/core/stores';
import { formatClassDisplay } from '@/core/schedule/schedule.utils';
import type { SessionWithStatus } from './today.types';

interface SessionListProps {
    sessions: SessionWithStatus[];
}

const SessionList: React.FC<SessionListProps> = ({ sessions }) => {
    const { t } = useTranslation();
    const abbreviations = useScheduleStore((s) => s.abbreviations);

    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');
    const activeSessions = sessions.filter((s) => s.status !== 'COMPLETED');

    const pendingCount = sessions.filter((s) => s.status === 'PENDING').length;
    const isTodayFinished = sessions.length > 0 && sessions.every((s) => s.status === 'COMPLETED');
    const totalPeriods = sessions.reduce((acc, s) => acc + s.periodCount, 0);

    return (
        <div className="px-2">
            {/* Section Header */}
            <div className="flex flex-wrap items-center justify-between gap-y-1 mb-3">
                <div className="flex items-center gap-2">
                    <Play size={12} fill="currentColor" className={!isTodayFinished ? 'text-accent-600 dark:text-accent-500' : 'text-slate-400'} />
                    <h2 className={`text-[12px] font-black uppercase tracking-wider ${!isTodayFinished ? 'text-accent-600 dark:text-accent-500' : 'text-slate-700 dark:text-slate-300'}`}>
                        {isTodayFinished
                            ? t('stats.today.summaryCompleted', { sessions: sessions.length, periods: totalPeriods })
                            : t('stats.today.summaryTotal', { sessions: sessions.length, periods: totalPeriods })
                        }
                    </h2>
                </div>
                {!isTodayFinished && pendingCount > 0 && (
                    <div className="flex items-center gap-2 text-xs ml-auto">
                        <span className="text-slate-400 font-medium whitespace-nowrap">{t('stats.today.upcomingCount', { count: pendingCount })}</span>
                    </div>
                )}
            </div>

            {/* Cards */}
            <div className="space-y-3">
                {activeSessions.map((session, idx) => (
                    <SessionCard 
                        key={`${session.courseCode}-${idx}`} 
                        session={session} 
                        status={session.status} 
                        abbreviations={abbreviations} 
                        startTimeStr={session.startTimeStr}
                        endTimeStr={session.endTimeStr}
                    />
                ))}

                {completedSessions.length > 0 && (
                    <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 mt-6">
                        {!isTodayFinished && (
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                                {t('common.completedItem')}
                            </h3>
                        )}
                        <div className="space-y-4">
                            {completedSessions.map((s, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                    <div className="flex items-center gap-1 font-bold shrink-0 min-w-[78px] text-[12px] font-num">
                                        <span className="text-slate-500 dark:text-slate-400">{s.startTimeStr}</span>
                                        <span className="text-slate-300 dark:text-slate-700 font-light">/</span>
                                        <span className="text-slate-400 dark:text-slate-500 font-medium">{s.endTimeStr}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="font-semibold text-slate-600 dark:text-slate-400 truncate block">{abbreviations[s.courseName] || s.courseName}</span>
                                    </div>
                                    <div className="shrink-0 text-right ml-2 min-w-0 max-w-[120px]">
                                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold truncate block">
                                            {formatClassDisplay(s)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(SessionList);

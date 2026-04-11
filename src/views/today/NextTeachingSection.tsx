/**
 * NextTeachingSection — Preview of the next teaching day.
 * Displays date, session count, and preview of first 2 sessions.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScheduleStore } from '@/core/stores';
import { getPeriodTimes } from '@/core/constants';
import { formatRoom, formatClassDisplay } from '@/core/schedule/schedule.utils';
import type { CourseSession } from '@/core/schedule/schedule.types';
import type { NextTeachingInfo, DisplayState } from './today.types';

interface NextTeachingSectionProps {
    nextTeaching: NextTeachingInfo;
    displayState: DisplayState;
    isTodayFinished: boolean;
    isWeekEmpty?: boolean;
    now: Date;
}

const getTimeStr = (session: CourseSession) => {
    const startP = parseInt(session.timeSlot.split('-')[0]);
    const times = getPeriodTimes(session.type);
    const periodStart = times[startP];
    return periodStart ? `${String(periodStart.start[0]).padStart(2, '0')}:${String(periodStart.start[1]).padStart(2, '0')}` : '07:00';
};

const NextTeachingSection: React.FC<NextTeachingSectionProps> = ({ nextTeaching, displayState, isTodayFinished, isWeekEmpty, now }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const abbreviations = useScheduleStore((s) => s.abbreviations);
    const setCurrentWeekIndex = useScheduleStore((s) => s.setCurrentWeekIndex);

    const dayNames = [t('days.6'), t('days.0'), t('days.1'), t('days.2'), t('days.3'), t('days.4'), t('days.5')];
    const dayName = dayNames[nextTeaching.date.getDay()];
    const dateStr = `${String(nextTeaching.date.getDate()).padStart(2, '0')}/${String(nextTeaching.date.getMonth() + 1).padStart(2, '0')}/${nextTeaching.date.getFullYear()}`;

    // Relative time calculation (uses mock-aware `now`)
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const target = new Date(nextTeaching.date); target.setHours(0, 0, 0, 0);
    const daysUntil = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const relativeLabel = daysUntil === 1 ? t('stats.today.tomorrow', { defaultValue: 'Ngày mai' })
        : daysUntil >= 2 && daysUntil <= 3 ? t('stats.today.inDays', { defaultValue: 'Sau {{count}} ngày', count: daysUntil })
        : null;

    const isBeforeSemester = displayState === 'BEFORE_SEMESTER';
    const isNoSessions = displayState === 'NO_SESSIONS';
    const showHighlight = isTodayFinished || isBeforeSemester || isNoSessions;

    const handleClick = () => {
        setCurrentWeekIndex(nextTeaching.weekIdx);
        if (isWeekEmpty) {
            navigate('/semester', { state: { autoExpandWeek: nextTeaching.weekIdx } });
        } else {
            navigate('/week');
        }
    };

    return (
        <div className="px-2 mt-8">
            <div className="flex items-center gap-2 mb-4">
                <Play size={12} fill="currentColor" className={showHighlight ? 'text-accent-600 dark:text-accent-500' : 'text-slate-400'} />
                <h2 className={`text-[12px] font-black uppercase tracking-wider ${showHighlight ? 'text-accent-600 dark:text-accent-500' : 'text-slate-700 dark:text-slate-300'}`}>
                    {isBeforeSemester ? t('stats.today.firstOfSemester') : t('stats.today.next')}
                </h2>
            </div>

            <button
                onClick={handleClick}
                className={`w-full text-left rounded-2xl p-5 border-2 transition-all group ${showHighlight
                    ? 'bg-white dark:bg-slate-900 border-accent-600 dark:border-accent-500 shadow-xl shadow-accent-500/10 ring-1 ring-accent-500/10'
                    : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                    } hover:border-accent-400 dark:hover:border-accent-600 shadow-sm`}
            >
                <div className="mb-4">
                    <div className="flex items-start justify-between gap-4 mb-1.5">
                        <p className="flex flex-wrap items-center gap-1.5 text-[11px] leading-tight pt-1">
                            {relativeLabel && (
                                <>
                                    <span className={`normal-case font-semibold ${daysUntil === 1 ? 'text-accent-600 dark:text-accent-500' : 'text-slate-600 dark:text-slate-400'}`}>
                                        {relativeLabel}
                                    </span>
                                    <span className="opacity-50 text-slate-400 dark:text-slate-500 font-bold">•</span>
                                </>
                            )}
                            <span className={`font-num ${relativeLabel ? 'font-medium text-slate-700 dark:text-slate-200' : 'font-bold text-slate-700 dark:text-slate-200'}`}>
                                {getTimeStr(nextTeaching.sessions[0])}
                            </span>
                        </p>
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 -mt-1 -mr-1 ${
                            showHighlight
                                ? 'text-accent-600 dark:text-accent-400 bg-accent-50/60 dark:bg-accent-950/20 group-hover:bg-accent-100 dark:group-hover:bg-accent-900/40'
                                : 'text-slate-400 dark:text-slate-500 bg-transparent group-hover:bg-slate-100 dark:group-hover:bg-slate-800'
                        }`}>
                            <ChevronRight size={18} strokeWidth={2.5} />
                        </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-2">
                        <h3 className={`text-base leading-snug line-clamp-2 mb-1 ${showHighlight ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
                            {abbreviations[nextTeaching.sessions[0].courseName] || nextTeaching.sessions[0].courseName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs font-medium mt-1.5">
                            <span className={`truncate ${showHighlight ? 'font-bold text-slate-700 dark:text-slate-200' : 'font-bold text-slate-500 dark:text-slate-400'}`}>{formatRoom(nextTeaching.sessions[0].room)}</span>
                            <span className="opacity-40 shrink-0">•</span>
                            <span className="truncate text-slate-400 dark:text-slate-500">{formatClassDisplay(nextTeaching.sessions[0])}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-3.5 border-t border-slate-100 dark:border-slate-800/50">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {dayName}, {dateStr}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {nextTeaching.sessions.length === 1 
                            ? t('common.oneSession', { defaultValue: '1 BUỔI DẠY' }) 
                            : t('stats.today.sessionsCount', { count: nextTeaching.sessions.length })
                        }
                    </p>
                </div>
            </button>
        </div>
    );
};

export default React.memo(NextTeachingSection);

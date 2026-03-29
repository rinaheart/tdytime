/**
 * NextTeachingSection — Preview of the next teaching day.
 * Displays date, session count, and preview of first 2 sessions.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Clock, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScheduleStore } from '@/core/stores';
import { getPeriodTimes } from '@/core/constants';
import type { CourseSession } from '@/core/schedule/schedule.types';
import type { NextTeachingInfo, DisplayState } from './useTodayData';

interface NextTeachingSectionProps {
    nextTeaching: NextTeachingInfo;
    displayState: DisplayState;
    isTodayFinished: boolean;
    isWeekEmpty?: boolean;
}

const getTimeStr = (session: CourseSession) => {
    const startP = parseInt(session.timeSlot.split('-')[0]);
    const times = getPeriodTimes(session.type);
    const periodStart = times[startP];
    return periodStart ? `${String(periodStart.start[0]).padStart(2, '0')}:${String(periodStart.start[1]).padStart(2, '0')}` : '07:00';
};

const NextTeachingSection: React.FC<NextTeachingSectionProps> = ({ nextTeaching, displayState, isTodayFinished, isWeekEmpty }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const abbreviations = useScheduleStore((s) => s.abbreviations);
    const setCurrentWeekIndex = useScheduleStore((s) => s.setCurrentWeekIndex);

    const dayNames = [t('days.6'), t('days.0'), t('days.1'), t('days.2'), t('days.3'), t('days.4'), t('days.5')];
    const dayName = dayNames[nextTeaching.date.getDay()];
    const dateStr = `${String(nextTeaching.date.getDate()).padStart(2, '0')}/${String(nextTeaching.date.getMonth() + 1).padStart(2, '0')}/${nextTeaching.date.getFullYear()}`;

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
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-12">
                        <p className="text-accent-600 dark:text-accent-400 font-black text-[10px] uppercase tracking-widest mb-1.5 opacity-80">
                            {dayName}, {dateStr}
                        </p>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                            {abbreviations[nextTeaching.sessions[0].courseName] || nextTeaching.sessions[0].courseName}
                        </h3>
                    </div>
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-950/30 flex items-center justify-center text-accent-600 dark:text-accent-400 group-hover:bg-accent-600 group-hover:text-white transition-all">
                        <ChevronRight size={20} strokeWidth={2.5} />
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Clock size={14} />
                        <span className="text-xs font-bold leading-none">{getTimeStr(nextTeaching.sessions[0])}</span>
                    </div>
                    <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
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

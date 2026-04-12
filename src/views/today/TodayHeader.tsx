/**
 * TodayHeader — Stacked date display with greeting.
 * Includes conditional exam button based on exam proximity.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { useExamStore } from '@/core/stores/exam.store';
import { getExamProximity, getUpcomingExamCount, hasOngoingExam } from '@/core/exam/exam.utils';

interface TodayHeaderProps {
    dayOfWeekIdx: number;
    dateInfo: { day: string; month: string; year: number };
    greeting: string;
}

const EMPTY_ARRAY: any[] = [];
const TodayHeader: React.FC<TodayHeaderProps> = ({ dayOfWeekIdx, dateInfo, greeting }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const examSessions = useExamStore((s) => s.data?.sessions) || EMPTY_ARRAY;

    const proximity = useMemo(() => getExamProximity(examSessions), [examSessions]);
    const upcomingCount = useMemo(() => getUpcomingExamCount(examSessions, 7), [examSessions]);
    const isOngoing = useMemo(() => hasOngoingExam(examSessions), [examSessions]);

    return (
        <header className="px-2 pt-1 pb-8 md:pb-10 flex justify-between items-start">
            <div className="flex flex-col gap-0.5 select-none">
                <h1 className="text-[22px] md:text-2xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
                    {t(`days.${dayOfWeekIdx}`)}, {dateInfo.day}/{dateInfo.month}/{dateInfo.year}
                </h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-tight text-balance">
                    {greeting}
                </p>
            </div>

            {/* Conditional Exam Button — Prominence scales with proximity */}
            {proximity !== 'none' && (
                <>
                    {/* === DISTANT: Accent Circle (A2) — compact icon only === */}
                    {proximity === 'distant' && (
                        <button
                            onClick={() => navigate('/exam')}
                            className="p-2 mt-1 bg-accent-600 dark:bg-accent-500 text-white rounded-full shadow-md shadow-accent-500/25 hover:bg-accent-700 dark:hover:bg-accent-600 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center shrink-0"
                            title={t('exam.viewAction', 'Xem lịch coi thi')}
                        >
                            <CalendarCheck size={16} strokeWidth={2} />
                        </button>
                    )}

                    {/* === UPCOMING: Pill Badge (A1) — icon + text + count === */}
                    {proximity === 'upcoming' && (
                        <button
                            onClick={() => navigate('/exam')}
                            className="mt-1 px-3 py-1.5 bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 border border-accent-200 dark:border-accent-800 rounded-full hover:bg-accent-100 dark:hover:bg-accent-900/50 hover:shadow-sm transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                        >
                            <CalendarCheck size={14} strokeWidth={2} />
                            <span className="text-xs font-bold tracking-tight">{t('exam.shortLabel', 'Coi thi')}</span>
                            <span className="text-[10px] font-black bg-accent-600 dark:bg-accent-500 text-white rounded-full w-5 h-5 flex items-center justify-center leading-none">
                                {upcomingCount}
                            </span>
                        </button>
                    )}

                    {/* === TODAY: Pill Badge + animation (A1 enhanced) === */}
                    {proximity === 'today' && (
                        <button
                            onClick={() => navigate('/exam')}
                            className="mt-1 px-3 py-1.5 bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 border border-accent-300 dark:border-accent-700 rounded-full hover:bg-accent-100 dark:hover:bg-accent-900/50 hover:shadow-sm transition-all active:scale-95 flex items-center gap-1.5 shrink-0 ring-1 ring-accent-500/20"
                        >
                            {/* Red pulsing dot for ongoing */}
                            {isOngoing && (
                                <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                </span>
                            )}
                            <CalendarCheck size={14} strokeWidth={2} />
                            <span className="text-xs font-bold tracking-tight">
                                {isOngoing ? t('exam.ongoingShort', 'Đang thi') : t('exam.shortLabel', 'Coi thi')}
                            </span>
                            <span className="text-[10px] font-black bg-accent-600 dark:bg-accent-500 text-white rounded-full w-5 h-5 flex items-center justify-center leading-none">
                                {upcomingCount || '!'}
                            </span>
                        </button>
                    )}
                </>
            )}
        </header>
    );
};

export default React.memo(TodayHeader);

/**
 * TodayView — Main Today Dashboard
 * Orchestrates header, session list, empty states, and next teaching preview.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTodayData } from './useTodayData';
import TodayHeader from './TodayHeader';
import SessionList from './SessionList';
import { EmptyState } from '@/ui';
import NextTeachingSection from './NextTeachingSection';
import { PartyPopper } from 'lucide-react';

const TodayView: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { 
        now, dateInfo, dayOfWeekIdx, displayState, todaySessions, 
        nextTeaching, greeting, daysUntilSemester, isWeekEmpty, 
        currentWeekRange, isSemesterOver 
    } = useTodayData();

    const isFinished = todaySessions.length > 0 && todaySessions.every((s) => s.status === 'COMPLETED');

    return (
        <div className="max-w-3xl mx-auto pb-6 animate-in fade-in duration-300">
            <TodayHeader dayOfWeekIdx={dayOfWeekIdx} dateInfo={dateInfo} greeting={greeting} />

            <main className="mt-0">
                {/* Semester Completion Banner (Unified Style) */}
                <div 
                    className={`
                        px-2 overflow-hidden transition-all duration-500 ease-in-out
                        ${isSemesterOver && displayState === 'HAS_SESSIONS' 
                            ? 'max-h-[400px] opacity-100 mb-8' 
                            : 'max-h-0 opacity-0 mb-0'
                        }
                    `}
                    aria-live="polite"
                >
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border-2 border-accent-600 dark:border-accent-500 shadow-xl shadow-accent-500/10 ring-1 ring-accent-500/10 flex flex-col items-center justify-center transition-all">
                        <div className="mb-4 animate-bounce duration-[3000ms]">
                            <PartyPopper size={48} className="text-accent-600 dark:text-accent-400" />
                        </div>

                        <h3 className="text-base font-bold mb-1 text-slate-800 dark:text-slate-200">
                            {t('stats.today.emptyStates.afterSemester')}
                        </h3>

                        <div className="mb-4 text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
                            {t('stats.today.emptyStates.afterSemesterHint')}
                        </div>

                        <button
                            onClick={() => navigate('/stats')}
                            className="text-xs font-bold text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 transition-colors cursor-pointer bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-accent-200 dark:hover:border-accent-800"
                        >
                            {t('stats.today.afterSemester.action', { defaultValue: 'Xem thống kê' })}
                        </button>
                    </div>
                </div>

                {displayState === 'HAS_SESSIONS' ? (
                    <SessionList sessions={todaySessions} />
                ) : (
                    <EmptyState type={displayState} daysUntilStart={daysUntilSemester} isWeekEmpty={isWeekEmpty} currentWeekRange={currentWeekRange} />
                )}

                {nextTeaching && displayState !== 'AFTER_SEMESTER' && (
                    <NextTeachingSection nextTeaching={nextTeaching} displayState={displayState} isTodayFinished={isFinished} isWeekEmpty={isWeekEmpty} now={now} />
                )}
            </main>
        </div>
    );
};

export default React.memo(TodayView);

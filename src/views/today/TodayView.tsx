/**
 * TodayView — Main Today Dashboard
 * Orchestrates header, session list, empty states, and next teaching preview.
 */

import React from 'react';
import { useTodayData } from './useTodayData';
import TodayHeader from './TodayHeader';
import SessionList from './SessionList';
import { EmptyState } from '@/ui';
import NextTeachingSection from './NextTeachingSection';

const TodayView: React.FC = () => {
    const { now, dateInfo, dayOfWeekIdx, displayState, todaySessions, nextTeaching, greeting, daysUntilSemester, isWeekEmpty, currentWeekRange } = useTodayData();

    const isFinished = todaySessions.length > 0 && todaySessions.every((s) => s.status === 'COMPLETED');

    return (
        <div className="max-w-3xl mx-auto pb-24 animate-in fade-in duration-300">
            <TodayHeader dayOfWeekIdx={dayOfWeekIdx} dateInfo={dateInfo} greeting={greeting} />

            <main className="mt-0">
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

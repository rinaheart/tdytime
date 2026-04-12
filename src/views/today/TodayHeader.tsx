/**
 * TodayHeader — Stacked date display with greeting.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

interface TodayHeaderProps {
    dayOfWeekIdx: number;
    dateInfo: { day: string; month: string; year: number };
    greeting: string;
}

const TodayHeader: React.FC<TodayHeaderProps> = ({ dayOfWeekIdx, dateInfo, greeting }) => {
    const { t } = useTranslation();

    return (
        <header className="px-2 pt-1 pb-8 md:pb-10">
            <div className="flex flex-col gap-0.5 select-none">
                <h1 className="text-[22px] md:text-2xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
                    {t(`days.${dayOfWeekIdx}`)}, {dateInfo.day}/{dateInfo.month}/{dateInfo.year}
                </h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-tight text-balance">
                    {greeting}
                </p>
            </div>
        </header>
    );
};

export default React.memo(TodayHeader);
